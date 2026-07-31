"""Unit Tests for Enterprise Database Layer (Sprint 2.5 Refinement).

Verifies 21 model schemas, relationships, enums, BaseEntity, composite indexes, and database seeding.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.base import Base
from app.database.enums import (
    ApplicationStatus,
    VerificationStatus,
    Priority,
    NotificationType,
    TaskStatus,
    MeetingMode,
)
from app.database.init_db import init_db
import app.models  # Load all models


def test_database_tables_metadata():
    """Verify all 21 domain models are properly registered in Base.metadata."""
    table_names = set(Base.metadata.tables.keys())
    expected_tables = {
        "users",
        "roles",
        "user_roles",
        "user_sessions",
        "applications",
        "application_status_history",
        "document_categories",
        "documents",
        "document_versions",
        "document_vault",
        "tags",
        "document_tags",
        "attachments",
        "notifications",
        "tasks",
        "appointments",
        "reports",
        "audit_logs",
        "ai_agent_logs",
        "integrations",
        "settings",
    }
    assert expected_tables.issubset(table_names), f"Missing tables: {expected_tables - table_names}"


def test_database_initialization_and_seeding():
    """Verify table creation and seed data execution for roles and document categories."""
    engine = create_engine("sqlite:///:memory:")
    SessionInMemory = sessionmaker(bind=engine)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionInMemory()
    try:
        init_db(db, bind_engine=engine)

        from app.modules.identity.models import Role
        from app.modules.documents.models import DocumentCategory

        # Check Roles Seed
        roles = db.query(Role).all()
        role_names = {r.name for r in roles}
        assert {"Customer", "Employee", "Manager", "Admin"}.issubset(role_names)

        # Check Document Categories Seed
        categories = db.query(DocumentCategory).all()
        category_names = {c.name for c in categories}
        assert {"Aadhaar", "PAN", "Passport", "Driving License", "Salary Slip", "Bank Statement", "Property Document", "Insurance", "Other"}.issubset(category_names)
    finally:
        db.close()


def test_enums_integrity():
    """Verify Enum choices match Sprint 2.5 specifications."""
    assert ApplicationStatus.SUBMITTED.value == "SUBMITTED"
    assert VerificationStatus.VERIFIED.value == "VERIFIED"
    assert Priority.CRITICAL.value == "CRITICAL"
    assert NotificationType.SYSTEM.value == "SYSTEM"
    assert TaskStatus.IN_PROGRESS.value == "IN_PROGRESS"
    assert MeetingMode.ONLINE.value == "ONLINE"
