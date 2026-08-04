"""Central API Router Hub.

Mounts versioned API routers onto the primary application router.
"""

from fastapi import APIRouter
from app.config.settings import settings
from app.routes.v1 import api_v1_router

api_router = APIRouter()

# Mount API v1 router prefix
api_router.include_router(api_v1_router, prefix=settings.API_V1_STR)
