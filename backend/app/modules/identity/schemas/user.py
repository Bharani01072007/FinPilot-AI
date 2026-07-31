"""User & Role Management Pydantic Schemas.

Defines request/response models for user CRUD, search/filtering, role assignments, and session tracking.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.modules.identity.schemas.auth import UserResponse, validate_password_strength


class UserCreateRequest(BaseModel):
    """Admin request schema for creating a new user account."""

    email: EmailStr = Field(..., description="User email address")
    first_name: str = Field(..., min_length=1, max_length=100, description="User first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="User last name")
    phone: Optional[str] = Field(default=None, description="Optional phone number")
    password: str = Field(..., description="Plain password conforming to 12-char policy")
    roles: List[str] = Field(default=["Customer"], description="List of role names to assign")

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        return validate_password_strength(v)


class UserUpdateRequest(BaseModel):
    """Request schema for updating user profile fields."""

    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    phone: Optional[str] = Field(default=None)
    profile_image: Optional[str] = Field(default=None)


class AssignRoleRequest(BaseModel):
    """Request schema for assigning a role to a user."""

    role_name: str = Field(..., description="Target role name (e.g. Customer, Employee, Manager, Admin)")


class UserSessionResponse(BaseModel):
    """User active session item model."""

    id: str
    user_id: str
    device: Optional[str] = None
    browser: Optional[str] = None
    ip_address: Optional[str] = None
    last_activity: datetime
    expires_at: datetime
    status: str

    model_config = {"from_attributes": True}


class UserSearchFilter(BaseModel):
    """User search and pagination filter parameters."""

    search: Optional[str] = Field(default=None, description="Search term across name, email, phone")
    role: Optional[str] = Field(default=None, description="Filter by assigned role name")
    is_active: Optional[bool] = Field(default=None, description="Filter by active state")
    sort_by: str = Field(default="created_at", description="Field name to sort by (created_at, email, first_name)")
    sort_order: str = Field(default="desc", description="Sort direction (asc, desc)")
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=10, ge=1, le=100, description="Items per page")


class UserListResponse(BaseModel):
    """Paginated user list response envelope."""

    items: List[UserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
