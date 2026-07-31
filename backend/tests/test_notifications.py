"""Unit & Integration Tests for Notification Infrastructure Module (Sprint 7).

Verifies in-app notification creation, channel provider abstraction, template engine placeholder rendering,
event consumer triggers, unread count scalar queries, read/unread state updates, and RBAC authorization.
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
from app.modules.notifications.consumers import notification_consumer
from app.modules.notifications.templates.engine import template_engine
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
    email = "cust.notif@example.com"
    client.post("/api/v1/auth/register", json={"email": email, "first_name": "Cust", "last_name": "Notif", "password": "CustomerPassword123!"})
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "CustomerPassword123!"})
    return login_res.json()["data"]["access_token"]


@pytest.fixture(scope="module")
def admin_token(client):
    email = "admin.notif@example.com"
    client.post("/api/v1/auth/register", json={"email": email, "first_name": "Admin", "last_name": "Notif", "password": "AdminPassword123!"})

    db = TestingSessionLocal()
    user_repo = UserRepository()
    u = user_repo.get_by_email(db, email)
    adm_role = user_repo.get_role_by_name(db, "Admin")
    if u and adm_role:
        user_repo.assign_role(db, u.id, adm_role.id)
    db.close()

    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "AdminPassword123!"})
    return login_res.json()["data"]["access_token"]


def test_template_rendering():
    """Test NotificationTemplateEngine placeholder substitution."""
    context = {"customer_name": "John Doe", "application_number": "APP-2026-1010"}
    title, body = template_engine.render("APPLICATION_ASSIGNED", context)
    assert title == "Application Assigned"
    assert "John Doe" in body
    assert "APP-2026-1010" in body


def test_notification_creation_unread_count_and_read_state_flow(client, customer_token, admin_token):
    """Test creating notifications, unread count queries, and read/unread status updates."""
    cust_headers = {"Authorization": f"Bearer {customer_token}"}
    adm_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Fetch customer user ID
    me_res = client.get("/api/v1/auth/me", headers=cust_headers)
    cust_id = me_res.json()["data"]["id"]

    # 2. Check initial unread count
    cnt1_res = client.get("/api/v1/notifications/unread-count", headers=cust_headers)
    assert cnt1_res.status_code == status.HTTP_200_OK
    initial_unread = cnt1_res.json()["data"]["unread_count"]

    # 3. Admin creates notification for customer
    create_payload = {
        "user_id": cust_id,
        "title": "Welcome Alert",
        "message": "Your account has been setup.",
        "notification_type": "SYSTEM",
        "priority": "HIGH",
    }
    create_res = client.post("/api/v1/notifications", json=create_payload, headers=adm_headers)
    assert create_res.status_code == status.HTTP_201_CREATED
    notif_data = create_res.json()["data"]
    notif_id = notif_data["id"]
    assert notif_data["read_status"] is False

    # 4. Unread count should increase by 1
    cnt2_res = client.get("/api/v1/notifications/unread-count", headers=cust_headers)
    assert cnt2_res.json()["data"]["unread_count"] == initial_unread + 1

    # 5. Customer marks notification as READ
    read_res = client.patch(f"/api/v1/notifications/{notif_id}/read", headers=cust_headers)
    assert read_res.status_code == status.HTTP_200_OK
    assert read_res.json()["data"]["read_status"] is True

    # 6. Unread count should decrease back
    cnt3_res = client.get("/api/v1/notifications/unread-count", headers=cust_headers)
    assert cnt3_res.json()["data"]["unread_count"] == initial_unread

    # 7. Customer soft-deletes notification
    del_res = client.delete(f"/api/v1/notifications/{notif_id}", headers=cust_headers)
    assert del_res.status_code == status.HTTP_200_OK


def test_event_consumer_trigger():
    """Test EventConsumer trigger generating in-app notification from business event."""
    db = TestingSessionLocal()
    user_repo = UserRepository()
    u = user_repo.get_by_email(db, "cust.notif@example.com")
    assert u is not None

    payload = {"customer_id": u.id, "customer_name": "Cust Notif", "application_number": "APP-2026-9999"}
    dispatched = notification_consumer.handle_event("ApplicationAssigned", payload, db=db)
    assert dispatched is True
    db.close()
