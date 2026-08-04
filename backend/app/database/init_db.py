"""Database Initialization & Seed Script for FinPilot AI.

Creates all database tables via SQLAlchemy metadata and seeds default Roles and Document Categories.
"""

from sqlalchemy.orm import Session
from app.database.base import Base
from app.database.session import SessionLocal, engine
from app.core.logging import logger
import app.models  # Ensures all models are loaded into Base.metadata

# Default Roles Seed Data
INITIAL_ROLES = [
    {"name": "Customer", "description": "Platform customer seeking financial services and submitting applications."},
    {"name": "Employee", "description": "Front-line operational officer handling application verifications."},
    {"name": "Manager", "description": "Branch manager overseeing tasks, approvals, and reports."},
    {"name": "Admin", "description": "System administrator with full platform control."},
]

# Default Document Categories Seed Data
INITIAL_DOCUMENT_CATEGORIES = [
    {"name": "Aadhaar", "description": "Unique Identification Authority of India (UIDAI) Aadhaar Card"},
    {"name": "PAN", "description": "Permanent Account Number (PAN) Card"},
    {"name": "Passport", "description": "Official International Passport Document"},
    {"name": "Driving License", "description": "Government Issued Driving License"},
    {"name": "Salary Slip", "description": "Recent Employment Salary Slip / Income Verification"},
    {"name": "Bank Statement", "description": "Bank Account Statement (Last 6 Months)"},
    {"name": "Property Document", "description": "Property Ownership / Lease Agreement Document"},
    {"name": "Insurance", "description": "Life or General Insurance Policy Document"},
    {"name": "Other", "description": "General Supporting Financial Document"},
]


def init_db(db: Session, bind_engine=None) -> None:
    """Initialize database tables and seed required reference tables.

    Args:
        db: SQLAlchemy database session.
        bind_engine: Optional engine to bind table creation DDL.
    """
    target_engine = bind_engine or db.get_bind() or engine
    logger.info("Creating database tables if not existing...")
    Base.metadata.create_all(bind=target_engine)

    from app.modules.identity.models import Role, User, UserRole
    from app.modules.documents.models import DocumentCategory
    from app.modules.identity.security import hash_password

    # Seed Roles
    for role_data in INITIAL_ROLES:
        role = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not role:
            logger.info("Seeding Role: %s", role_data["name"])
            new_role = Role(name=role_data["name"], description=role_data["description"])
            db.add(new_role)

    # Seed Document Categories
    for cat_data in INITIAL_DOCUMENT_CATEGORIES:
        category = db.query(DocumentCategory).filter(DocumentCategory.name == cat_data["name"]).first()
        if not category:
            logger.info("Seeding Document Category: %s", cat_data["name"])
            new_category = DocumentCategory(name=cat_data["name"], description=cat_data["description"])
            db.add(new_category)

    db.commit()

    # Seed Default Portal Users
    INITIAL_USERS = [
        {"email": "aarav@finpilot.ai", "first_name": "Aarav", "last_name": "Mehta", "role_name": "Customer"},
        {"email": "manager@finpilot.ai", "first_name": "Daniel", "last_name": "Cole", "role_name": "Manager"},
        {"email": "employee@finpilot.ai", "first_name": "Priya", "last_name": "Verma", "role_name": "Employee"},
    ]

    for u_data in INITIAL_USERS:
        user = db.query(User).filter(User.email == u_data["email"]).first()
        if not user:
            logger.info("Seeding User: %s (%s)", u_data["email"], u_data["role_name"])
            new_user = User(
                email=u_data["email"],
                first_name=u_data["first_name"],
                last_name=u_data["last_name"],
                password_hash=hash_password("Password123!"),
                is_active=True,
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            role = db.query(Role).filter(Role.name == u_data["role_name"]).first()
            if role:
                db.add(UserRole(user_id=new_user.id, role_id=role.id))
                db.commit()

    logger.info("Database initialization and seeding completed successfully.")


def main() -> None:
    """Execution entry point for standalone database seeding."""
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
