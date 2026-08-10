"""Complete unit test suite for all 20 Code-Based AI Agents."""

import pytest
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


def test_agent_1_support():
    agent = CustomerSupportAgent()
    res = agent.execute("What documents do I need to apply for a loan?")
    assert res["status"] == "SUCCESS"
    assert res["data"]["detected_intent"] == "DOCUMENT_REQUIREMENTS"

def test_agent_2_smart_form():
    agent = SmartFormFillingAgent()
    res = agent.execute()
    assert res["status"] == "SUCCESS"
    assert res["data"]["completion_percentage"] == 100.0

def test_agent_3_ocr():
    agent = OCRDocumentAgent()
    res = agent.execute("pan_card.pdf", b"sample_bytes", "application/pdf")
    assert res["status"] == "SUCCESS"
    assert res["data"]["document_type"] == "PAN_CARD"

def test_agent_4_classification():
    agent = DocumentClassificationAgent()
    res = agent.execute("Salary Slip July 2026")
    assert res["status"] == "SUCCESS"
    assert res["data"]["detected_category"] == "Salary Slip"

def test_agent_5_completeness():
    agent = DocumentCompletenessAgent()
    res = agent.execute(product_type="PERSONAL_LOAN")
    assert res["status"] == "SUCCESS"
    assert res["data"]["is_complete"] is True

def test_agent_6_vault():
    agent = AIDocumentVaultAgent()
    res = agent.execute("Aadhaar_Card.pdf")
    assert res["status"] == "SUCCESS"
    assert res["data"]["storage_status"] == "STORED_AND_INDEXED"

def test_agent_7_expiry():
    agent = DocumentExpiryAgent()
    res = agent.execute()
    assert res["status"] == "SUCCESS"
    assert len(res["data"]["expiring_or_expired"]) > 0

def test_agent_8_recommendation():
    agent = AIRecommendationAgent()
    res = agent.execute()
    assert res["status"] == "SUCCESS"
    assert len(res["data"]["recommended_reusable_docs"]) > 0

def test_agent_9_summarization():
    agent = AISummarizationAgent()
    res = agent.execute("Annual dossier and bank balance statements")
    assert res["status"] == "SUCCESS"
    assert len(res["data"]["summary"]) > 0

def test_agent_10_risk():
    agent = RiskAnalysisAgent()
    res = agent.execute(requested_amount=1500000)
    assert res["status"] == "SUCCESS"
    assert res["data"]["risk_score"] > 700

def test_agent_11_explainable():
    agent = ExplainableAIAgent()
    res = agent.execute("APPROVED", 810, 28.5)
    assert res["status"] == "SUCCESS"
    assert "approved" in res["data"]["customer_version"].lower()

def test_agent_12_routing():
    agent = WorkflowRoutingAgent()
    res = agent.execute(requested_amount=1500000)
    assert res["status"] == "SUCCESS"
    assert "Retail Underwriting" in res["data"]["target_department"]

def test_agent_13_notification():
    agent = NotificationAgent()
    res = agent.execute()
    assert res["status"] == "SUCCESS"
    assert len(res["data"]["dispatched_channels"]) == 4

def test_agent_14_report():
    agent = ReportGeneratorAgent()
    res = agent.execute()
    assert res["status"] == "SUCCESS"
    assert res["data"]["analytics_summary"]["total_applications"] > 0

def test_agent_15_manager_analytics():
    agent = ManagerAnalyticsAgent()
    res = agent.execute()
    assert res["status"] == "SUCCESS"
    assert res["data"]["executive_kpis"]["approval_rate_percentage"] > 90

def test_agent_16_rag():
    agent = AIKnowledgeRAGAgent()
    res = agent.execute("What is home loan tenure?")
    assert res["status"] == "SUCCESS"
    assert res["data"]["top_similarity_score"] >= 0.90

def test_agent_17_search():
    agent = GlobalSearchAgent()
    res = agent.execute("Aarav")
    assert res["status"] == "SUCCESS"
    assert res["data"]["total_matches"] > 0

def test_agent_18_audit():
    agent = AuditAgent()
    res = agent.execute("DOCUMENT_VERIFIED")
    assert res["status"] == "SUCCESS"
    assert res["data"]["audit_entry"]["action"] == "DOCUMENT_VERIFIED"

def test_agent_19_auth():
    agent = AuthenticationAgent()
    res = agent.execute("aarav@finpilot.ai", "customer")
    assert res["status"] == "SUCCESS"
    assert res["data"]["otp_verified"] is True

def test_agent_20_status():
    agent = ApplicationStatusAgent()
    res = agent.execute("APP-8921", "APPROVED")
    assert res["status"] == "SUCCESS"
    assert res["data"]["current_status"] == "APPROVED"
