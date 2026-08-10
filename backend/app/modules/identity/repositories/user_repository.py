"""User and Session Repository Module.

Provides data access logic for User, Role, UserRole, and UserSession models with security lockout audit support.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from sqlalchemy.orm import Session, joinedload
from app.config.settings import settings
from app.repositories.base import BaseRepository
from app.modules.identity.models import User, Role, UserRole, UserSession


class UserRepository(BaseRepository[User, Any, Any]):
    """Repository handling User ORM queries, role assignments, and lockout operations."""

    def __init__(self):
        super().__init__(model=User)

    def get_by_id(self, db: Session, user_id: str) -> Optional[User]:
        """Fetch user by ID with loaded roles."""
        return (
            db.query(User)
            .options(joinedload(User.user_roles).joinedload(UserRole.role))
            .filter(User.id == user_id, User.is_deleted == False)
            .first()
        )

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """Fetch user by email address with loaded roles."""
        return (
            db.query(User)
            .options(joinedload(User.user_roles).joinedload(UserRole.role))
            .filter(User.email == email, User.is_deleted == False)
            .first()
        )

    def get_by_phone(self, db: Session, phone: str) -> Optional[User]:
        """Fetch user by phone number."""
        return db.query(User).filter(User.phone == phone, User.is_deleted == False).first()

    def get_role_by_name(self, db: Session, role_name: str) -> Optional[Role]:
        """Fetch role entity by name."""
        return db.query(Role).filter(Role.name == role_name).first()

    def assign_role(self, db: Session, user_id: str, role_id: str) -> UserRole:
        """Assign a role to a user using UserRole join model."""
        user_role = UserRole(user_id=user_id, role_id=role_id)
        db.add(user_role)
        db.commit()
        db.refresh(user_role)
        return user_role

    def update_last_login(self, db: Session, user: User) -> None:
        """Update last_login timestamp and reset failed login counters for a user."""
        user.last_login = datetime.now(timezone.utc)
        user.failed_login_attempts = 0
        user.locked_until = None
        db.add(user)
        db.commit()

    def reset_failed_login(self, db: Session, user: User) -> None:
        """Reset failed login attempts and clear lockout status for a user."""
        user.failed_login_attempts = 0
        user.locked_until = None
        db.add(user)
        db.commit()

    def increment_failed_login(self, db: Session, user: User) -> bool:
        """Increment failed login attempts and lock account if max threshold exceeded.

        Returns:
            True if account was newly locked, False otherwise.
        """
        user.failed_login_attempts += 1
        is_locked = False
        if user.failed_login_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCOUNT_LOCKOUT_MINUTES)
            is_locked = True

        db.add(user)
        db.commit()
        return is_locked


class SessionRepository(BaseRepository[UserSession, Any, Any]):
    """Repository handling UserSession database operations and hashed token lookups."""

    def __init__(self):
        super().__init__(model=UserSession)

    def create_session(
        self,
        db: Session,
        user_id: str,
        refresh_token: str,
        hashed_refresh_token: str,
        expires_at: datetime,
        device: Optional[str] = None,
        browser: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> UserSession:
        """Create a new user authentication session record with hashed refresh token."""
        session = UserSession(
            user_id=user_id,
            refresh_token=refresh_token,
            hashed_refresh_token=hashed_refresh_token,
            expires_at=expires_at,
            device=device,
            browser=browser,
            ip_address=ip_address,
            status="ACTIVE",
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def get_by_hashed_token(self, db: Session, hashed_refresh_token: str) -> Optional[UserSession]:
        """Fetch active user session by hashed refresh token string."""
        return (
            db.query(UserSession)
            .filter(
                UserSession.hashed_refresh_token == hashed_refresh_token,
                UserSession.status == "ACTIVE",
                UserSession.is_deleted == False,
            )
            .first()
        )

    def get_by_session_id(self, db: Session, session_id: str) -> Optional[UserSession]:
        """Fetch user session by ID."""
        return (
            db.query(UserSession)
            .filter(UserSession.id == session_id, UserSession.is_deleted == False)
            .first()
        )

    def revoke_session(self, db: Session, session: UserSession) -> None:
        """Revoke a single user session."""
        session.status = "REVOKED"
        session.revoked_at = datetime.now(timezone.utc)
        db.add(session)
        db.commit()

    def revoke_user_sessions(self, db: Session, user_id: str) -> None:
        """Revoke all active sessions for a user (e.g. on password change or logout-all)."""
        db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.status == "ACTIVE",
        ).update(
            {"status": "REVOKED", "revoked_at": datetime.now(timezone.utc)},
            synchronize_session=False,
        )
        db.commit()
