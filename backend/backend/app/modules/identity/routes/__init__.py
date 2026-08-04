"""Identity Domain Routes Package."""

from app.modules.identity.routes.auth import router as auth_router
from app.modules.identity.routes.users import router as users_router
from app.modules.identity.routes.roles import router as roles_router

__all__ = ["auth_router", "users_router", "roles_router"]
