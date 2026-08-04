"""User & Role Management Business Logic Service Module.

Encapsulates administrative User CRUD, account status transitions, role assignments,
session revocations, centralized validators, and administrative audit logging.
"""

from datetime import datetime, timedelta, timezone
import math
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import BaseAppException, NotFoundException
from app.modules.audit.models import AuditLog
from app.modules.identity.models import Role, User, UserSession
from app.modules.identity.repositories.user_management_repository import UserManagementRepository
from app.modules.identity.repositories.user_repository import SessionRepository, UserRepository
from app.modules.identity.schemas.auth import UserResponse
from app.modules.identity.schemas.user import (
    UserCreateRequest,
    UserListResponse,
    UserSearchFilter,
    UserUpdateRequest,
)
from app.modules.identity.security import hash_password
from app.modules.identity.validators import (
    validate_email_format,
    validate_phone_format,
    validate_unique_email,
    validate_unique_phone,
)


class UserManagementService:
    """Service handling administrative User, Role, and Session management logic."""

    def __init__(
        self,
        mgmt_repo: Optional[UserManagementRepository] = None,
        user_repo: Optional[UserRepository] = None,
        session_repo: Optional[SessionRepository] = None,
    ):
        self.mgmt_repo = mgmt_repo or UserManagementRepository()
        self.user_repo = user_repo or UserRepository()
        self.session_repo = session_repo or SessionRepository()

    def _log_admin_action(
        self,
        db: Session,
        action: str,
        actor_id: str,
        target_user_id: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log an administrative action into audit_logs."""
        audit_entry = AuditLog(
            user_id=actor_id,
            entity="User",
            entity_id=target_user_id,
            action=action,
            new_value=details or {},
        )
        db.add(audit_entry)
        db.commit()

    def create_user_by_admin(self, db: Session, req: UserCreateRequest, actor_id: str) -> User:
        """Admin operation to create a new user account with assigned roles."""
        clean_email = validate_email_format(req.email)
        validate_unique_email(db, clean_email)

        clean_phone = None
        if req.phone:
            clean_phone = validate_phone_format(req.phone)
            validate_unique_phone(db, clean_phone)

        user = User(
            email=clean_email,
            first_name=req.first_name,
            last_name=req.last_name,
            phone=clean_phone,
            password_hash=hash_password(req.password),
            is_active=True,
            created_by=actor_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Assign requested roles
        assigned_role_names = []
        for role_name in req.roles:
            role = self.user_repo.get_role_by_name(db, role_name)
            if role:
                self.user_repo.assign_role(db, user.id, role.id)
                assigned_role_names.append(role.name)

        self._log_admin_action(
            db, action="User Created", actor_id=actor_id, target_user_id=user.id, details={"assigned_roles": assigned_role_names}
        )

        return self.user_repo.get_by_id(db, user.id) or user

    def get_user_by_id(self, db: Session, user_id: str) -> User:
        """Fetch user by ID excluding soft-deleted accounts."""
        user = self.user_repo.get_by_id(db, user_id)
        if not user:
            raise NotFoundException(message="User not found")
        return user

    def update_user(self, db: Session, user_id: str, req: UserUpdateRequest, actor_id: str) -> User:
        """Update profile details for target user."""
        user = self.get_user_by_id(db, user_id)

        updated_fields = {}
        if req.first_name is not None:
            user.first_name = req.first_name
            updated_fields["first_name"] = req.first_name
        if req.last_name is not None:
            user.last_name = req.last_name
            updated_fields["last_name"] = req.last_name
        if req.phone is not None:
            clean_phone = validate_phone_format(req.phone)
            validate_unique_phone(db, clean_phone, exclude_user_id=user.id)
            user.phone = clean_phone
            updated_fields["phone"] = clean_phone
        if req.profile_image is not None:
            user.profile_image = req.profile_image
            updated_fields["profile_image"] = req.profile_image

        user.updated_by = actor_id
        db.add(user)
        db.commit()

        self._log_admin_action(
            db, action="User Updated", actor_id=actor_id, target_user_id=user.id, details=updated_fields
        )
        return self.get_user_by_id(db, user.id)

    def soft_delete_user(self, db: Session, user_id: str, actor_id: str) -> None:
        """Soft delete user account."""
        user = self.get_user_by_id(db, user_id)
        self.mgmt_repo.soft_delete_user(db, user)

        # Revoke all user sessions
        self.session_repo.revoke_user_sessions(db, user.id)

        self._log_admin_action(
            db, action="User Deleted", actor_id=actor_id, target_user_id=user.id
        )

    def search_users(self, db: Session, filters: UserSearchFilter) -> UserListResponse:
        """Search, filter, and paginate active users."""
        users, total = self.mgmt_repo.search_users(db, filters)
        total_pages = math.ceil(total / filters.page_size) if total > 0 else 0

        user_responses = [UserResponse.model_validate(u) for u in users]
        return UserListResponse(
            items=user_responses,
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=total_pages,
        )

    # --- Account Status Operations ---

    def activate_user(self, db: Session, user_id: str, actor_id: str) -> User:
        """Activate user account."""
        user = self.get_user_by_id(db, user_id)
        user.is_active = True
        db.add(user)
        db.commit()

        self._log_admin_action(db, action="User Activated", actor_id=actor_id, target_user_id=user.id)
        return user

    def deactivate_user(self, db: Session, user_id: str, actor_id: str) -> User:
        """Deactivate user account and revoke sessions."""
        user = self.get_user_by_id(db, user_id)
        user.is_active = False
        db.add(user)
        db.commit()

        self.session_repo.revoke_user_sessions(db, user.id)
        self._log_admin_action(db, action="User Deactivated", actor_id=actor_id, target_user_id=user.id)
        return user

    def lock_user(self, db: Session, user_id: str, actor_id: str) -> User:
        """Lock user account for 15 minutes."""
        user = self.get_user_by_id(db, user_id)
        user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.add(user)
        db.commit()

        self.session_repo.revoke_user_sessions(db, user.id)
        self._log_admin_action(db, action="Account Lock", actor_id=actor_id, target_user_id=user.id)
        return user

    def unlock_user(self, db: Session, user_id: str, actor_id: str) -> User:
        """Unlock locked user account."""
        user = self.get_user_by_id(db, user_id)
        user.locked_until = None
        user.failed_login_attempts = 0
        db.add(user)
        db.commit()

        self._log_admin_action(db, action="Account Unlock", actor_id=actor_id, target_user_id=user.id)
        return user

    def suspend_user(self, db: Session, user_id: str, actor_id: str) -> User:
        """Suspend user account."""
        user = self.get_user_by_id(db, user_id)
        user.is_active = False
        db.add(user)
        db.commit()

        self.session_repo.revoke_user_sessions(db, user.id)
        self._log_admin_action(db, action="User Suspended", actor_id=actor_id, target_user_id=user.id)
        return user

    def restore_user(self, db: Session, user_id: str, actor_id: str) -> User:
        """Restore soft-deleted user account."""
        user = self.mgmt_repo.get_user_with_deleted(db, user_id)
        if not user:
            raise NotFoundException(message="User not found")

        self.mgmt_repo.restore_user(db, user)
        self._log_admin_action(db, action="User Restored", actor_id=actor_id, target_user_id=user.id)
        return self.get_user_by_id(db, user.id)

    # --- Role Management Operations ---

    def list_roles(self, db: Session) -> List[Role]:
        """List all system roles."""
        return self.mgmt_repo.list_all_roles(db)

    def get_user_roles(self, db: Session, user_id: str) -> List[Role]:
        """List assigned roles for target user."""
        self.get_user_by_id(db, user_id)
        return self.mgmt_repo.get_user_roles(db, user_id)

    def assign_role_to_user(self, db: Session, user_id: str, role_name: str, actor_id: str) -> User:
        """Assign role to user ensuring no duplicate role assignment."""
        user = self.get_user_by_id(db, user_id)
        role = self.user_repo.get_role_by_name(db, role_name)
        if not role:
            raise NotFoundException(message=f"Role '{role_name}' not found")

        existing_roles = [ur.role_id for ur in user.user_roles]
        if role.id in existing_roles:
            raise BaseAppException(message=f"User already has role '{role_name}' assigned", status_code=400)

        self.user_repo.assign_role(db, user.id, role.id)
        self._log_admin_action(
            db, action="Role Assigned", actor_id=actor_id, target_user_id=user.id, details={"assigned_role": role.name}
        )
        return self.get_user_by_id(db, user.id)

    def remove_role_from_user(self, db: Session, user_id: str, role_id: str, actor_id: str) -> User:
        """Remove role assignment from user."""
        user = self.get_user_by_id(db, user_id)
        removed = self.mgmt_repo.remove_user_role(db, user.id, role_id)
        if not removed:
            raise NotFoundException(message="Role assignment not found for this user")

        self._log_admin_action(
            db, action="Role Removed", actor_id=actor_id, target_user_id=user.id, details={"role_id": role_id}
        )
        return self.get_user_by_id(db, user.id)

    # --- Session Management Operations ---

    def get_user_sessions(self, db: Session, user_id: str) -> List[UserSession]:
        """List active sessions for user."""
        self.get_user_by_id(db, user_id)
        return self.mgmt_repo.get_active_user_sessions(db, user_id)

    def revoke_user_session_by_admin(self, db: Session, user_id: str, session_id: str, actor_id: str) -> None:
        """Revoke specific user session by session ID."""
        session = self.session_repo.get_by_session_id(db, session_id)
        if not session or session.user_id != user_id:
            raise NotFoundException(message="Session not found for target user")

        self.session_repo.revoke_session(db, session)
        self._log_admin_action(
            db, action="Session Revoked", actor_id=actor_id, target_user_id=user_id, details={"session_id": session_id}
        )

    def revoke_all_user_sessions_by_admin(self, db: Session, user_id: str, actor_id: str) -> None:
        """Revoke all active user sessions."""
        self.get_user_by_id(db, user_id)
        self.session_repo.revoke_user_sessions(db, user_id)
        self._log_admin_action(
            db, action="User Sessions Revoked", actor_id=actor_id, target_user_id=user_id
        )


user_mgmt_service = UserManagementService()
