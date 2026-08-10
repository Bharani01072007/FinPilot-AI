"""API Router for Complete 20-Agent Suite Execution Engines"""

from fastapi import APIRouter, UploadFile, File, Form, Body
from typing import Optional, Dict, Any, List

# Agent Imports (1 to 20)
from app.modules.ai.agents.customer_support_agent import CustomerSupportAgent
from app.modules.ai.agents.smart_form_filling_agent import SmartFormFillingAgent
from app.modules.ai.agents.ocr_agent import OCRDocumentAgent
from app.modules.ai.agents.classification_agent import DocumentClassificationAgent
from app.modules.ai.agents.document_completeness_agent import DocumentCompletenessAgent
from app.modules.ai.agents.vault_agent import AIDocumentVaultAgent
from app.modules.ai.agents.document_expiry_agent import DocumentExpiryAgent
from app.modules.ai.agents.recommendation_agent import AIRecommendationAgent
from app.modules.ai.agents.summarization_agent import AISummarizationAgent
from app.modules.ai.agents.risk_analysis_agent import RiskAnalysisAgent
from app.modules.ai.agents.explainable_agent import ExplainableAIAgent
from app.modules.ai.agents.workflow_routing_agent import WorkflowRoutingAgent
from app.modules.ai.agents.notification_agent import NotificationAgent
from app.modules.ai.agents.report_agent import ReportGeneratorAgent
from app.modules.ai.agents.manager_analytics_agent import ManagerAnalyticsAgent
from app.modules.ai.agents.rag_agent import AIKnowledgeRAGAgent
from app.modules.ai.agents.global_search_agent import GlobalSearchAgent
from app.modules.ai.agents.audit_agent import AuditAgent
from app.modules.ai.agents.auth_agent import AuthenticationAgent
from app.modules.ai.agents.application_status_agent import ApplicationStatusAgent

router = APIRouter(prefix="/ai/agents", tags=["20 Code-Based AI Agents"])

# Instantiate Agent Engines
agent_1_support = CustomerSupportAgent()
agent_2_smart_form = SmartFormFillingAgent()
agent_3_ocr = OCRDocumentAgent()
agent_4_classification = DocumentClassificationAgent()
agent_5_completeness = DocumentCompletenessAgent()
agent_6_vault = AIDocumentVaultAgent()
agent_7_expiry = DocumentExpiryAgent()
agent_8_recommendation = AIRecommendationAgent()
agent_9_summarization = AISummarizationAgent()
agent_10_risk = RiskAnalysisAgent()
agent_11_explainable = ExplainableAIAgent()
agent_12_routing = WorkflowRoutingAgent()
agent_13_notification = NotificationAgent()
agent_14_report = ReportGeneratorAgent()
agent_15_manager_analytics = ManagerAnalyticsAgent()
agent_16_rag = AIKnowledgeRAGAgent()
agent_17_search = GlobalSearchAgent()
agent_18_audit = AuditAgent()
agent_19_auth = AuthenticationAgent()
agent_20_status = ApplicationStatusAgent()


@router.get("/list", summary="List All 20 Code-Based Agents")
def list_all_agents():
    """Return catalog of all 20 code-based agent execution engines."""
    return {
        "success": True,
        "total_agents": 20,
        "agents": [
            {"id": "agent-1", "name": "Customer Support Agent", "endpoint": "/ai/agents/support"},
            {"id": "agent-2", "name": "Smart Form Filling Agent", "endpoint": "/ai/agents/smart-form"},
            {"id": "agent-3", "name": "OCR Document Agent", "endpoint": "/ai/agents/ocr"},
            {"id": "agent-4", "name": "Document Classification Agent", "endpoint": "/ai/agents/classify"},
            {"id": "agent-5", "name": "Document Completeness Agent", "endpoint": "/ai/agents/completeness"},
            {"id": "agent-6", "name": "AI Document Vault Agent", "endpoint": "/ai/agents/vault-store"},
            {"id": "agent-7", "name": "Document Expiry Agent", "endpoint": "/ai/agents/check-expiry"},
            {"id": "agent-8", "name": "AI Recommendation Agent", "endpoint": "/ai/agents/recommend"},
            {"id": "agent-9", "name": "AI Summarization Agent", "endpoint": "/ai/agents/summarize"},
            {"id": "agent-10", "name": "Risk Analysis Agent", "endpoint": "/ai/agents/risk-analyze"},
            {"id": "agent-11", "name": "Explainable AI Agent", "endpoint": "/ai/agents/explain"},
            {"id": "agent-12", "name": "Workflow Routing Agent", "endpoint": "/ai/agents/route-workflow"},
            {"id": "agent-13", "name": "Notification Agent", "endpoint": "/ai/agents/notify"},
            {"id": "agent-14", "name": "Report Generator Agent", "endpoint": "/ai/agents/generate-report"},
            {"id": "agent-15", "name": "Manager Analytics Agent", "endpoint": "/ai/agents/manager-kpis"},
            {"id": "agent-16", "name": "AI Knowledge Agent (RAG)", "endpoint": "/ai/agents/rag-search"},
            {"id": "agent-17", "name": "Global Search Agent", "endpoint": "/ai/agents/global-search"},
            {"id": "agent-18", "name": "Audit Agent", "endpoint": "/ai/agents/audit-log"},
            {"id": "agent-19", "name": "Authentication Agent", "endpoint": "/ai/agents/auth-verify"},
            {"id": "agent-20", "name": "Application Status Agent", "endpoint": "/ai/agents/status-update"},
        ],
    }


# Endpoints for Agent 1 - 20
@router.post("/support", summary="Agent 1: Customer Support Agent")
async def run_agent_1(payload: Dict[str, Any] = Body(...)):
    msg = payload.get("message") or "What documents do I need to apply for a loan?"
    return {"success": True, "data": agent_1_support.execute(user_message=msg)["data"]}

@router.post("/smart-form", summary="Agent 2: Smart Form Filling Agent")
async def run_agent_2():
    return {"success": True, "data": agent_2_smart_form.execute()["data"]}

@router.post("/ocr", summary="Agent 3: OCR Document Extraction Agent")
async def run_agent_3(file: UploadFile = File(...)):
    content = await file.read()
    return {"success": True, "data": agent_3_ocr.execute(file_name=file.filename or "doc.pdf", file_bytes=content, mime_type=file.content_type or "application/pdf")["data"]}

@router.post("/classify", summary="Agent 4: Document Classification Agent")
async def run_agent_4(payload: Dict[str, Any] = Body(...)):
    t = payload.get("text") or payload.get("file_name") or "PAN Card"
    return {"success": True, "data": agent_4_classification.execute(text_or_filename=t)["data"]}

@router.post("/completeness", summary="Agent 5: Document Completeness Agent")
async def run_agent_5(payload: Dict[str, Any] = Body(...)):
    p = payload.get("product_type") or "PERSONAL_LOAN"
    docs = payload.get("uploaded_documents") or ["PAN Card", "Aadhaar Card", "Salary Slip", "Bank Statement"]
    return {"success": True, "data": agent_5_completeness.execute(product_type=p, uploaded_docs=docs)["data"]}

@router.post("/vault-store", summary="Agent 6: AI Document Vault Agent")
async def run_agent_6(payload: Dict[str, Any] = Body(...)):
    fn = payload.get("file_name") or "Aadhaar_Card.pdf"
    ck = payload.get("checksum") or "hash_123"
    return {"success": True, "data": agent_6_vault.execute(file_name=fn, checksum=ck)["data"]}

@router.post("/check-expiry", summary="Agent 7: Document Expiry Agent")
async def run_agent_7():
    return {"success": True, "data": agent_7_expiry.execute()["data"]}

@router.post("/recommend", summary="Agent 8: AI Recommendation Agent")
async def run_agent_8(payload: Dict[str, Any] = Body(...)):
    p = payload.get("application_type") or "PERSONAL_LOAN"
    return {"success": True, "data": agent_8_recommendation.execute(application_type=p)["data"]}

@router.post("/summarize", summary="Agent 9: AI Summarization Agent")
async def run_agent_9(payload: Dict[str, Any] = Body(...)):
    t = payload.get("document_text") or "FinPilot borrower income tax returns and banking statement dossier."
    fn = payload.get("file_name") or "Dossier_2026.pdf"
    return {"success": True, "data": agent_9_summarization.execute(document_text=t, file_name=fn)["data"]}

@router.post("/risk-analyze", summary="Agent 10: Risk Analysis Agent")
async def run_agent_10(payload: Dict[str, Any] = Body(...)):
    amt = payload.get("requested_amount") or 1500000
    inc = payload.get("monthly_income") or 139900
    dti = payload.get("dti_ratio") or 28.5
    return {"success": True, "data": agent_10_risk.execute(requested_amount=amt, monthly_income=inc, dti_ratio=dti)["data"]}

@router.post("/explain", summary="Agent 11: Explainable AI Agent")
async def run_agent_11(payload: Dict[str, Any] = Body(...)):
    dec = payload.get("decision") or "APPROVED"
    score = payload.get("credit_score") or 810
    dti = payload.get("dti_ratio") or 28.5
    return {"success": True, "data": agent_11_explainable.execute(decision=dec, credit_score=score, dti_ratio=dti)["data"]}

@router.post("/route-workflow", summary="Agent 12: Workflow Routing Agent")
async def run_agent_12(payload: Dict[str, Any] = Body(...)):
    app_id = payload.get("application_id") or "APP-8921"
    amt = payload.get("requested_amount") or 1500000
    return {"success": True, "data": agent_12_routing.execute(application_id=app_id, requested_amount=amt)["data"]}

@router.post("/notify", summary="Agent 13: Notification Agent")
async def run_agent_13(payload: Dict[str, Any] = Body(...)):
    event = payload.get("event_type") or "APPLICATION_APPROVED"
    return {"success": True, "data": agent_13_notification.execute(event_type=event)["data"]}

@router.post("/generate-report", summary="Agent 14: Report Generator Agent")
async def run_agent_14(payload: Dict[str, Any] = Body(...)):
    rt = payload.get("report_type") or "PORTFOLIO_PERFORMANCE"
    email = payload.get("email") or "manager@finpilot.ai"
    return {"success": True, "data": agent_14_report.execute(report_type=rt, email_recipient=email)["data"]}

@router.post("/manager-kpis", summary="Agent 15: Manager Analytics Agent")
async def run_agent_15():
    return {"success": True, "data": agent_15_manager_analytics.execute()["data"]}

@router.post("/rag-search", summary="Agent 16: AI Knowledge Agent (RAG)")
async def run_agent_16(payload: Dict[str, Any] = Body(...)):
    q = payload.get("query") or "What is the maximum tenure for home loans?"
    return {"success": True, "data": agent_16_rag.execute(query=q)["data"]}

@router.post("/global-search", summary="Agent 17: Global Search Agent")
async def run_agent_17(payload: Dict[str, Any] = Body(...)):
    q = payload.get("query") or "Aarav"
    return {"success": True, "data": agent_17_search.execute(query=q)["data"]}

@router.post("/audit-log", summary="Agent 18: Audit Agent")
async def run_agent_18(payload: Dict[str, Any] = Body(...)):
    act = payload.get("action") or "DOCUMENT_VERIFIED"
    return {"success": True, "data": agent_18_audit.execute(action=act)["data"]}

@router.post("/auth-verify", summary="Agent 19: Authentication Agent")
async def run_agent_19(payload: Dict[str, Any] = Body(...)):
    email = payload.get("email") or "aarav@finpilot.ai"
    role = payload.get("role") or "customer"
    otp = payload.get("otp_code") or "123456"
    return {"success": True, "data": agent_19_auth.execute(email=email, role=role, otp_code=otp)["data"]}

@router.post("/status-update", summary="Agent 20: Application Status Agent")
async def run_agent_20(payload: Dict[str, Any] = Body(...)):
    app_id = payload.get("application_id") or "APP-8921"
    status = payload.get("status") or "APPROVED"
    return {"success": True, "data": agent_20_status.execute(application_id=app_id, new_status=status)["data"]}
