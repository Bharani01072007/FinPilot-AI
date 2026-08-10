"""FastAPI Application Main Entrypoint.

Initializes FastAPI application instance, Security Headers middleware, global exception handlers,
Swagger HTTPBearer security configuration, and mounts API routers.
"""

import uvicorn
from fastapi import FastAPI, Request
from fastapi.openapi.utils import get_openapi
from starlette.middleware.base import BaseHTTPMiddleware
import app.models  # Ensures all ORM model mappers are registered
from app.api.router import api_router
from app.config.settings import settings
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError
from app.core.exceptions import (
    BaseAppException,
    custom_app_exception_handler,
    global_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from app.core.logging import logger
from app.middlewares.cors import setup_cors_middleware
from app.middlewares.logging_middleware import RequestLoggingMiddleware
from app.routes.health import router as root_health_router


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware enforcing production security headers on all HTTP responses."""

    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)
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

    # 1. Configure Middlewares (CORSMiddleware added last so it executes first for OPTIONS preflights)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    setup_cors_middleware(app)

    # 2. Register Custom Exception Handlers
    app.add_exception_handler(BaseAppException, custom_app_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, global_exception_handler)

    # 3. Mount Root Direct Endpoints (GET /health)
    app.include_router(root_health_router)

    # 4. Mount API V1 Central Router (/api/v1)
    app.include_router(api_router)

    # 5. Configure Swagger OpenAPI Security
    app.openapi = lambda: custom_openapi(app)

    # 6. Database Initialization & Seeding
    try:
        from app.database.session import SessionLocal
        from app.database.init_db import init_db
        db = SessionLocal()
        init_db(db)
        db.close()
    except Exception as e:
        logger.warning("Auto database initialization note: %s", str(e))

    # 7. Favicon & Logo Syncing
    try:
        import os
        import shutil
        logo_src = r"C:\Users\Bharanidharan\.gemini\antigravity-ide\brain\f26e8112-9d65-4abf-9c5d-212721d67a55\media__1786338972966.jpg"
        if os.path.exists(logo_src):
            project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
            public_dir = os.path.join(project_root, "public")
            assets_dir = os.path.join(project_root, "src", "assets")
            os.makedirs(public_dir, exist_ok=True)
            os.makedirs(assets_dir, exist_ok=True)
            for fname in ["favicon.png", "favicon.ico", "logo.png", "apple-touch-icon.png"]:
                shutil.copy(logo_src, os.path.join(public_dir, fname))
            shutil.copy(logo_src, os.path.join(assets_dir, "logo.png"))
            logger.info("FinPilot AI Favicon & Logo synchronized successfully to public/ and src/assets/")
    except Exception as logo_err:
        logger.warning("Favicon sync notice: %s", str(logo_err))

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
