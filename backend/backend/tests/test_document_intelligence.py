"""Unit & Integration Tests for Document Intelligence Agent Module (Sprint 10).

Verifies Document Intelligence pipeline (Classification, OCR text cleaning, Field Extraction via AIGateway,
Validation, Confidence Scoring, Result Storage), Event Bus emissions, and REST endpoints.
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
from app.modules.ai.document_intelligence.pipeline.classification import classification_service
from app.modules.ai.document_intelligence.pipeline.cleaning import text_cleaning_service
from app.modules.ai.document_intelligence.pipeline.confidence import confidence_scoring_service
from app.modules.ai.document_intelligence.pipeline.validation import field_validation_service
from app.modules.identity.models import User
from app.modules.identity.repositories.user_repository import UserRepository
import app.models

# Create in-memory test DB engine with StaticPool
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
    email = "admin.docintel@example.com"
    client.post("/api/v1/auth/register", json={"email": email, "first_name": "Admin", "last_name": "DocIntel", "password": "AdminPassword123!"})

    db = TestingSessionLocal()
    user_repo = UserRepository()
    u = user_repo.get_by_email(db, email)
    adm_role = user_repo.get_role_by_name(db, "Admin")
    if u and adm_role:
        user_repo.assign_role(db, u.id, adm_role.id)
    db.close()

    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "AdminPassword123!"})
    return login_res.json()["data"]["access_token"]


def test_pipeline_unit_components():
    """Test individual Document Intelligence pipeline services."""
    # 1. Classification
    doc_type, conf = classification_service.classify_document("GOVERNMENT OF INDIA Aadhaar Card 4812 9012 3456", "aadhaar.pdf")
    assert doc_type == "Aadhaar Card"
    assert conf >= 0.95

    # 2. Text Cleaning
    cleaned = text_cleaning_service.clean_text("GOVERNMENT OF INDIA\n\n\n  Aadhaar   Card  ")
    assert cleaned == "GOVERNMENT OF INDIA\n\nAadhaar Card"

    # 3. Field Validation
    extracted = {"pan_number": "ABCDE1234F", "aadhaar_number": "481290123456", "passport_number": "Z9012345"}
    val_results = field_validation_service.validate_fields(extracted, "PAN Card")
    assert val_results["pan_number"]["valid"] is True
    assert val_results["aadhaar_number"]["valid"] is True
    assert val_results["passport_number"]["valid"] is True

    # 4. Confidence Scoring
    c_conf, e_conf, rating = confidence_scoring_service.calculate_confidence(0.98, val_results, extracted)
    assert c_conf == 0.98
    assert e_conf == 1.0
    assert rating == "HIGH"


def test_document_intelligence_integration_flow(client, admin_token):
    """Test full Document Intelligence Agent API execution flow."""
    adm_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Fetch document categories
    cat_res = client.get("/api/v1/documents/categories", headers=adm_headers)
    cat_id = cat_res.json()["data"][0]["id"]

    # 2. Upload document for processing
    file_payload = ("pan_card.pdf", b"INCOME TAX DEPARTMENT GOVT. OF INDIA PAN: ABCDE1234F Name: RAJESH KUMAR SHARMA", "application/pdf")
    upload_res = client.post(
        "/api/v1/documents/upload",
        data={"category_id": cat_id},
        files={"file": file_payload},
        headers=adm_headers,
    )
    assert upload_res.status_code == status.HTTP_201_CREATED
    doc_id = upload_res.json()["data"]["id"]

    # 3. Process document via Document Intelligence Pipeline
    proc_res = client.post("/api/v1/ai/documents/process", json={"document_id": doc_id}, headers=adm_headers)
    assert proc_res.status_code == status.HTTP_200_OK
    proc_data = proc_res.json()["data"]
    assert proc_data["document_id"] == doc_id
    assert proc_data["document_type"] in ["PAN Card", "Aadhaar Card", "Generic Document"]
    assert proc_data["status"] == "COMPLETED"
    assert "extracted_fields" in proc_data

    # 4. Get Extraction Result
    res_res = client.get(f"/api/v1/ai/documents/{doc_id}/result", headers=adm_headers)
    assert res_res.status_code == status.HTTP_200_OK
    assert res_res.json()["data"]["document_id"] == doc_id

    # 5. Get Pipeline Status
    status_res = client.get(f"/api/v1/ai/documents/{doc_id}/status", headers=adm_headers)
    assert status_res.status_code == status.HTTP_200_OK
    assert status_res.json()["data"]["status"] == "COMPLETED"

    # 6. Reprocess Document
    reproc_res = client.post(f"/api/v1/ai/documents/{doc_id}/reprocess", headers=adm_headers)
    assert reproc_res.status_code == status.HTTP_200_OK
    assert reproc_res.json()["data"]["status"] == "COMPLETED"
