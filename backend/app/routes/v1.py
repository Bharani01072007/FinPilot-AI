"""API Version 1 Router Aggregator Module.

Combines all v1 endpoint routers — complete enterprise platform.
"""

from fastapi import APIRouter
from app.routes.health import router as health_router
from app.modules.identity.routes.auth import router as auth_router
from app.modules.identity.routes.users import router as users_router
from app.modules.identity.routes.roles import router as roles_router
from app.modules.applications.routes.applications import router as applications_router
from app.modules.documents.routes.documents import router as documents_router
from app.modules.documents.routes.vault import router as vault_router
from app.modules.notifications.routes.notifications import router as notifications_router
from app.modules.reports.routes.reports import router as reports_router
from app.modules.ai.routes.ai import router as ai_router
from app.modules.ai.document_intelligence.routes.document_intelligence import router as document_intelligence_router
from app.modules.ai.kyc.routes.kyc import router as kyc_router
from app.modules.ai.risk.routes.risk import router as risk_router
from app.modules.ai.assistant.routes.assistant import router as assistant_router
from app.modules.ai.recommendations.routes.recommendations import router as recommendations_router
from app.modules.ai.orchestration.routes.orchestration import router as orchestration_router

api_v1_router = APIRouter()

# Core Platform
api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(roles_router)
api_v1_router.include_router(applications_router)
api_v1_router.include_router(documents_router)
api_v1_router.include_router(vault_router)
api_v1_router.include_router(notifications_router)
api_v1_router.include_router(reports_router)

# AI Platform Core
api_v1_router.include_router(ai_router)

# AI Agent Suite
api_v1_router.include_router(document_intelligence_router)
api_v1_router.include_router(kyc_router)
api_v1_router.include_router(risk_router)
api_v1_router.include_router(assistant_router)
api_v1_router.include_router(recommendations_router)
api_v1_router.include_router(orchestration_router)
