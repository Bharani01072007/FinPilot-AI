"""Authentication REST Controller Endpoints.

Provides public and protected API routes for user registration, authentication, token rotation,
multi-device logout, profile management, and password recovery.
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.modules.identity.dependencies import get_current_user
from app.modules.identity.models import User
from app.modules.identity.schemas.auth import (
    APIResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    RefreshTokenRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.modules.identity.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request headers or socket."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


@router.post(
    "/register",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="User Registration",
    description="Register a new platform user with 12-character password policy validation and default Customer role.",
)
def register(
    req: UserRegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> APIResponse[UserResponse]:
    user = auth_service.register_user(
        db=db,
        req=req,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return APIResponse(
        success=True,
        message="User registered successfully",
        data=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=APIResponse[TokenResponse],
    status_code=status.HTTP_200_OK,
    summary="User Login",
    description="Authenticate user with email and password with lockout protection, returning JWT Access and Refresh Tokens.",
)
def login(
    req: UserLoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> APIResponse[TokenResponse]:
    tokens = auth_service.authenticate_user(
        db=db,
        req=req,
        device=request.headers.get("user-agent"),
        ip_address=get_client_ip(request),
    )
    return APIResponse(
        success=True,
        message="Login successful",
        data=tokens,
    )


@router.post(
    "/refresh",
    response_model=APIResponse[TokenResponse],
    status_code=status.HTTP_200_OK,
    summary="Rotate Refresh Token",
    description="Exchange active refresh token for a new JWT Access Token and rotated Refresh Token.",
)
def refresh(
    req: RefreshTokenRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> APIResponse[TokenResponse]:
    tokens = auth_service.refresh_token(
        db=db,
        req=req,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return APIResponse(
        success=True,
        message="Token refreshed successfully",
        data=tokens,
    )


@router.post(
    "/logout",
    response_model=APIResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Single Device Logout",
    description="Invalidate current device refresh token session.",
)
def logout(
    req: RefreshTokenRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> APIResponse[None]:
    auth_service.logout_user(
        db=db,
        refresh_token=req.refresh_token,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return APIResponse(
        success=True,
        message="Logout successful",
        data=None,
    )


@router.post(
    "/logout-all",
    response_model=APIResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Logout From All Devices",
    description="Revoke all active authentication sessions across all devices for current user.",
)
def logout_all(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[None]:
    auth_service.logout_all_devices(
        db=db,
        user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return APIResponse(
        success=True,
        message="All active sessions have been revoked successfully",
        data=None,
    )


@router.get(
    "/me",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Current User Profile",
    description="Fetch current authenticated user profile.",
)
def get_me(
    current_user: User = Depends(get_current_user),
) -> APIResponse[UserResponse]:
    return APIResponse(
        success=True,
        message="User profile retrieved successfully",
        data=UserResponse.model_validate(current_user),
    )


@router.put(
    "/change-password",
    response_model=APIResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Change Password",
    description="Change password for current authenticated user and revoke active sessions.",
)
def change_password(
    req: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[None]:
    auth_service.change_password(
        db=db,
        user_id=current_user.id,
        req=req,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return APIResponse(
        success=True,
        message="Password updated successfully. Please log in again.",
        data=None,
    )


@router.post(
    "/forgot-password",
    response_model=APIResponse[Dict[str, Any]],
    status_code=status.HTTP_200_OK,
    summary="Forgot Password Request",
    description="Request password reset token interface.",
)
def forgot_password(
    req: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> APIResponse[Dict[str, Any]]:
    res = auth_service.forgot_password_request(
        db=db,
        req=req,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return APIResponse(
        success=True,
        message=res["message"],
        data=res,
    )


@router.post(
    "/reset-password",
    response_model=APIResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Reset Password",
    description="Reset user password using valid reset token.",
)
def reset_password(
    req: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> APIResponse[None]:
    auth_service.reset_password(
        db=db,
        req=req,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return APIResponse(
        success=True,
        message="Password has been reset successfully. Please log in with your new password.",
        data=None,
    )
