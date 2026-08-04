"""API Endpoints for Code-Based Agents (Agents 3, 4, 9, 11, 14, 19)"""

from fastapi import APIRouter, UploadFile, File, Form, Body
from typing import Optional, Dict, Any
from app.modules.ai.agents.ocr_agent import OCRDocumentAgent
from app.modules.ai.agents.classification_agent import DocumentClassificationAgent
from app.modules.ai.agents.summarization_agent import AISummarizationAgent
from app.modules.ai.agents.explainable_agent import ExplainableAIAgent
from app.modules.ai.agents.report_agent import ReportGeneratorAgent
from app.modules.ai.agents.auth_agent import AuthenticationAgent

router = APIRouter(prefix="/ai/agents", tags=["Code-Based AI Agents"])

ocr_agent = OCRDocumentAgent()
classification_agent = DocumentClassificationAgent()
summarization_agent = AISummarizationAgent()
explainable_agent = ExplainableAIAgent()
report_agent = ReportGeneratorAgent()
auth_agent = AuthenticationAgent()


@router.post("/ocr", summary="Agent 3: OCR Document Extraction Agent")
async def run_ocr_agent(
    file: UploadFile = File(...),
):
    """Execute Agent 3 OCR extraction workflow pipeline."""
    content = await file.read()
    res = ocr_agent.execute(file_name=file.filename or "uploaded_document.pdf", file_bytes=content, mime_type=file.content_type or "application/pdf")
    return {"success": True, "message": "Agent 3 OCR executed successfully", "data": res["data"]}


@router.post("/classify", summary="Agent 4: Document Classification Agent")
async def run_classification_agent(
    payload: Dict[str, Any] = Body(...),
):
    """Execute Agent 4 document type classification pipeline."""
    text_or_fn = payload.get("text") or payload.get("file_name") or "PAN Card Document"
    res = classification_agent.execute(text_or_filename=text_or_fn)
    return {"success": True, "message": "Agent 4 Classification executed successfully", "data": res["data"]}


@router.post("/summarize", summary="Agent 9: AI Summarization Agent")
async def run_summarization_agent(
    payload: Dict[str, Any] = Body(...),
):
    """Execute Agent 9 document chunking and AI summarization pipeline."""
    text = payload.get("document_text") or "FinPilot borrower income tax returns and banking statement dossier."
    file_name = payload.get("file_name") or "Borrower_Dossier_2026.pdf"
    res = summarization_agent.execute(document_text=text, file_name=file_name)
    return {"success": True, "message": "Agent 9 Summarization executed successfully", "data": res["data"]}


@router.post("/explain", summary="Agent 11: Explainable AI Agent")
async def run_explainable_agent(
    payload: Dict[str, Any] = Body(...),
):
    """Execute Agent 11 explainable AI credit decision pipeline."""
    decision = payload.get("decision") or "APPROVED"
    credit_score = payload.get("credit_score") or 810
    dti_ratio = payload.get("dti_ratio") or 28.5
    res = explainable_agent.execute(decision=decision, credit_score=credit_score, dti_ratio=dti_ratio)
    return {"success": True, "message": "Agent 11 Explainable AI executed successfully", "data": res["data"]}


@router.post("/generate-report", summary="Agent 14: Report Generator Agent")
async def run_report_agent(
    payload: Dict[str, Any] = Body(...),
):
    """Execute Agent 14 analytics report generation & email dispatch pipeline."""
    report_type = payload.get("report_type") or "PORTFOLIO_PERFORMANCE"
    email = payload.get("email") or "manager@finpilot.ai"
    res = report_agent.execute(report_type=report_type, email_recipient=email)
    return {"success": True, "message": "Agent 14 Report Generator executed successfully", "data": res["data"]}


@router.post("/auth-verify", summary="Agent 19: Authentication Agent")
async def run_auth_agent(
    payload: Dict[str, Any] = Body(...),
):
    """Execute Agent 19 2FA authentication, JWT session minting, and RBAC pipeline."""
    email = payload.get("email") or "aarav@finpilot.ai"
    role = payload.get("role") or "customer"
    otp = payload.get("otp_code") or "123456"
    res = auth_agent.execute(email=email, role=role, otp_code=otp)
    return {"success": True, "message": "Agent 19 Authentication Agent executed successfully", "data": res["data"]}
