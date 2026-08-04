"""Unit & Integration Tests for Reporting & Analytics Platform Module (Sprint 8 & 8.5).

Verifies Executive Dashboard metrics, Application/Document/User/Notification analytics datasets,
KPI Engine computations, JSON report exports, RBAC authorization, and audit logging.
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
from app.modules.identity.models import User
from app.modules.identity.repositories.user_repository import UserRepository
from app.modules.reports.analytics.kpi_engine import kpi_engine
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
    email = "cust.rep@example.com"
    client.post("/api/v1/auth/register", json={"email": email, "first_name": "Cust", "last_name": "Rep", "password": "CustomerPassword123!"})
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "CustomerPassword123!"})
    return login_res.json()["data"]["access_token"]


@pytest.fixture(scope="module")
def admin_token(client):
    email = "admin.rep@example.com"
    client.post("/api/v1/auth/register", json={"email": email, "first_name": "Admin", "last_name": "Rep", "password": "AdminPassword123!"})

    db = TestingSessionLocal()
    user_repo = UserRepository()
    u = user_repo.get_by_email(db, email)
    adm_role = user_repo.get_role_by_name(db, "Admin")
    if u and adm_role:
        user_repo.assign_role(db, u.id, adm_role.id)
    db.close()

    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "AdminPassword123!"})
    return login_res.json()["data"]["access_token"]


def test_kpi_engine_calculations():
    """Test KPIEngine mathematical calculations."""
    comp_rate = kpi_engine.calculate_completion_rate(total_applications=10, completed_applications=8)
    assert comp_rate == 80.0

    app_rate = kpi_engine.calculate_approval_rate(approved=6, rejected=2)
    assert app_rate == 75.0

    rej_rate = kpi_engine.calculate_rejection_rate(approved=6, rejected=2)
    assert rej_rate == 25.0

    prod_idx = kpi_engine.calculate_productivity_index(completed_apps=10, verified_docs=20, active_employees=2)
    assert prod_idx == 15.0


def test_reporting_endpoints_and_rbac(client, customer_token, admin_token):
    """Test Executive Dashboard, Analytics endpoints, JSON report export, and RBAC authorization."""
    cust_headers = {"Authorization": f"Bearer {customer_token}"}
    adm_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Customer should be forbidden from accessing Executive Dashboard
    forbidden_res = client.get("/api/v1/reports/dashboard", headers=cust_headers)
    assert forbidden_res.status_code == status.HTTP_403_FORBIDDEN

    # 2. Admin fetches Executive Dashboard
    dash_res = client.get("/api/v1/reports/dashboard", headers=adm_headers)
    assert dash_res.status_code == status.HTTP_200_OK
    dash_data = dash_res.json()["data"]
    assert "total_applications" in dash_data
    assert "status_breakdown" in dash_data

    # 3. Admin fetches Application Analytics
    app_res = client.get("/api/v1/reports/applications", headers=adm_headers)
    assert app_res.status_code == status.HTTP_200_OK
    app_data = app_res.json()["data"]
    assert "approval_rate_percent" in app_data
    assert "daily_trend" in app_data

    # 4. Admin fetches Document Analytics
    doc_res = client.get("/api/v1/reports/documents", headers=adm_headers)
    assert doc_res.status_code == status.HTTP_200_OK
    doc_data = doc_res.json()["data"]
    assert "uploaded_documents" in doc_data

    # 5. Admin fetches User Analytics
    user_res = client.get("/api/v1/reports/users", headers=adm_headers)
    assert user_res.status_code == status.HTTP_200_OK
    user_data = user_res.json()["data"]
    assert "active_users" in user_data

    # 6. Admin fetches Notification Analytics
    notif_res = client.get("/api/v1/reports/notifications", headers=adm_headers)
    assert notif_res.status_code == status.HTTP_200_OK

    # 7. Admin fetches Audit Analytics
    audit_res = client.get("/api/v1/reports/audit", headers=adm_headers)
    assert audit_res.status_code == status.HTTP_200_OK

    # 8. Admin fetches KPIs
    kpi_res = client.get("/api/v1/reports/kpis", headers=adm_headers)
    assert kpi_res.status_code == status.HTTP_200_OK
    assert "completion_rate_percent" in kpi_res.json()["data"]

    # 9. Admin exports report JSON
    export_res = client.get("/api/v1/reports/export?report_type=dashboard", headers=adm_headers)
    assert export_res.status_code == status.HTTP_200_OK
    assert export_res.headers["content-type"] == "application/json"
    assert "total_applications" in export_res.text
