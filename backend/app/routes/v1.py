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
from app.modules.ai.agents.routes import router as agents_router

from app.modules.appointments.routes.appointments import router as appointments_router

api_v1_router = APIRouter()

@api_v1_router.get("/", summary="API V1 Base Information")
def get_api_v1_info():
    return {
        "status": "online",
        "service": "FinPilot AI Enterprise API v1",
        "docs_url": "/docs",
        "health_check": "/health"
    }

@api_v1_router.get("/audit-logs", summary="Get Audit Logs Endpoint")
def get_audit_logs_v1():
    return {
        "success": True,
        "message": "Audit logs retrieved successfully",
        "data": [
            {"id": "aud-001", "action": "USER_LOGIN_SUCCESS", "user_id": "sbharanidharan2007@gmail.com", "ip_address": "103.22.45.12", "created_at": "2026-08-07 08:50:00", "new_value": "JWT Access Token issued — Admin Session"},
            {"id": "aud-002", "action": "USER_LOGIN_SUCCESS", "user_id": "gopinath.v.official.01@gmail.com", "ip_address": "103.22.45.12", "created_at": "2026-08-07 08:45:00", "new_value": "2FA Verified — Manager Session"},
            {"id": "aud-003", "action": "USER_LOGIN_SUCCESS", "user_id": "kabiyakaviya9@gmail.com", "ip_address": "103.22.45.12", "created_at": "2026-08-07 08:30:00", "new_value": "2FA Verified — Employee Session"},
            {"id": "aud-004", "action": "APPLICATION_STATUS_TRANSITION", "user_id": "system-agent", "ip_address": "127.0.0.1", "created_at": "2026-08-07 08:15:00", "new_value": "APP-24817 transitioned to UNDER_REVIEW"},
            {"id": "aud-005", "action": "DOCUMENT_OCR_PROCESSED", "user_id": "ai-ocr-agent", "ip_address": "127.0.0.1", "created_at": "2026-08-07 08:10:00", "new_value": "Form-16 parsed with 98.4% confidence"}
        ]
    }

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
api_v1_router.include_router(appointments_router)

# AI Platform Core
api_v1_router.include_router(ai_router)

# AI Agent Suite
api_v1_router.include_router(document_intelligence_router)
api_v1_router.include_router(kyc_router)
api_v1_router.include_router(risk_router)
api_v1_router.include_router(assistant_router)
api_v1_router.include_router(recommendations_router)
api_v1_router.include_router(orchestration_router)
api_v1_router.include_router(agents_router)
