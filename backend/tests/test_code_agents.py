"""Unit tests for Code-Based Agents (Agents 3, 4, 9, 11, 14, 19)."""

import pytest
from app.modules.ai.agents.ocr_agent import OCRDocumentAgent
from app.modules.ai.agents.classification_agent import DocumentClassificationAgent
from app.modules.ai.agents.summarization_agent import AISummarizationAgent
from app.modules.ai.agents.explainable_agent import ExplainableAIAgent
from app.modules.ai.agents.report_agent import ReportGeneratorAgent
from app.modules.ai.agents.auth_agent import AuthenticationAgent


def test_agent_3_ocr():
    agent = OCRDocumentAgent()
    res = agent.execute(file_name="pan_card.pdf", file_bytes=b"sample_bytes", mime_type="application/pdf")
    assert res["status"] == "SUCCESS"
    assert res["data"]["document_type"] == "PAN_CARD"
    assert res["data"]["confidence_score"] >= 95.0
    assert len(res["data"]["extracted_fields"]) > 0


def test_agent_4_classification():
    agent = DocumentClassificationAgent()
    res = agent.execute(text_or_filename="Salary Slip for July 2026")
    assert res["status"] == "SUCCESS"
    assert res["data"]["detected_category"] == "Salary Slip"
    assert res["data"]["category_id"] == "cat-income"
    assert res["data"]["confidence_score"] >= 90.0


def test_agent_9_summarization():
    agent = AISummarizationAgent()
    res = agent.execute(document_text="Borrower annual income tax return and balance sheet.", file_name="ITR_2026.pdf")
    assert res["status"] == "SUCCESS"
    assert len(res["data"]["summary"]) > 0
    assert len(res["data"]["important_clauses"]) > 0
    assert res["data"]["executive_recommendation"]["verdict"] == "RECOMMENDED FOR APPROVAL"


def test_agent_11_explainable_ai():
    agent = ExplainableAIAgent()
    res = agent.execute(decision="APPROVED", credit_score=810, dti_ratio=28.5)
    assert res["status"] == "SUCCESS"
    assert res["data"]["decision"] == "APPROVED"
    assert "approved" in res["data"]["customer_version"].lower()
    assert "AUTOMATED UNDERWRITING" in res["data"]["employee_version"]


def test_agent_14_report_generator():
    agent = ReportGeneratorAgent()
    res = agent.execute(report_type="PORTFOLIO_PERFORMANCE", email_recipient="manager@finpilot.ai")
    assert res["status"] == "SUCCESS"
    assert res["data"]["analytics_summary"]["total_applications"] > 0
    assert len(res["data"]["chart_data_series"]) > 0
    assert res["data"]["email_notification"]["dispatch_status"] == "SENT"


def test_agent_19_authentication():
    agent = AuthenticationAgent()
    res = agent.execute(email="employee@finpilot.ai", role="employee", otp_code="123456")
    assert res["status"] == "SUCCESS"
    assert res["data"]["active_role"] == "employee"
    assert "verify:documents" in res["data"]["permissions"]
    assert res["data"]["otp_verified"] is True
    assert "access_token" in res["data"]["session"]
