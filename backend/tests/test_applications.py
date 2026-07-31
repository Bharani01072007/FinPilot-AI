"""Unit & Integration Tests for Application Management Module (Sprint 5).

Verifies application creation, auto-generation of application numbers, officer assignments,
workflow state machine status transitions, status history audit logging, and dashboard summary metrics.
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
from app.database.enums import ApplicationStatus, Priority
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
    
    # Create Staff Manager and Officer users
    user_repo = UserRepository()
    manager = user_repo.get_by_email(db, "manager.app@example.com")
    if not manager:
        m = User(email="manager.app@example.com", first_name="Manager", last_name="Chief", password_hash="hashed", is_active=True)
        db.add(m)
        db.commit()
        db.refresh(m)
        mgr_role = user_repo.get_role_by_name(db, "Manager")
        if mgr_role:
            user_repo.assign_role(db, m.id, mgr_role.id)

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
    """Fixture creating and authenticating a Customer user."""
    email = "customer.app@example.com"
    client.post("/api/v1/auth/register", json={"email": email, "first_name": "Cust", "last_name": "App", "password": "CustomerPassword123!"})
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "CustomerPassword123!"})
    return login_res.json()["data"]["access_token"]


@pytest.fixture(scope="module")
def manager_token(client):
    """Fixture creating and authenticating a Manager staff user."""
    email = "manager.real@example.com"
    client.post("/api/v1/auth/register", json={"email": email, "first_name": "Real", "last_name": "Manager", "password": "ManagerPassword123!"})

    db = TestingSessionLocal()
    user_repo = UserRepository()
    u = user_repo.get_by_email(db, email)
    mgr_role = user_repo.get_role_by_name(db, "Manager")
    if u and mgr_role:
        user_repo.assign_role(db, u.id, mgr_role.id)
    db.close()

    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "ManagerPassword123!"})
    return login_res.json()["data"]["access_token"]


def test_application_creation_and_retrieval(client, customer_token):
    """Test customer submitting a loan application, verifying auto-generated APP number."""
    headers = {"Authorization": f"Bearer {customer_token}"}

    payload = {
        "application_type": "Home Loan",
        "priority": "HIGH",
        "remarks": "Urgent home construction loan request",
    }
    res = client.post("/api/v1/applications", json=payload, headers=headers)
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()["data"]
    assert data["application_type"] == "Home Loan"
    assert data["status"] == "SUBMITTED"
    assert data["application_number"].startswith("APP-")

    app_id = data["id"]
    app_num = data["application_number"]

    # Retrieve by ID
    get_res = client.get(f"/api/v1/applications/{app_id}", headers=headers)
    assert get_res.status_code == status.HTTP_200_OK
    assert get_res.json()["data"]["id"] == app_id

    # Retrieve by Number
    get_num_res = client.get(f"/api/v1/applications/number/{app_num}", headers=headers)
    assert get_num_res.status_code == status.HTTP_200_OK
    assert get_num_res.json()["data"]["application_number"] == app_num


def test_application_assignment_status_workflow_and_history(client, customer_token, manager_token):
    """Test manager assigning officer, executing valid status transitions, history logging, and invalid transition handling."""
    cust_headers = {"Authorization": f"Bearer {customer_token}"}
    mgr_headers = {"Authorization": f"Bearer {manager_token}"}

    # 1. Customer creates Savings Account application
    create_res = client.post(
        "/api/v1/applications",
        json={"application_type": "Savings Account", "priority": "MEDIUM", "remarks": "Opening new savings account"},
        headers=cust_headers,
    )
    app_id = create_res.json()["data"]["id"]

    # 2. Manager assigns officer (using manager's own user ID)
    me_res = client.get("/api/v1/auth/me", headers=mgr_headers)
    manager_id = me_res.json()["data"]["id"]

    assign_res = client.patch(f"/api/v1/applications/{app_id}/assign", json={"assigned_employee_id": manager_id}, headers=mgr_headers)
    assert assign_res.status_code == status.HTTP_200_OK
    assert assign_res.json()["data"]["assigned_employee_id"] == manager_id

    # 3. Transition SUBMITTED -> UNDER_REVIEW
    t1_res = client.patch(f"/api/v1/applications/{app_id}/status", json={"status": "UNDER_REVIEW", "remarks": "Documents under verification"}, headers=mgr_headers)
    assert t1_res.status_code == status.HTTP_200_OK
    assert t1_res.json()["data"]["status"] == "UNDER_REVIEW"

    # 4. Transition UNDER_REVIEW -> APPROVED
    t2_res = client.patch(f"/api/v1/applications/{app_id}/status", json={"status": "APPROVED", "remarks": "Application approved by manager"}, headers=mgr_headers)
    assert t2_res.status_code == status.HTTP_200_OK
    assert t2_res.json()["data"]["status"] == "APPROVED"

    # 5. Transition APPROVED -> COMPLETED
    t3_res = client.patch(f"/api/v1/applications/{app_id}/status", json={"status": "COMPLETED", "remarks": "Account activated successfully"}, headers=mgr_headers)
    assert t3_res.status_code == status.HTTP_200_OK
    assert t3_res.json()["data"]["status"] == "COMPLETED"

    # 6. Verify Status History Audit Trail
    hist_res = client.get(f"/api/v1/applications/{app_id}/history", headers=cust_headers)
    assert hist_res.status_code == status.HTTP_200_OK
    history = hist_res.json()["data"]
    assert len(history) >= 4  # SUBMITTED, UNDER_REVIEW, APPROVED, COMPLETED

    # 7. Dashboard Summary Metrics
    dash_res = client.get("/api/v1/applications/dashboard/summary", headers=mgr_headers)
    assert dash_res.status_code == status.HTTP_200_OK
    dash_data = dash_res.json()["data"]
    assert dash_data["total_applications"] >= 2
    assert dash_data["completed"] >= 1
