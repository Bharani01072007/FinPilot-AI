"""FastAPI Application Main Entrypoint.

Initializes FastAPI application instance, Security Headers middleware, global exception handlers,
Swagger HTTPBearer security configuration, and mounts API routers.
"""

import uvicorn
from fastapi import FastAPI, Request
from fastapi.openapi.utils import get_openapi
from starlette.middleware.base import BaseHTTPMiddleware
from app.api.router import api_router
from app.config.settings import settings
from app.core.exceptions import (
    BaseAppException,
    custom_app_exception_handler,
    global_exception_handler,
)
from app.core.logging import logger
from app.middlewares.cors import setup_cors_middleware
from app.middlewares.logging_middleware import RequestLoggingMiddleware
from app.routes.health import router as root_health_router


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware enforcing production security headers on all HTTP responses."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


def custom_openapi(app: FastAPI):
    """Custom OpenAPI schema generator injecting JWT HTTPBearer security scheme into Swagger UI."""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=settings.APP_NAME,
        version="1.0.0",
        description="FinPilot AI - Enterprise AI-powered Financial Operations Platform Backend",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "HTTPBearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your JWT Access Token to authorize requests.",
        }
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema


def create_app() -> FastAPI:
    """Factory function creating and configuring FastAPI application.

    Returns:
        Configured FastAPI application instance.
    """
    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        description="FinPilot AI - Enterprise AI-powered Financial Operations Platform Backend",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
    )

    # 1. Configure CORS & Security Middlewares
    setup_cors_middleware(app)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    # 2. Register Custom Exception Handlers
    app.add_exception_handler(BaseAppException, custom_app_exception_handler)
    app.add_exception_handler(Exception, global_exception_handler)

    # 3. Mount Root Direct Endpoints (GET /health)
    app.include_router(root_health_router)

    # 4. Mount API V1 Central Router (/api/v1)
    app.include_router(api_router)

    # 5. Configure Swagger OpenAPI Security
    app.openapi = lambda: custom_openapi(app)

    logger.info("Application %s successfully initialized with Security Headers & Swagger JWT Bearer Auth.", settings.APP_NAME)
    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
