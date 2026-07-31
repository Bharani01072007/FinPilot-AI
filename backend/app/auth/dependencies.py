"""JWT Authentication Dependency Stubs.

Provides JWT-ready security dependency interfaces for future route authentication.
"""

from typing import Dict, Any, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.security import decode_access_token

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user_stub(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> Dict[str, Any]:
    """Dependency stub for resolving current authenticated user from JWT bearer token.

    Note:
        Does not enforce active user lookup until authentication modules are built.

    Returns:
        User claim dictionary payload.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload
