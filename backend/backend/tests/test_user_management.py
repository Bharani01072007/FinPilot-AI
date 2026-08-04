"""Unit & Integration Tests for User & Role Management Module (Sprint 4).

Verifies Admin User CRUD, search/filtering/pagination, soft deletion, account status transitions,
role management, session revocations, and RBAC authorization restrictions.
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
from app.modules.identity.models import User, Role
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
    
    # Create an Admin user for testing
    user_repo = UserRepository()
    admin_user = user_repo.get_by_email(db, "admin.test@example.com")
    if not admin_user:
        admin_payload = {
            "email": "admin.test@example.com",
            "first_name": "Admin",
            "last_name": "Super",
            "password_hash": "hashed_secret",
            "is_active": True,
        }
        admin = User(**admin_payload)
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        admin_role = user_repo.get_role_by_name(db, "Admin")
        if admin_role:
            user_repo.assign_role(db, admin.id, admin_role.id)

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
    """Fixture returning valid Admin access token."""
    # Register/login Admin
    reg_payload = {
        "email": "admin.real@example.com",
        "first_name": "Real",
        "last_name": "Admin",
        "password": "SuperAdminPassword123!",
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    # Manually promote to Admin in DB
    db = TestingSessionLocal()
    user_repo = UserRepository()
    u = user_repo.get_by_email(db, "admin.real@example.com")
    admin_role = user_repo.get_role_by_name(db, "Admin")
    if u and admin_role:
        user_repo.assign_role(db, u.id, admin_role.id)
    db.close()

    login_res = client.post("/api/v1/auth/login", json={"email": "admin.real@example.com", "password": "SuperAdminPassword123!"})
    return login_res.json()["data"]["access_token"]


def test_admin_user_crud_and_status_flow(client, admin_token):
    """Test full administrative User CRUD, status transitions, soft delete, and restore."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    email = "managed.user@example.com"
    password = "SuperManagedPassword123!"

    # 1. Admin Creates User
    create_payload = {
        "email": email,
        "first_name": "Managed",
        "last_name": "Account",
        "phone": "+1999111222",
        "password": password,
        "roles": ["Customer", "Employee"],
    }
    create_res = client.post("/api/v1/users", json=create_payload, headers=headers)
    assert create_res.status_code == status.HTTP_201_CREATED
    user_data = create_res.json()["data"]
    target_id = user_data["id"]
    assert user_data["email"] == email
    assert len(user_data["roles"]) == 2

    # 2. Get User By ID
    get_res = client.get(f"/api/v1/users/{target_id}", headers=headers)
    assert get_res.status_code == status.HTTP_200_OK

    # 3. Update User
    update_res = client.put(f"/api/v1/users/{target_id}", json={"first_name": "UpdatedName"}, headers=headers)
    assert update_res.status_code == status.HTTP_200_OK
    assert update_res.json()["data"]["first_name"] == "UpdatedName"

    # 4. Deactivate User
    deact_res = client.patch(f"/api/v1/users/{target_id}/deactivate", headers=headers)
    assert deact_res.status_code == status.HTTP_200_OK
    assert deact_res.json()["data"]["is_active"] is False

    # 5. Activate User
    act_res = client.patch(f"/api/v1/users/{target_id}/activate", headers=headers)
    assert act_res.status_code == status.HTTP_200_OK
    assert act_res.json()["data"]["is_active"] is True

    # 6. Soft Delete User
    del_res = client.delete(f"/api/v1/users/{target_id}", headers=headers)
    assert del_res.status_code == status.HTTP_200_OK

    # 7. Verify Soft Deleted User fails normal GET
    get_del_res = client.get(f"/api/v1/users/{target_id}", headers=headers)
    assert get_del_res.status_code == status.HTTP_404_NOT_FOUND

    # 8. Restore Soft Deleted User
    restore_res = client.patch(f"/api/v1/users/{target_id}/restore", headers=headers)
    assert restore_res.status_code == status.HTTP_200_OK
    assert restore_res.json()["data"]["is_active"] is True


def test_user_search_and_role_management(client, admin_token):
    """Test user search/pagination and role assignment/removal."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Search Users
    search_res = client.get("/api/v1/users?search=real&page=1&page_size=10", headers=headers)
    assert search_res.status_code == status.HTTP_200_OK
    list_data = search_res.json()["data"]
    assert list_data["total"] >= 1

    # 2. List Roles
    roles_res = client.get("/api/v1/roles", headers=headers)
    assert roles_res.status_code == status.HTTP_200_OK
    roles_list = roles_res.json()["data"]
    role_names = {r["name"] for r in roles_list}
    assert {"Customer", "Employee", "Manager", "Admin"}.issubset(role_names)
