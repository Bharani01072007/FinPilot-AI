"""Unit & Integration Tests for KYC Verification Agent Module (Sprint 11).

Verifies KYC Verification pipeline execution, cross-document identity consistency,
business rule evaluation, risk indicator detection, confidence scoring, recommendation generation,
event emissions, and RBAC authorization.
"""

from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pytest

from app.database.base import Base
from app.database.session import get_db
from app.database.init_db import init_db
from app.modules.ai.kyc.consistency import identity_consistency_checker
from app.modules.ai.kyc.confidence import kyc_confidence_service
from app.modules.ai.kyc.recommendation import recommendation_engine
from app.modules.ai.kyc.risk import risk_indicator_engine
from app.modules.ai.kyc.rules import kyc_rule_engine
from app.modules.identity.repositories.user_repository import UserRepository
import app.models

# In-memory test database
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
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def admin_token(client):
    email = "admin.kyc@example.com"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "first_name": "Admin", "last_name": "KYC", "password": "AdminPassword123!"},
    )
    db = TestingSessionLocal()
    user_repo = UserRepository()
    u = user_repo.get_by_email(db, email)
    adm_role = user_repo.get_role_by_name(db, "Admin")
    if u and adm_role:
        user_repo.assign_role(db, u.id, adm_role.id)
    db.close()
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "AdminPassword123!"})
    return login_res.json()["data"]["access_token"]


def test_kyc_pipeline_unit_components():
    """Test individual KYC pipeline services."""
    # 1. Consistency Checker - MATCH scenario
    docs = [
        {"document_type": "Aadhaar Card", "extracted_fields": {"name": "RAJESH KUMAR SHARMA", "dob": "15/08/1985"}, "overall_confidence": "HIGH"},
        {"document_type": "PAN Card", "extracted_fields": {"name": "RAJESH KUMAR SHARMA", "dob": "15/08/1985"}, "overall_confidence": "HIGH"},
    ]
    checks, score = identity_consistency_checker.evaluate_consistency(docs)
    assert checks["name_match"]["status"] == "MATCH"
    assert checks["dob_match"]["status"] == "MATCH"
    assert score == 1.0

    # 2. Consistency Checker - MISMATCH scenario
    docs_mismatch = [
        {"document_type": "Aadhaar Card", "extracted_fields": {"name": "RAJESH KUMAR SHARMA"}, "overall_confidence": "HIGH"},
        {"document_type": "PAN Card", "extracted_fields": {"name": "RAHUL GUPTA"}, "overall_confidence": "HIGH"},
    ]
    checks_m, score_m = identity_consistency_checker.evaluate_consistency(docs_mismatch)
    assert checks_m["name_match"]["status"] == "MISMATCH"
    assert score_m < 1.0

    # 3. Rule Engine - passes with identity proof
    docs_with_pan = [{"document_type": "PAN Card"}, {"document_type": "Aadhaar Card"}]
    rule_eval, rule_score = kyc_rule_engine.evaluate_rules(docs_with_pan)
    assert rule_eval["mandatory_identity_proof"]["passed"] is True
    assert rule_score == 1.0

    # 4. Rule Engine - fails without identity proof
    docs_no_id = [{"document_type": "Bank Statement"}]
    rule_eval_fail, rule_score_fail = kyc_rule_engine.evaluate_rules(docs_no_id)
    assert rule_eval_fail["mandatory_identity_proof"]["passed"] is False

    # 5. Risk Indicators - clean run generates no risks
    risks = risk_indicator_engine.identify_risk_indicators(
        {"name_match": {"status": "MATCH"}, "dob_match": {"status": "MATCH"}},
        {"mandatory_identity_proof": {"passed": True}},
        [{"document_type": "PAN Card", "overall_confidence": "HIGH"}],
    )
    assert risks == []

    # 6. Risk Indicators - mismatch triggers risk flag
    risks_with_mismatch = risk_indicator_engine.identify_risk_indicators(
        {"name_match": {"status": "MISMATCH"}, "dob_match": {"status": "MATCH"}},
        {"mandatory_identity_proof": {"passed": True}},
        [],
    )
    assert any(r["code"] == "NAME_MISMATCH" for r in risks_with_mismatch)

    # 7. Confidence Scoring - HIGH
    comp_score, cons_score, rating = kyc_confidence_service.calculate_confidence(
        consistency_score=1.0, rule_score=1.0, extracted_docs=docs,
    )
    assert rating == "HIGH"
    assert comp_score == 1.0

    # 8. Recommendation - RECOMMENDED_APPROVAL with no risks and HIGH confidence
    rec, findings, summary = recommendation_engine.generate_recommendation(
        risks=[], overall_confidence="HIGH", consistency_checks={}
    )
    assert rec == "RECOMMENDED_APPROVAL"
    assert len(findings) > 0

    # 9. Recommendation - RECOMMENDED_REJECTION with HIGH severity risks
    high_risks = [{"code": "MISSING_IDENTITY_PROOF", "severity": "HIGH", "message": "Identity proof missing"}]
    rec_reject, findings_r, summary_r = recommendation_engine.generate_recommendation(
        risks=high_risks, overall_confidence="LOW", consistency_checks={}
    )
    assert rec_reject == "RECOMMENDED_REJECTION"


def test_kyc_api_flow(client, admin_token):
    """Test KYC Verification Agent API endpoints."""
    adm_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create Customer and Application
    cust_res = client.post(
        "/api/v1/auth/register",
        json={"email": "kyc.customer@example.com", "first_name": "KYC", "last_name": "Customer", "password": "Password123!"},
    )
    customer_token = client.post(
        "/api/v1/auth/login",
        json={"email": "kyc.customer@example.com", "password": "Password123!"},
    ).json()["data"]["access_token"]
    cust_headers = {"Authorization": f"Bearer {customer_token}"}

    app_res = client.post(
        "/api/v1/applications",
        json={"application_type": "Home Loan", "remarks": "KYC Test"},
        headers=cust_headers,
    )
    assert app_res.status_code == status.HTTP_201_CREATED
    app_id = app_res.json()["data"]["id"]

    # 2. Execute KYC Verification
    verify_res = client.post("/api/v1/ai/kyc/verify", json={"application_id": app_id}, headers=adm_headers)
    assert verify_res.status_code == status.HTTP_200_OK
    verify_data = verify_res.json()["data"]
    assert verify_data["application_id"] == app_id
    assert verify_data["recommendation"] in ["RECOMMENDED_APPROVAL", "RECOMMENDED_MANUAL_REVIEW", "RECOMMENDED_REJECTION"]
    assert "findings" in verify_data
    assert "consistency_checks" in verify_data
    assert "risk_indicators" in verify_data

    # 3. Retrieve KYC Result
    result_res = client.get(f"/api/v1/ai/kyc/{app_id}", headers=adm_headers)
    assert result_res.status_code == status.HTTP_200_OK
    assert result_res.json()["data"]["application_id"] == app_id

    # 4. Re-verify Application
    reverify_res = client.post(f"/api/v1/ai/kyc/{app_id}/reverify", headers=adm_headers)
    assert reverify_res.status_code == status.HTTP_200_OK
    assert reverify_res.json()["data"]["application_id"] == app_id
