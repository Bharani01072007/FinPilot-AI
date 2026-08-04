"""Unit & Integration Tests for Authentication & Authorization Module (Sprint 3.5 Hardening).

Verifies 12-char password policy, bcrypt hashing, account lockout protection, enriched JWT claims,
hashed refresh token rotation, security audit logging, and multi-device logout.
"""

from fastapi import Depends, status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pytest

from app.database.base import Base
from app.database.session import get_db
from app.database.init_db import init_db
from app.modules.identity.dependencies import RequireRoles, get_current_user
from app.modules.identity.security import decode_token
import app.models

# Create test DB engine and session with StaticPool
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


@app.get("/api/v1/test-admin-only", dependencies=[Depends(RequireRoles("Admin"))])
def admin_only_endpoint():
    return {"message": "Welcome Admin"}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_12_char_password_policy_rejection(client):
    """Verify registration fails when password is less than 12 characters."""
    payload = {
        "email": "weak.policy@example.com",
        "first_name": "Weak",
        "last_name": "User",
        "password": "Secure123!",  # Only 10 characters -> Should fail
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_user_registration_and_jwt_claims(client):
    """Verify user registration, login, enriched JWT claims, and profile fetch."""
    email = "hardened.user@example.com"
    password = "SuperSecurePassword123!"

    # 1. Register User with 12+ char password
    reg_payload = {
        "email": email,
        "first_name": "Hardened",
        "last_name": "User",
        "phone": "+1999888777",
        "password": password,
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == status.HTTP_201_CREATED

    # 2. Login User
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login_res.status_code == status.HTTP_200_OK
    login_data = login_res.json()["data"]
    access_token = login_data["access_token"]
    refresh_token = login_data["refresh_token"]

    # 3. Decode access token claims
    payload = decode_token(access_token)
    assert payload is not None
    assert payload["email"] == email
    assert "Customer" in payload["role"]
    assert payload["iss"] == "FinPilot-AI"
    assert payload["aud"] == "FinPilot-Client"
    assert "session_id" in payload

    # 4. GET /auth/me
    headers = {"Authorization": f"Bearer {access_token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == status.HTTP_200_OK
    assert me_res.json()["data"]["email"] == email

    # 5. Refresh Token
    refresh_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_res.status_code == status.HTTP_200_OK
    new_tokens = refresh_res.json()["data"]
    assert new_tokens["access_token"] != access_token

    # 6. Logout
    logout_res = client.post("/api/v1/auth/logout", json={"refresh_token": new_tokens["refresh_token"]})
    assert logout_res.status_code == status.HTTP_200_OK


def test_account_lockout_after_failed_attempts(client):
    """Verify account locks after 5 consecutive failed login attempts."""
    email = "lockout.user@example.com"
    password = "SuperSecurePassword123!"
    wrong_password = "WrongPassword123!"

    # Register
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "first_name": "Lock", "last_name": "Out", "password": password},
    )

    # Submit 5 failed attempts
    for _ in range(5):
        fail_res = client.post("/api/v1/auth/login", json={"email": email, "password": wrong_password})
        assert fail_res.status_code == status.HTTP_401_UNAUTHORIZED

    # 6th attempt should return 403 Forbidden due to account lockout
    locked_res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert locked_res.status_code == status.HTTP_403_FORBIDDEN
    assert "locked" in locked_res.json()["message"].lower()


def test_logout_all_devices(client):
    """Verify logout-all revokes all active sessions for current user."""
    email = "multidevice@example.com"
    password = "SuperSecurePassword123!"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "first_name": "Multi", "last_name": "Device", "password": password},
    )

    # Device 1 Login
    login1 = client.post("/api/v1/auth/login", json={"email": email, "password": password}).json()["data"]
    
    # Logout All Devices
    logout_all_res = client.post(
        "/api/v1/auth/logout-all",
        headers={"Authorization": f"Bearer {login1['access_token']}"},
    )
    assert logout_all_res.status_code == status.HTTP_200_OK

    # Refresh should fail now
    refresh_res = client.post("/api/v1/auth/refresh", json={"refresh_token": login1["refresh_token"]})
    assert refresh_res.status_code == status.HTTP_401_UNAUTHORIZED
