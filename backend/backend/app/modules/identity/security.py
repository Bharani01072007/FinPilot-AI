"""Identity Module Security Utilities.

Handles bcrypt password hashing (cost factor 12), SHA-256 refresh token hashing,
and JWT access & refresh token claims processing.
"""

import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from app.config.settings import settings

# Password Hashing Context with bcrypt cost factor 12
pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12, deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plain password using bcrypt with cost factor 12."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash string."""
    return pwd_context.verify(plain_password, hashed_password)


def hash_refresh_token(token: str) -> str:
    """Compute SHA-256 hex digest hash for a refresh token string."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(
    user_id: str,
    email: str,
    roles: Optional[List[str]] = None,
    session_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Generate a signed JWT Access Token with enriched claims.

    Claims:
        sub, email, role, session_id, token_type, iat, exp, iss, aud, jti.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {
        "sub": str(user_id),
        "email": email,
        "role": roles or [],
        "session_id": session_id or "",
        "token_type": "access",
        "jti": str(uuid.uuid4()),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
    }
    return jwt.encode(to_encode, settings.JWT_SECRET or settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(
    user_id: str,
    session_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Generate a signed JWT Refresh Token with minimal claims.

    Claims:
        sub, session_id, token_type, iat, exp, iss, aud, jti.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode: Dict[str, Any] = {
        "sub": str(user_id),
        "session_id": session_id or "",
        "token_type": "refresh",
        "jti": str(uuid.uuid4()),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
    }
    return jwt.encode(to_encode, settings.JWT_SECRET or settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT token payload against secret, issuer, and audience.

    Returns:
        Payload dictionary or None if invalid/expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET or settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            audience=settings.JWT_AUDIENCE,
            issuer=settings.JWT_ISSUER,
        )
        return payload
    except JWTError:
        return None
