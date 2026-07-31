"""Integration tests for Risk Assessment, Knowledge Assistant, Recommendations, Orchestration, and Compliance modules."""

from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pytest

from app.database.base import Base
from app.database.session import get_db
from app.database.init_db import init_db
from app.modules.ai.kyc.audit import kyc_compliance_audit
from app.modules.ai.risk.assessment.income import income_assessment_service
from app.modules.ai.risk.assessment.employment import employment_stability_service
from app.modules.ai.risk.assessment.debt import debt_indicator_service
from app.modules.ai.risk.confidence import risk_confidence_service
from app.modules.ai.risk.governance import risk_governance_config
from app.modules.ai.assistant.knowledge.sources import knowledge_source
from app.modules.ai.assistant.knowledge.retriever import knowledge_retriever
from app.modules.ai.assistant.session.manager import session_manager
from app.modules.ai.recommendations.engines.document_engine import document_recommendation_engine
from app.modules.ai.orchestration.coordinator import AgentRegistry
from app.modules.ai.orchestration.workflows import WORKFLOW_REGISTRY
from app.modules.compliance.compliance import gdpr_service, data_retention, immutable_audit
from app.modules.identity.repositories.user_repository import UserRepository
from app.core.rate_limiter import RateLimiter
import app.models

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    init_db(db, bind_engine=test_engine)
    db.close()


from app.main import create_app
app = create_app()
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def admin_token(client):
    email = "admin.enterprise@example.com"
    client.post("/api/v1/auth/register", json={
        "email": email, "first_name": "Enterprise", "last_name": "Admin", "password": "AdminPassword123!"
    })
    db = TestingSessionLocal()
    user_repo = UserRepository()
    u = user_repo.get_by_email(db, email)
    role = user_repo.get_role_by_name(db, "Admin")
    if u and role:
        user_repo.assign_role(db, u.id, role.id)
    db.close()
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "AdminPassword123!"})
    return res.json()["data"]["access_token"]


# ─── Module 1: KYC Compliance Audit ───────────────────────────────────────────
def test_kyc_compliance_audit_evidence():
    """Test KYC immutable compliance evidence generation and hash integrity."""
    evidence = kyc_compliance_audit.generate_evidence_payload(
        application_id="app-001",
        actor_id="officer-001",
        recommendation="RECOMMENDED_APPROVAL",
        overall_confidence="HIGH",
        rule_evaluation={"mandatory_identity_proof": {"passed": True}},
        risk_indicators=[],
        consistency_checks={"name_match": {"status": "MATCH"}},
        findings=["All checks passed."],
    )
    assert "evidence_hash" in evidence
    assert len(evidence["evidence_hash"]) == 64  # SHA-256

    is_valid = kyc_compliance_audit.verify_evidence_integrity(evidence)
    assert is_valid is True


# ─── Module 2: Risk Assessment Pipeline ───────────────────────────────────────
def test_risk_assessment_pipeline_units():
    """Test income, employment, debt assessment services."""
    docs_full = [{"document_type": "Salary Slip"}, {"document_type": "Bank Statement"}]
    income_score, income_factors = income_assessment_service.assess(docs_full)
    assert income_score == 1.0
    assert income_factors == []

    employ_score, employ_factors = employment_stability_service.assess(docs_full)
    assert employ_score == 1.0

    debt_score, debt_factors = debt_indicator_service.assess([])
    assert debt_score == 1.0

    # Risk Level Calculation
    risk_level, confidence, explanation = risk_confidence_service.calculate(1.0, 1.0, 1.0, 1.0, 1.0)
    assert risk_level == "LOW"
    assert confidence == "HIGH"

    # Missing docs degrade score
    no_docs: list = []
    inc_score_low, inc_factors_low = income_assessment_service.assess(no_docs)
    assert inc_score_low < 1.0
    assert len(inc_factors_low) > 0


# ─── Module 3: Risk Governance ────────────────────────────────────────────────
def test_risk_governance_config():
    """Test configurable risk governance thresholds and routing."""
    assert risk_governance_config.policy_version == "1.0.0"
    assert risk_governance_config.route_for_review("LOW") == "MANUAL_REVIEW"
    assert risk_governance_config.route_for_review("HIGH") == "MANUAL_REVIEW"
    meta = risk_governance_config.to_metadata()
    assert meta["auto_approve"] is False


# ─── Module 4: Knowledge Assistant ───────────────────────────────────────────
def test_knowledge_assistant_retrieval():
    """Test knowledge source retrieval and session manager."""
    chunks = knowledge_retriever.retrieve("application status", top_k=3)
    assert len(chunks) >= 1
    context = knowledge_retriever.format_context(chunks)
    assert "[Source:" in context

    # Session manager
    session_manager.add_turn("test-session-001", "user", "What is KYC?")
    session_manager.add_turn("test-session-001", "assistant", "KYC verifies your identity.")
    history = session_manager.get_history("test-session-001")
    assert len(history) == 2
    session_manager.clear_session("test-session-001")
    assert session_manager.get_history("test-session-001") == []


def test_assistant_query_endpoint(client):
    """Test Knowledge Assistant /ai/assistant/query endpoint."""
    res = client.post("/api/v1/ai/assistant/query", json={"question": "What documents do I need to upload?"})
    assert res.status_code == status.HTTP_200_OK
    data = res.json()["data"]
    assert "answer" in data
    assert "session_id" in data
    assert "sources" in data


# ─── Module 6: Recommendation Engine ─────────────────────────────────────────
def test_recommendation_engine(client, admin_token):
    """Test document recommendation engine and /ai/recommendations/generate endpoint."""
    adm_headers = {"Authorization": f"Bearer {admin_token}"}

    # Missing Aadhaar and PAN → triggers recommendations
    missing_docs = [{"document_type": "Bank Statement", "overall_confidence": "HIGH"}]
    recs = document_recommendation_engine.generate(missing_docs)
    assert len(recs) >= 2
    assert any(r["type"] == "MISSING_DOCUMENT" for r in recs)

    # API endpoint
    res = client.post(
        "/api/v1/ai/recommendations/generate",
        json={"extracted_docs": missing_docs, "risk_level": "HIGH"},
        headers=adm_headers,
    )
    assert res.status_code == status.HTTP_200_OK
    assert res.json()["data"]["total_recommendations"] >= 1


# ─── Module 8: Multi-Agent Orchestration ─────────────────────────────────────
def test_agent_orchestration(client, admin_token):
    """Test agent registry, workflows, and orchestration endpoints."""
    adm_headers = {"Authorization": f"Bearer {admin_token}"}

    assert "KYC_WORKFLOW" in WORKFLOW_REGISTRY
    assert "RISK_WORKFLOW" in WORKFLOW_REGISTRY
    assert "FULL_ONBOARDING_WORKFLOW" in WORKFLOW_REGISTRY

    agents_res = client.get("/api/v1/ai/orchestration/agents", headers=adm_headers)
    assert agents_res.status_code == status.HTTP_200_OK
    assert "available_workflows" in agents_res.json()["data"]


# ─── Module 12: Security — Rate Limiter ──────────────────────────────────────
def test_rate_limiter():
    """Test token-bucket rate limiter allows and rejects requests."""
    limiter = RateLimiter(max_requests=3, window_seconds=60)
    assert limiter.is_allowed("test-client") is True
    assert limiter.is_allowed("test-client") is True
    assert limiter.is_allowed("test-client") is True
    assert limiter.is_allowed("test-client") is False  # 4th request blocked


# ─── Module 13: Compliance ───────────────────────────────────────────────────
def test_compliance_services():
    """Test GDPR service, data retention policy, and immutable audit hash chaining."""
    export = gdpr_service.generate_data_export("user-001", {"email": "test@example.com"})
    assert "evidence" not in export
    assert export["user_id"] == "user-001"

    erasure = gdpr_service.request_erasure("user-001")
    assert erasure["status"] == "QUEUED"

    assert data_retention.get_retention_days("audit_logs") == 2555
    assert data_retention.get_retention_days("sessions") == 30

    # Hash chaining
    entry1 = {"action": "LOGIN", "user_id": "u1"}
    h1 = immutable_audit.compute_chain_hash(None, entry1)
    entry2 = {"action": "LOGOUT", "user_id": "u1"}
    h2 = immutable_audit.compute_chain_hash(h1, entry2)
    assert h1 != h2
    assert len(h1) == 64


# ─── Module 2: Risk API Flow ─────────────────────────────────────────────────
def test_risk_assessment_api_flow(client, admin_token):
    """Test Risk Assessment Agent API endpoints."""
    adm_headers = {"Authorization": f"Bearer {admin_token}"}

    # Register a dedicated customer for this test
    client.post("/api/v1/auth/register", json={
        "email": "risk.customer@example.com",
        "first_name": "Risk",
        "last_name": "Customer",
        "password": "Password123!",
    })
    login_res = client.post("/api/v1/auth/login", json={
        "email": "risk.customer@example.com", "password": "Password123!"
    })
    assert login_res.status_code == status.HTTP_200_OK
    cust_token = login_res.json()["data"]["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    app_res = client.post(
        "/api/v1/applications",
        json={"application_type": "Personal Loan", "remarks": "Risk test"},
        headers=cust_headers,
    )
    assert app_res.status_code == status.HTTP_201_CREATED
    app_id = app_res.json()["data"]["id"]

    # Assess
    assess_res = client.post("/api/v1/ai/risk/assess", json={"application_id": app_id}, headers=adm_headers)
    assert assess_res.status_code == status.HTTP_200_OK
    data = assess_res.json()["data"]
    assert data["overall_risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert "explanation" in data
    assert "risk_breakdown" in data

    # Get result
    get_res = client.get(f"/api/v1/ai/risk/{app_id}", headers=adm_headers)
    assert get_res.status_code == status.HTTP_200_OK

    # Reassess
    re_res = client.post(f"/api/v1/ai/risk/{app_id}/reassess", headers=adm_headers)
    assert re_res.status_code == status.HTTP_200_OK

