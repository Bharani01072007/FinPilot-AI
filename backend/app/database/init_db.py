"""Database Initialization & Seed Script for FinPilot AI.

Creates all database tables via SQLAlchemy metadata and seeds default Roles and Document Categories.
"""

from sqlalchemy.orm import Session
from app.database.base import Base
from app.database.session import SessionLocal, engine, migration_engine
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
    target_engine = bind_engine or migration_engine or engine
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
        {"email": "sbharanidharan2007@gmail.com", "first_name": "Bharanidharan", "last_name": "S", "role_name": "Admin", "phone": "9342393957"},
        {"email": "admin@finpilot.ai", "first_name": "Rajesh", "last_name": "Kumar", "role_name": "Admin", "phone": "9876543210"},
        {"email": "gopinath.v.official.01@gmail.com", "first_name": "Gopinath", "last_name": "V", "role_name": "Manager", "phone": "7603960895"},
        {"email": "manager@finpilot.ai", "first_name": "Vishnupriya", "last_name": "A", "role_name": "Manager", "phone": "9876543211"},
        {"email": "kabiyakaviya9@gmail.com", "first_name": "Kaviya", "last_name": "V", "role_name": "Employee", "phone": "8667890170"},
        {"email": "employee@finpilot.ai", "first_name": "Ananya", "last_name": "R", "role_name": "Employee", "phone": "9876543212"},
        {"email": "deekshikabil@gmail.com", "first_name": "Deekshitha", "last_name": "S", "role_name": "Customer", "phone": "9786518906"},
    ]

    for u_data in INITIAL_USERS:
        user = db.query(User).filter(User.email == u_data["email"]).first()
        if not user:
            logger.info("Seeding User: %s (%s)", u_data["email"], u_data["role_name"])
            user = User(
                email=u_data["email"],
                first_name=u_data["first_name"],
                last_name=u_data["last_name"],
                password_hash=hash_password("Password123!"),
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Ensure password is hash_password("Password123!")
        user.password_hash = hash_password("Password123!")
        db.commit()

        # Add target role if not present
        target_role = db.query(Role).filter(Role.name == u_data["role_name"]).first()
        if target_role:
            existing_ur = db.query(UserRole).filter(UserRole.user_id == user.id, UserRole.role_id == target_role.id).first()
            if not existing_ur:
                db.add(UserRole(user_id=user.id, role_id=target_role.id))
                db.commit()

        # Special dual-role for Gopinath V (Manager + Employee)
        if u_data["email"] == "gopinath.v.official.01@gmail.com":
            emp_role = db.query(Role).filter(Role.name == "Employee").first()
            if emp_role:
                existing_emp = db.query(UserRole).filter(UserRole.user_id == user.id, UserRole.role_id == emp_role.id).first()
                if not existing_emp:
                    db.add(UserRole(user_id=user.id, role_id=emp_role.id))
                    db.commit()

    # Seed Applications, Documents, Notifications, and Audit Logs
    from datetime import datetime, timezone, date, timedelta
    from app.modules.applications.models import Application, ApplicationStatusHistory
    from app.modules.documents.models import Document, DocumentVault
    from app.modules.notifications.models import Notification
    from app.modules.audit.models import AuditLog
    from app.database.enums import ApplicationStatus, Priority, VerificationStatus, NotificationType

    # Map Seeded Users
    cust1 = db.query(User).filter(User.email == "deekshikabil@gmail.com").first()
    cust2 = db.query(User).filter(User.email == "rmadhiyarasu0803@gmail.com").first()
    emp1 = db.query(User).filter(User.email == "gopinath.v.official.01@gmail.com").first()
    emp2 = db.query(User).filter(User.email == "kabiyakaviya9@gmail.com").first()
    mgr = db.query(User).filter(User.email == "vishnupriyaarjunan31@gmail.com").first()
    admin_u = db.query(User).filter(User.email == "sbharanidharan2007@gmail.com").first()

    aadhaar_cat = db.query(DocumentCategory).filter(DocumentCategory.name == "Aadhaar").first()
    pan_cat = db.query(DocumentCategory).filter(DocumentCategory.name == "PAN").first()
    salary_cat = db.query(DocumentCategory).filter(DocumentCategory.name == "Salary Slip").first()
    bank_cat = db.query(DocumentCategory).filter(DocumentCategory.name == "Bank Statement").first()
    prop_cat = db.query(DocumentCategory).filter(DocumentCategory.name == "Property Document").first()

    # Seed Applications for Customer 1 (Deekshitha R S)
    if cust1 and emp1:
        app1 = db.query(Application).filter(Application.application_number == "APP-2026-101").first()
        if not app1:
            logger.info("Seeding Application: APP-2026-101 for Deekshitha R S")
            app1 = Application(
                application_number="APP-2026-101",
                customer_id=cust1.id,
                assigned_employee_id=emp1.id,
                assigned_by=mgr.id if mgr else None,
                assigned_at=datetime.now(timezone.utc),
                application_type="Home Loan Top-Up",
                status=ApplicationStatus.UNDER_REVIEW,
                priority=Priority.HIGH,
                remarks="High-value prime applicant. Vault verified income.",
                submitted_at=datetime.now(timezone.utc),
            )
            db.add(app1)
            db.commit()
            db.refresh(app1)

        app2 = db.query(Application).filter(Application.application_number == "APP-2026-102").first()
        if not app2:
            logger.info("Seeding Application: APP-2026-102 for Deekshitha R S")
            app2 = Application(
                application_number="APP-2026-102",
                customer_id=cust1.id,
                assigned_employee_id=emp2.id if emp2 else emp1.id,
                application_type="Instant Personal Credit Line",
                status=ApplicationStatus.APPROVED,
                priority=Priority.MEDIUM,
                remarks="Pre-approved instant personal credit line of ₹5,00,000.",
                submitted_at=datetime.now(timezone.utc),
                completed_at=datetime.now(timezone.utc),
            )
            db.add(app2)
            db.commit()

        # Seed Documents for Customer 1
        if app1 and pan_cat and aadhaar_cat and salary_cat and bank_cat:
            doc1 = db.query(Document).filter(Document.file_name == "deekshitha_pan.pdf").first()
            if not doc1:
                logger.info("Seeding Document: PAN for Deekshitha R S")
                doc1 = Document(
                    application_id=app1.id,
                    category_id=pan_cat.id,
                    uploaded_by=cust1.id,
                    verified_by=emp1.id,
                    verified_at=datetime.now(timezone.utc),
                    file_name="deekshitha_pan.pdf",
                    original_name="PAN_Card_Deekshitha.pdf",
                    storage_path="/uploads/pan_deekshitha.pdf",
                    mime_type="application/pdf",
                    file_size=1048576,
                    sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                    verification_status=VerificationStatus.VERIFIED,
                )
                db.add(doc1)
                db.commit()
                db.refresh(doc1)

                db.add(DocumentVault(customer_id=cust1.id, document_id=doc1.id, expiry_date=date(2035, 12, 31), reusable=True))
                db.commit()

            doc2 = db.query(Document).filter(Document.file_name == "deekshitha_aadhaar.pdf").first()
            if not doc2:
                logger.info("Seeding Document: Aadhaar for Deekshitha R S")
                doc2 = Document(
                    application_id=app1.id,
                    category_id=aadhaar_cat.id,
                    uploaded_by=cust1.id,
                    verified_by=emp1.id,
                    verified_at=datetime.now(timezone.utc),
                    file_name="deekshitha_aadhaar.pdf",
                    original_name="Aadhaar_Card_Deekshitha.pdf",
                    storage_path="/uploads/aadhaar_deekshitha.pdf",
                    mime_type="application/pdf",
                    file_size=2097152,
                    sha256_hash="f4c0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b866",
                    verification_status=VerificationStatus.VERIFIED,
                )
                db.add(doc2)
                db.commit()
                db.refresh(doc2)

                db.add(DocumentVault(customer_id=cust1.id, document_id=doc2.id, expiry_date=date(2030, 10, 15), reusable=True))
                db.commit()

    # Seed Applications for Customer 2 (Madhiyarasu R)
    if cust2 and emp2:
        app3 = db.query(Application).filter(Application.application_number == "APP-2026-103").first()
        if not app3:
            logger.info("Seeding Application: APP-2026-103 for Madhiyarasu R")
            app3 = Application(
                application_number="APP-2026-103",
                customer_id=cust2.id,
                assigned_employee_id=emp2.id,
                assigned_by=mgr.id if mgr else None,
                application_type="Auto Loan (EV Vehicle)",
                status=ApplicationStatus.APPROVED,
                priority=Priority.MEDIUM,
                remarks="Auto loan sanctioned for EV Purchase.",
                submitted_at=datetime.now(timezone.utc),
                completed_at=datetime.now(timezone.utc),
            )
            db.add(app3)
            db.commit()

        # Seed Additional Historical Applications across Months (Jan - Aug 2026) for Analytics Charts
        EXTRA_APPS = [
            {"app_num": "APP-2026-001", "type": "Education Loan (Tier-1 University)", "status": ApplicationStatus.APPROVED, "priority": Priority.HIGH, "month_offset": 210},
            {"app_num": "APP-2026-002", "type": "Home Construction Loan", "status": ApplicationStatus.COMPLETED, "priority": Priority.MEDIUM, "month_offset": 180},
            {"app_num": "APP-2026-003", "type": "Instant Personal Credit Line", "status": ApplicationStatus.APPROVED, "priority": Priority.LOW, "month_offset": 150},
            {"app_num": "APP-2026-004", "type": "MSME Business Expansion Loan", "status": ApplicationStatus.UNDER_REVIEW, "priority": Priority.HIGH, "month_offset": 120},
            {"app_num": "APP-2026-005", "type": "Auto Loan (EV Vehicle)", "status": ApplicationStatus.APPROVED, "priority": Priority.MEDIUM, "month_offset": 90},
            {"app_num": "APP-2026-006", "type": "Medical Emergency Credit Line", "status": ApplicationStatus.COMPLETED, "priority": Priority.HIGH, "month_offset": 60},
            {"app_num": "APP-2026-007", "type": "Agricultural Equipment Loan", "status": ApplicationStatus.SUBMITTED, "priority": Priority.MEDIUM, "month_offset": 30},
            {"app_num": "APP-2026-008", "type": "Solar Rooftop Subsidy Loan", "status": ApplicationStatus.APPROVED, "priority": Priority.LOW, "month_offset": 15},
            {"app_num": "APP-2026-009", "type": "Education Loan (Overseas Study)", "status": ApplicationStatus.UNDER_REVIEW, "priority": Priority.HIGH, "month_offset": 5},
        ]

        for extra in EXTRA_APPS:
            existing_app = db.query(Application).filter(Application.application_number == extra["app_num"]).first()
            if not existing_app:
                submitted_time = datetime.now(timezone.utc) - timedelta(days=extra["month_offset"])
                logger.info("Seeding Historical Application: %s (%s)", extra["app_num"], extra["type"])
                new_app = Application(
                    application_number=extra["app_num"],
                    customer_id=cust1.id,
                    assigned_employee_id=emp1.id,
                    application_type=extra["type"],
                    status=extra["status"],
                    priority=extra["priority"],
                    remarks="Seeded presentation record for reporting analytics.",
                    submitted_at=submitted_time,
                    completed_at=submitted_time + timedelta(days=3) if extra["status"] in [ApplicationStatus.APPROVED, ApplicationStatus.COMPLETED] else None,
                )
                db.add(new_app)
                db.commit()

    # Seed Notifications
    notifications_data = [
        {"user": cust1, "title": "Credit Line Approved!", "message": "Your Personal Credit Line of ₹5,00,000 has been sanctioned.", "type": NotificationType.APPLICATION},
        {"user": cust1, "title": "Document Vault Verified", "message": "PAN Card and Aadhaar Card have passed e-KYC verification.", "type": NotificationType.DOCUMENT},
        {"user": cust2, "title": "Auto Loan Sanctioned", "message": "Your EV Auto Loan #APP-2026-103 is ready for disbursal.", "type": NotificationType.APPLICATION},
        {"user": emp1, "title": "New Assignment", "message": "Application APP-2026-101 assigned to your underwriting queue.", "type": NotificationType.APPLICATION},
        {"user": emp2, "title": "Pending KYC Check", "message": "Application APP-2026-103 documents uploaded for review.", "type": NotificationType.DOCUMENT},
        {"user": mgr, "title": "Approval Override Needed", "message": "High-value Home Loan APP-2026-101 requires manager approval.", "type": NotificationType.APPLICATION},
        {"user": admin_u, "title": "System Audit Alert", "message": "6 user accounts provisioned with active role assignments.", "type": NotificationType.SYSTEM},
    ]

    for n_data in notifications_data:
        if n_data["user"]:
            existing_n = db.query(Notification).filter(
                Notification.user_id == n_data["user"].id, Notification.title == n_data["title"]
            ).first()
            if not existing_n:
                logger.info("Seeding Notification for %s: %s", n_data["user"].email, n_data["title"])
                db.add(
                    Notification(
                        user_id=n_data["user"].id,
                        title=n_data["title"],
                        message=n_data["message"],
                        notification_type=n_data["type"],
                        priority=Priority.HIGH if "Approved" in n_data["title"] or "Override" in n_data["title"] else Priority.MEDIUM,
                        read_status=False,
                    )
                )
                db.commit()

    # Seed Audit Logs
    if admin_u:
        audit_entries = [
            {"action": "Role Assigned", "resource": "User:Vishnupriya A", "details": {"assigned_role": "Manager"}},
            {"action": "User Provisioned", "resource": "User:Gopinath V", "details": {"assigned_role": "Employee"}},
            {"action": "User Provisioned", "resource": "User:Kaviya V", "details": {"assigned_role": "Employee"}},
            {"action": "Application Submitted", "resource": "Application:APP-2026-101", "details": {"applicant": "Deekshitha R S"}},
            {"action": "KYC Verified", "resource": "Document:PAN_Card_Deekshitha", "details": {"confidence": 0.98}},
        ]
        for a_data in audit_entries:
            db.add(
                AuditLog(
                    user_id=admin_u.id,
                    entity="System",
                    entity_id=a_data["resource"],
                    action=a_data["action"],
                    new_value=a_data["details"],
                )
            )
            db.commit()

    # Seed Master Enterprise Banking Dataset (100 Customers, 300 Applications, 30 Employees, 300 Notifications, 1000 Audit Logs)
    try:
        from app.database.master_enterprise_seeder import seed_master_enterprise_database
        seed_master_enterprise_database(db)
    except Exception as seed_err:
        logger.warning("[Master Seeder] Execution notice: %s", str(seed_err))

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

