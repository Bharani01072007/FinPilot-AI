"""Unit & Integration Tests for Document Management & Document Vault Module (Sprint 6).

Verifies document uploads, version control, verification workflow (verify/reject),
reusable customer document vault linking, tagging, secure downloads, and storage provider integration.
"""

import io
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pytest

from app.database.base import Base
from app.database.session import get_db
from app.database.init_db import init_db
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
def customer_token(client):
    email = "cust.doc@example.com"
    client.post("/api/v1/auth/register", json={"email": email, "first_name": "Cust", "last_name": "Doc", "password": "CustomerPassword123!"})
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "CustomerPassword123!"})
    return login_res.json()["data"]["access_token"]


@pytest.fixture(scope="module")
def manager_token(client):
    email = "mgr.doc@example.com"
    client.post("/api/v1/auth/register", json={"email": email, "first_name": "Mgr", "last_name": "Doc", "password": "ManagerPassword123!"})

    db = TestingSessionLocal()
    user_repo = UserRepository()
    u = user_repo.get_by_email(db, email)
    mgr_role = user_repo.get_role_by_name(db, "Manager")
    if u and mgr_role:
        user_repo.assign_role(db, u.id, mgr_role.id)
    db.close()

    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "ManagerPassword123!"})
    return login_res.json()["data"]["access_token"]


def test_document_upload_verification_vault_and_download_flow(client, customer_token, manager_token):
    """Test full document upload, storage, verification, vault linking, tagging, and secure download."""
    cust_headers = {"Authorization": f"Bearer {customer_token}"}
    mgr_headers = {"Authorization": f"Bearer {manager_token}"}

    # 1. Fetch categories
    cat_res = client.get("/api/v1/documents/categories", headers=cust_headers)
    assert cat_res.status_code == status.HTTP_200_OK
    categories = cat_res.json()["data"]
    assert len(categories) > 0
    category_id = categories[0]["id"]

    # 2. Upload Document
    dummy_pdf = b"%PDF-1.4 dummy passport scan PDF content"
    files = {"file": ("passport_scan.pdf", io.BytesIO(dummy_pdf), "application/pdf")}
    data = {"category_id": category_id}

    upload_res = client.post("/api/v1/documents/upload", files=files, data=data, headers=cust_headers)
    assert upload_res.status_code == status.HTTP_201_CREATED
    doc_data = upload_res.json()["data"]
    doc_id = doc_data["id"]
    assert doc_data["original_name"] == "passport_scan.pdf"
    assert doc_data["verification_status"] == "PENDING"
    assert "download_url" in doc_data

    # 3. Verify Version History (Version #1)
    ver_res = client.get(f"/api/v1/documents/{doc_id}/versions", headers=cust_headers)
    assert ver_res.status_code == status.HTTP_200_OK
    versions = ver_res.json()["data"]
    assert len(versions) == 1
    assert versions[0]["version_number"] == 1

    # 4. Officer verifies document
    verify_res = client.post(f"/api/v1/documents/{doc_id}/verify", json={"verification_status": "VERIFIED", "remarks": "Clear image"}, headers=mgr_headers)
    assert verify_res.status_code == status.HTTP_200_OK
    assert verify_res.json()["data"]["verification_status"] == "VERIFIED"

    # 5. Tag Document
    tag_res = client.post(f"/api/v1/documents/{doc_id}/tags", json={"tag_name": "KYC"}, headers=mgr_headers)
    assert tag_res.status_code == status.HTTP_200_OK

    # 6. Customer links document to Vault
    me_res = client.get("/api/v1/auth/me", headers=cust_headers)
    cust_id = me_res.json()["data"]["id"]

    vault_res = client.post("/api/v1/document-vault", json={"customer_id": cust_id, "document_id": doc_id, "reusable": True}, headers=cust_headers)
    assert vault_res.status_code == status.HTTP_201_CREATED

    get_vault_res = client.get(f"/api/v1/document-vault?customer_id={cust_id}", headers=cust_headers)
    assert get_vault_res.status_code == status.HTTP_200_OK
    assert len(get_vault_res.json()["data"]) >= 1

    # 7. Download document
    down_res = client.get(f"/api/v1/documents/{doc_id}/download", headers=cust_headers)
    assert down_res.status_code == status.HTTP_200_OK
    assert down_res.content == dummy_pdf
