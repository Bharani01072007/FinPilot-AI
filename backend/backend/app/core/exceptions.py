"""Custom Global Exceptions and Exception Handlers.

Provides custom exception hierarchy and FastAPI exception handler hooks.
"""

from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.core.logging import logger


class BaseAppException(Exception):
    """Base application exception for all domain errors."""

    def __init__(
        self,
        message: str = "An unexpected error occurred",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class NotFoundException(BaseAppException):
    """Raised when a requested resource is not found."""

    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND, details=details)


class DatabaseException(BaseAppException):
    """Raised when a database error occurs."""

    def __init__(self, message: str = "Database operation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, details=details)


class AuthenticationException(BaseAppException):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=status.HTTP_401_UNAUTHORIZED, details=details)


class ForbiddenException(BaseAppException):
    """Raised when permission is denied."""

    def __init__(self, message: str = "Permission denied", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=status.HTTP_403_FORBIDDEN, details=details)


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global fallback exception handler catching unhandled exceptions."""
    logger.error("Unhandled Exception on %s %s: %s", request.method, request.url, str(exc), exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An internal server error occurred.",
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
        },
    )


async def custom_app_exception_handler(request: Request, exc: BaseAppException) -> JSONResponse:
    """Exception handler for application domain exceptions."""
    logger.warning("Domain Exception on %s %s: %s", request.method, request.url, exc.message)
    content: Dict[str, Any] = {
        "error": exc.__class__.__name__,
        "message": exc.message,
        "status": exc.status_code,
    }
    if exc.details:
        content["details"] = exc.details
    return JSONResponse(status_code=exc.status_code, content=content)
