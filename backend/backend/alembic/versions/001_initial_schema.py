"""Initial Production Schema Migration with Security Hardening

Revision ID: 001_initial_schema
Revises: None
Create Date: 2026-07-31

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create Enums
    application_status = sa.Enum("SUBMITTED", "DOCUMENT_PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "COMPLETED", name="applicationstatus")
    verification_status = sa.Enum("PENDING", "VERIFIED", "REJECTED", name="verificationstatus")
    priority = sa.Enum("LOW", "MEDIUM", "HIGH", "CRITICAL", name="priority")
    notification_type = sa.Enum("SYSTEM", "APPLICATION", "DOCUMENT", "PAYMENT", "REMINDER", name="notificationtype")
    task_status = sa.Enum("TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED", name="taskstatus")
    meeting_mode = sa.Enum("ONLINE", "OFFLINE", "PHONE", name="meetingmode")

    # 2. Create Users Table
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True, index=True),
        sa.Column("phone", sa.String(length=50), nullable=True, unique=True, index=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("profile_image", sa.String(length=500), nullable=True),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failed_login_attempts", sa.Integer(), nullable=False, default=0),
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("email_verified", sa.Boolean(), nullable=False, default=False),
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("password_changed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 3. Create Roles Table
    op.create_table(
        "roles",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("name", sa.String(length=50), nullable=False, unique=True, index=True),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 4. Create User Roles Join Table
    op.create_table(
        "user_roles",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("role_id", sa.String(length=36), sa.ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", "role_id", name="uq_user_role"),
    )

    # 5. Create User Sessions Table
    op.create_table(
        "user_sessions",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("refresh_token", sa.String(length=500), nullable=False, unique=True, index=True),
        sa.Column("hashed_refresh_token", sa.String(length=255), nullable=False, unique=True, index=True),
        sa.Column("device", sa.String(length=255), nullable=True),
        sa.Column("browser", sa.String(length=255), nullable=True),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("last_activity", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, default="ACTIVE", index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 6. Create Applications Table
    op.create_table(
        "applications",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("application_number", sa.String(length=100), nullable=False, unique=True, index=True),
        sa.Column("customer_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("assigned_employee_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("assigned_by", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("application_type", sa.String(length=100), nullable=False),
        sa.Column("status", application_status, nullable=False, index=True),
        sa.Column("priority", priority, nullable=False, index=True),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_applications_customer_status", "applications", ["customer_id", "status"])

    # 7. Create Application Status History Table
    op.create_table(
        "application_status_history",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("application_id", sa.String(length=36), sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("status", application_status, nullable=False),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("changed_by", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("changed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 8. Create Document Categories Table
    op.create_table(
        "document_categories",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("name", sa.String(length=100), nullable=False, unique=True, index=True),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 9. Create Documents Table
    op.create_table(
        "documents",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("application_id", sa.String(length=36), sa.ForeignKey("applications.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("category_id", sa.String(length=36), sa.ForeignKey("document_categories.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("uploaded_by", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("verified_by", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("original_name", sa.String(length=255), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("file_size", sa.BigInteger(), nullable=False),
        sa.Column("verification_status", verification_status, nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_documents_app_verification", "documents", ["application_id", "verification_status"])

    # 10. Create Document Versions Table
    op.create_table(
        "document_versions",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("document_id", sa.String(length=36), sa.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 11. Create Document Vault Table
    op.create_table(
        "document_vault",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("customer_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("document_id", sa.String(length=36), sa.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("expiry_date", sa.Date(), nullable=True, index=True),
        sa.Column("is_expired", sa.Boolean(), nullable=False, default=False, index=True),
        sa.Column("reusable", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 12. Create Tags Table
    op.create_table(
        "tags",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("name", sa.String(length=100), nullable=False, unique=True, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 13. Create Document Tags Join Table
    op.create_table(
        "document_tags",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("document_id", sa.String(length=36), sa.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("tag_id", sa.String(length=36), sa.ForeignKey("tags.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("document_id", "tag_id", name="uq_document_tag"),
    )

    # 14. Create Attachments Table
    op.create_table(
        "attachments",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("application_id", sa.String(length=36), sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=True, index=True),
        sa.Column("uploaded_by", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 15. Create Notifications Table
    op.create_table(
        "notifications",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("notification_type", notification_type, nullable=False),
        sa.Column("priority", priority, nullable=False),
        sa.Column("read_status", sa.Boolean(), nullable=False, default=False, index=True),
        sa.Column("is_sent", sa.Boolean(), nullable=False, default=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_notifications_user_type_read", "notifications", ["user_id", "notification_type", "read_status"])

    # 16. Create Tasks Table
    op.create_table(
        "tasks",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("assigned_to", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("application_id", sa.String(length=36), sa.ForeignKey("applications.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("priority", priority, nullable=False, index=True),
        sa.Column("status", task_status, nullable=False, index=True),
        sa.Column("deadline", sa.DateTime(timezone=True), nullable=True, index=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_tasks_assigned_status_deadline", "tasks", ["assigned_to", "status", "deadline"])

    # 17. Create Appointments Table
    op.create_table(
        "appointments",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("customer_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("employee_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("meeting_time", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("meeting_mode", meeting_mode, nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, default="SCHEDULED"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 18. Create Reports Table
    op.create_table(
        "reports",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("report_name", sa.String(length=255), nullable=False),
        sa.Column("report_type", sa.String(length=100), nullable=False),
        sa.Column("generated_by", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 19. Create Audit Logs Table
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("entity", sa.String(length=100), nullable=False, index=True),
        sa.Column("entity_id", sa.String(length=36), nullable=False, index=True),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("old_value", sa.JSON(), nullable=True),
        sa.Column("new_value", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("user_agent", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_audit_logs_entity_entity_id", "audit_logs", ["entity", "entity_id"])

    # 20. Create AI Agent Logs Table
    op.create_table(
        "ai_agent_logs",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("agent_name", sa.String(length=100), nullable=False, index=True),
        sa.Column("triggered_by", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("input_payload", sa.JSON(), nullable=False),
        sa.Column("output_payload", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, default="RUNNING", index=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("execution_time", sa.Float(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 21. Create Integrations Table
    op.create_table(
        "integrations",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("provider", sa.String(length=100), nullable=False, unique=True, index=True),
        sa.Column("base_url", sa.String(length=500), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, default="ACTIVE"),
        sa.Column("encrypted_secret_reference", sa.String(length=500), nullable=False),
        sa.Column("last_checked", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 22. Create Settings Table
    op.create_table(
        "settings",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("key", sa.String(length=100), nullable=False, unique=True, index=True),
        sa.Column("value", sa.JSON(), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, default=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("settings")
    op.drop_table("integrations")
    op.drop_table("ai_agent_logs")
    op.drop_table("audit_logs")
    op.drop_table("reports")
    op.drop_table("appointments")
    op.drop_table("tasks")
    op.drop_table("notifications")
    op.drop_table("attachments")
    op.drop_table("document_tags")
    op.drop_table("tags")
    op.drop_table("document_vault")
    op.drop_table("document_versions")
    op.drop_table("documents")
    op.drop_table("document_categories")
    op.drop_table("application_status_history")
    op.drop_table("applications")
    op.drop_table("user_sessions")
    op.drop_table("user_roles")
    op.drop_table("roles")
    op.drop_table("users")
