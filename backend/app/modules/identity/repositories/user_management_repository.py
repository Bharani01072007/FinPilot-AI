"""User Management Repository Module.

Provides data access logic for User search, pagination, role management, soft deletes, and session tracking.
"""

from datetime import datetime, timezone
from typing import Any, List, Optional, Tuple
from sqlalchemy import or_, desc, asc
from sqlalchemy.orm import Session, joinedload
from app.repositories.base import BaseRepository
from app.modules.identity.models import User, Role, UserRole, UserSession
from app.modules.identity.schemas.user import UserSearchFilter


class UserManagementRepository(BaseRepository[User, Any, Any]):
    """Repository extending UserRepository for administrative search, filtering, and role management."""

    def __init__(self):
        super().__init__(model=User)

    def search_users(self, db: Session, filters: UserSearchFilter) -> Tuple[List[User], int]:
        """Dynamically search and paginate active users excluding soft-deleted accounts.

        Returns:
            Tuple of (List[User], total_count).
        """
        base_query = db.query(User).filter(User.is_deleted == False)

        # 1. Free-text Search (First Name, Last Name, Email, Phone)
        if filters.search and filters.search.strip():
            search_term = f"%{filters.search.strip()}%"
            base_query = base_query.filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term),
                    User.phone.ilike(search_term),
                )
            )

        # 2. Filter by Active status
        if filters.is_active is not None:
            base_query = base_query.filter(User.is_active == filters.is_active)

        # 3. Filter by Role
        if filters.role and filters.role.strip():
            base_query = base_query.join(User.user_roles).join(UserRole.role).filter(Role.name.ilike(filters.role.strip()))

        # Total count before pagination
        total_count = base_query.count()

        # 4. Sorting
        sort_col = getattr(User, filters.sort_by, User.created_at)
        if filters.sort_order.lower() == "asc":
            base_query = base_query.order_by(asc(sort_col))
        else:
            base_query = base_query.order_by(desc(sort_col))

        # 5. Pagination with eager loading to eliminate N+1 queries
        skip = (filters.page - 1) * filters.page_size
        users = (
            base_query.options(joinedload(User.user_roles).joinedload(UserRole.role))
            .offset(skip)
            .limit(filters.page_size)
            .all()
        )

        return users, total_count

    def get_user_with_deleted(self, db: Session, user_id: str) -> Optional[User]:
        """Fetch user by ID including soft-deleted accounts (used for restore operations)."""
        return db.query(User).filter(User.id == user_id).first()

    def soft_delete_user(self, db: Session, user: User) -> None:
        """Perform soft delete on user account."""
        user.is_deleted = True
        user.deleted_at = datetime.now(timezone.utc)
        user.is_active = False
        db.add(user)
        db.commit()

    def restore_user(self, db: Session, user: User) -> None:
        """Restore soft-deleted user account."""
        user.is_deleted = False
        user.deleted_at = None
        user.is_active = True
        db.add(user)
        db.commit()

    def list_all_roles(self, db: Session) -> List[Role]:
        """Fetch all system role definitions."""
        return db.query(Role).all()

    def get_user_roles(self, db: Session, user_id: str) -> List[Role]:
        """Fetch assigned roles for target user with eager loading."""
        user_roles = (
            db.query(UserRole)
            .options(joinedload(UserRole.role))
            .filter(UserRole.user_id == user_id)
            .all()
        )
        return [ur.role for ur in user_roles if ur.role]

    def remove_user_role(self, db: Session, user_id: str, role_id: str) -> bool:
        """Remove a role assignment from user."""
        user_role = db.query(UserRole).filter(
            UserRole.user_id == user_id,
            UserRole.role_id == role_id,
        ).first()
        if user_role:
            db.delete(user_role)
            db.commit()
            return True
        return False

    def get_active_user_sessions(self, db: Session, user_id: str) -> List[UserSession]:
        """Fetch active user sessions for target user."""
        return (
            db.query(UserSession)
            .filter(
                UserSession.user_id == user_id,
                UserSession.status == "ACTIVE",
                UserSession.is_deleted == False,
            )
            .all()
        )
