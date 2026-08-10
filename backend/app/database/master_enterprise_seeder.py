"""Master Enterprise Banking Seeder Script.

Populates PostgreSQL database with 100+ Customers, 300+ Applications, 30 Employees,
300+ Notifications, and 1000+ Audit Logs for live production-grade banking presentation.
"""

import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database.session import SessionLocal, engine
from app.core.logging import logger
from app.modules.identity.models import Role, User, UserRole
from app.modules.documents.models import DocumentCategory, Document, DocumentVault
from app.modules.applications.models import Application
from app.modules.notifications.models import Notification
from app.modules.audit.models import AuditLog
from app.database.enums import ApplicationStatus, Priority, VerificationStatus, NotificationType
from app.modules.identity.security import hash_password


def seed_master_enterprise_database(db: Session):
    """Seed comprehensive interconnected enterprise banking dataset into PostgreSQL."""
    logger.info("[Master Seeder] Starting Enterprise Banking Data Population...")

    # 1. Roles & Document Categories
    roles = {r.name: r for r in db.query(Role).all()}
    categories = {c.name: c for c in db.query(DocumentCategory).all()}

    # Default Passwords
    hashed_pwd = hash_password("Password123!")

    # 2. Seed 30 Employees & Managers
    logger.info("[Master Seeder] Seeding 30 Employees & Managers...")
    employees = []
    emp_specs = [
        ("sbharanidharan2007@gmail.com", "Bharanidharan", "S", "Admin", "Headquarters"),
        ("gopinath.v.official.01@gmail.com", "Gopinath", "V", "Manager", "Krishnagiri Main Branch"),
        ("kabiyakaviya9@gmail.com", "Kaviya", "V", "Employee", "Chennai Main Branch"),
        ("deekshikabil@gmail.com", "Deekshitha", "S", "Customer", "Coimbatore Branch"),
    ]

    for i in range(1, 31):
        if i <= len(emp_specs):
            email, fn, ln, role_name, branch = emp_specs[i - 1]
        else:
            fn = ["Ramesh", "Suresh", "Priya", "Anitha", "Karthik", "Venkatesh", "Deepa", "Srinivasan"][i % 8]
            ln = ["Nair", "Iyer", "Rao", "Reddy", "Sharma"][i % 5]
            email = f"officer.{i}@bankdomain.in"
            role_name = "Manager" if i % 6 == 0 else "Employee"
            branch = ["Chennai Main", "Mumbai Central", "Krishnagiri Main", "Salem South", "Coimbatore Regional"][i % 5]

        u = db.query(User).filter(User.email == email).first()
        if not u:
            u = User(
                email=email,
                first_name=fn,
                last_name=ln,
                password_hash=hashed_pwd,
                is_active=True,
            )
            db.add(u)
            db.commit()
            db.refresh(u)

        # Attach Role
        target_role = roles.get(role_name) or roles.get("Employee")
        if target_role:
            ur = db.query(UserRole).filter(UserRole.user_id == u.id, UserRole.role_id == target_role.id).first()
            if not ur:
                db.add(UserRole(user_id=u.id, role_id=target_role.id))
                db.commit()

        employees.append(u)

    # 3. Seed 100 Customers
    logger.info("[Master Seeder] Seeding 100 Customers...")
    customers = []
    for i in range(1, 101):
        email = f"customer.{i}@finpilotbank.in" if i > 4 else emp_specs[i - 1][0]
        fn = ["Bharanidharan", "Gopinath", "Madhiyarasu", "Vikramaditya", "Karthik", "Deekshitha", "Kaviya", "Vishnupriya", "Priya", "Ananya"][i % 10]
        ln = ["S", "V", "R", "Kumar", "Verma", "Deshmukh", "Nair", "Patel"][i % 8]

        c = db.query(User).filter(User.email == email).first()
        if not c:
            c = User(
                email=email,
                first_name=fn,
                last_name=ln,
                password_hash=hashed_pwd,
                is_active=True,
            )
            db.add(c)
            db.commit()
            db.refresh(c)
            cust_role = roles.get("Customer")
            if cust_role:
                db.add(UserRole(user_id=c.id, role_id=cust_role.id))
                db.commit()

        customers.append(c)

    # 4. Seed 300 Interconnected Applications
    logger.info("[Master Seeder] Seeding 300 Interconnected Applications...")
    APP_TYPES = [
        "Home Loan Top-Up", "Personal Loan", "Education Loan", "Vehicle Loan", "Gold Loan",
        "Business Expansion Loan", "MSME Loan", "Credit Card", "Savings Account", "Current Account",
        "Fixed Deposit", "Recurring Deposit", "Locker Application", "KYC Update", "Address Change",
        "Debit Card", "FASTag", "Health Insurance Product"
    ]
    STATUSES = [
        ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, ApplicationStatus.DOCUMENT_PENDING,
        ApplicationStatus.APPROVED, ApplicationStatus.REJECTED, ApplicationStatus.COMPLETED
    ]

    for i in range(1, 301):
        app_num = f"APP-2026-{1000 + i}"
        app_obj = db.query(Application).filter(Application.application_number == app_num).first()
        if not app_obj:
            cust_user = customers[i % len(customers)]
            emp_user = employees[i % len(employees)]
            status_val = STATUSES[i % len(STATUSES)]
            req_amt = 100000 + ((i * 125000) % 8500000)
            sub_time = datetime.now(timezone.utc) - timedelta(days=(i * 2) % 180)

            app_obj = Application(
                application_number=app_num,
                customer_id=cust_user.id,
                assigned_employee_id=emp_user.id,
                application_type=APP_TYPES[i % len(APP_TYPES)],
                requested_amount=req_amt,
                sanctioned_amount=req_amt if status_val in [ApplicationStatus.APPROVED, ApplicationStatus.COMPLETED] else None,
                status=status_val,
                priority=Priority.HIGH if i % 5 == 0 else Priority.MEDIUM,
                remarks=f"Seeded enterprise demo application handled by {emp_user.first_name} {emp_user.last_name}.",
                submitted_at=sub_time,
                completed_at=sub_time + timedelta(days=2) if status_val in [ApplicationStatus.APPROVED, ApplicationStatus.COMPLETED] else None,
            )
            db.add(app_obj)
            if i % 50 == 0:
                db.commit()

    db.commit()

    # 5. Seed 300 Notifications
    logger.info("[Master Seeder] Seeding 300 Notifications...")
    for i in range(1, 301):
        cust_user = customers[i % len(customers)]
        notif_title = f"Application Status Event #{1000 + i}"
        existing_n = db.query(Notification).filter(Notification.user_id == cust_user.id, Notification.title == notif_title).first()
        if not existing_n:
            db.add(
                Notification(
                    user_id=cust_user.id,
                    title=notif_title,
                    message=f"Application APP-2026-{1000 + i} stage transition updated in system.",
                    notification_type=NotificationType.APPLICATION,
                    priority=Priority.HIGH if i % 4 == 0 else Priority.MEDIUM,
                    read_status=i % 2 == 0,
                )
            )
            if i % 50 == 0:
                db.commit()

    db.commit()

    # 6. Seed 1000 Audit Logs
    logger.info("[Master Seeder] Seeding 1000 Audit Logs...")
    admin_u = employees[0]
    for i in range(1, 1001):
        action_name = ["USER_LOGIN", "APPLICATION_SUBMITTED", "PADDLE_OCR_EXECUTED", "GROQ_LLM_SUMMARY", "MANAGER_APPROVAL", "REPORT_EXPORT_EXCEL"][i % 6]
        db.add(
            AuditLog(
                user_id=admin_u.id,
                entity="BankingSystem",
                entity_id=f"APP-2026-{1000 + (i % 300)}",
                action=action_name,
                new_value={"status": "COMPLETED", "execution_ms": 120 + (i % 200)},
            )
        )
        if i % 100 == 0:
            db.commit()

    db.commit()
    logger.info("[Master Seeder] Master Enterprise Banking Seeding Complete (100 Customers, 300 Applications, 30 Employees, 300 Notifications, 1000 Audit Logs).")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_master_enterprise_database(db)
    finally:
        db.close()
