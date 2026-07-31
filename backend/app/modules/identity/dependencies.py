"""FastAPI Authentication & Authorization Dependencies.

Provides current user authentication resolution and Role-Based Access Control (RBAC) checking.
"""

from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.modules.identity.models import User
from app.modules.identity.repositories.user_repository import UserRepository
from app.modules.identity.security import decode_token

security = HTTPBearer(auto_error=False)
user_repo = UserRepository()


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Dependency extracting and verifying current authenticated user from Bearer JWT.

    Raises:
        HTTPException 401 if missing, invalid, or expired token.
        HTTPException 403 if user is disabled or deleted.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("token_type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed authentication token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = user_repo.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active or user.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or disabled",
        )

    return user


class RequireRoles:
    """Class dependency enforcing Role-Based Access Control (RBAC).

    Usage:
        @router.get("/admin/data", dependencies=[Depends(RequireRoles("Admin", "Manager"))])
    """

    def __init__(self, *allowed_roles: str):
        self.allowed_roles = list(allowed_roles)

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        user_role_names = [ur.role.name for ur in current_user.user_roles if ur.role]
        
        # Admin bypass or check explicit role intersection
        if "Admin" in user_role_names:
            return current_user

        has_permission = any(role in user_role_names for role in self.allowed_roles)
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required role: {', '.join(self.allowed_roles)}",
            )
        return current_user


def require_roles(allowed_roles: List[str]):
    """Reusable helper wrapper for role-based authorization dependencies."""
    return RequireRoles(*allowed_roles)
