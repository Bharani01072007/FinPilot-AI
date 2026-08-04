"""Authentication & Authorization Pydantic Schemas.

Defines request/response models with 12-character enterprise password policy validation and standardized API envelope.
"""

import re
from datetime import datetime
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, EmailStr, Field, field_validator

DataT = TypeVar("DataT")


def validate_password_strength(password: str) -> str:
    """Validate password against enterprise security policy.

    Policy:
    - Minimum 12 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 digit
    - At least 1 special character
    """
    if len(password) < 12:
        raise ValueError("Password must be at least 12 characters long")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"[0-9]", password):
        raise ValueError("Password must contain at least one number")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\\/\[\]~`]', password):
        raise ValueError("Password must contain at least one special character")
    return password


class UserRegisterRequest(BaseModel):
    """User registration payload model."""

    email: EmailStr = Field(..., description="User email address")
    first_name: str = Field(..., min_length=1, max_length=100, description="User first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="User last name")
    phone: Optional[str] = Field(default=None, description="Optional phone number")
    password: str = Field(..., description="Plain password conforming to 12-character security policy")
    role: Optional[str] = Field(default="customer", description="Target role (customer, employee, manager)")

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        return validate_password_strength(v)


class UserLoginRequest(BaseModel):
    """User login payload model."""

    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="User account password")


class Verify2FARequest(BaseModel):
    """2FA OTP verification request model."""

    email: EmailStr = Field(..., description="Registered email address")
    otp_code: str = Field(..., min_length=4, max_length=10, description="Issued 6-digit OTP code")


class OTPResponse(BaseModel):
    """OTP dispatch response model."""

    email: str = Field(..., description="Recipient email address")
    otp_sent: bool = Field(default=True, description="Indicates if 2FA code was dispatched")
    expires_in_minutes: int = Field(default=10, description="OTP validity period in minutes")


class TokenResponse(BaseModel):
    """JWT Access and Refresh token response model."""

    access_token: str = Field(..., description="JWT Bearer access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Authorization token type")
    expires_in: int = Field(..., description="Access token expiration in seconds")
    user: Optional[Any] = Field(default=None, description="Authenticated user profile")


class RefreshTokenRequest(BaseModel):
    """Refresh token request model."""

    refresh_token: str = Field(..., description="Stored active refresh token string")


class ChangePasswordRequest(BaseModel):
    """Change password request model."""

    old_password: str = Field(..., description="Current account password")
    new_password: str = Field(..., description="New password conforming to 12-char policy")

    @field_validator("new_password")
    @classmethod
    def check_new_password(cls, v: str) -> str:
        return validate_password_strength(v)


class ForgotPasswordRequest(BaseModel):
    """Forgot password email request model."""

    email: EmailStr = Field(..., description="Registered email address")


class ResetPasswordRequest(BaseModel):
    """Reset password payload model."""

    reset_token: str = Field(..., description="Password reset verification token")
    new_password: str = Field(..., description="New password conforming to 12-char policy")

    @field_validator("new_password")
    @classmethod
    def check_reset_password(cls, v: str) -> str:
        return validate_password_strength(v)


class RoleResponse(BaseModel):
    """Role information model."""

    id: str
    name: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    """Public User Profile model (excludes password_hash and internal security secrets)."""

    id: str
    tenant_id: Optional[str] = None
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    profile_image: Optional[str] = None
    last_login: Optional[datetime] = None
    email_verified: bool = False
    is_active: bool
    roles: List[RoleResponse] = []

    model_config = {"from_attributes": True}


class APIResponse(BaseModel, Generic[DataT]):
    """Standardized JSON API response envelope structure."""

    success: bool = Field(default=True, description="Indicates request success status")
    message: str = Field(default="Operation completed successfully", description="Descriptive status message")
    data: Optional[DataT] = Field(default=None, description="Response payload data")
