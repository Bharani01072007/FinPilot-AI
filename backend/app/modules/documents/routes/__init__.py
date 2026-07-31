"""Document Domain Routes Package."""

from app.modules.documents.routes.documents import router as documents_router
from app.modules.documents.routes.vault import router as vault_router

__all__ = ["documents_router", "vault_router"]
