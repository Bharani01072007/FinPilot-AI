"""Authentication REST Controller Endpoints.

Provides public and protected API routes for real-time user registration, 2FA OTP verification, token rotation,
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
    Verify2FARequest,
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
    response_model=APIResponse[Dict[str, Any]],
    status_code=status.HTTP_201_CREATED,
    summary="User Registration",
    description="Register a new platform user with password validation, database persistence, and 2FA OTP code dispatch.",
)
def register(
    req: UserRegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> APIResponse[Dict[str, Any]]:
    res = auth_service.register_user(
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
    "/request-otp",
    response_model=APIResponse[Dict[str, Any]],
    status_code=status.HTTP_200_OK,
    summary="Request Login 2FA OTP",
    description="Verify email & password, then dispatch 6-digit security OTP to user's email address.",
)
def request_otp(
    req: UserLoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> APIResponse[Dict[str, Any]]:
    res = auth_service.request_login_otp(
        db=db,
        req=req,
        device=request.headers.get("user-agent"),
        ip_address=get_client_ip(request),
    )
    return APIResponse(
        success=True,
        message=res["message"],
        data=res,
    )


@router.post(
    "/verify-2fa",
    response_model=APIResponse[TokenResponse],
    status_code=status.HTTP_200_OK,
    summary="Verify 2FA Code & Mint Session",
    description="Verify 6-digit OTP code against issued email session, minting JWT Access & Refresh Tokens.",
)
def verify_2fa(
    req: Verify2FARequest,
    request: Request,
    db: Session = Depends(get_db),
) -> APIResponse[TokenResponse]:
    tokens = auth_service.verify_2fa_and_mint_session(
        db=db,
        req=req,
        device=request.headers.get("user-agent"),
        ip_address=get_client_ip(request),
    )
    return APIResponse(
        success=True,
        message="2FA authentication verified successfully",
        data=tokens,
    )


@router.post(
    "/resend-2fa",
    response_model=APIResponse[Dict[str, Any]],
    status_code=status.HTTP_200_OK,
    summary="Resend 2FA Code",
    description="Dispatch a new 6-digit security OTP code to registered email address.",
)
def resend_2fa(
    payload: Dict[str, str],
    db: Session = Depends(get_db),
) -> APIResponse[Dict[str, Any]]:
    email = payload.get("email", "")
    res = auth_service.resend_otp(db=db, email=email)
    return APIResponse(
        success=True,
        message=res["message"],
        data=res,
    )


@router.post(
    "/login",
    response_model=APIResponse[TokenResponse],
    status_code=status.HTTP_200_OK,
    summary="Direct User Login",
    description="Authenticate user with email and password, returning JWT Access and Refresh Tokens.",
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
