"""Identity Domain ORM Models.

Defines User, Role, UserRole, and UserSession models with enterprise security, lockout support, and hashed session storage.
"""

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import BaseEntity


class User(BaseEntity):
    """User entity representing platform users with security & lockout audit fields."""

    __tablename__ = "users"

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    profile_image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Account Security & Lockout Fields
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    password_changed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Core Relationships
    user_roles: Mapped[List["UserRole"]] = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    roles: Mapped[List["Role"]] = relationship("Role", secondary="user_roles", back_populates="users", viewonly=True)
    sessions: Mapped[List["UserSession"]] = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    
    # Domain Relationships
    applications: Mapped[List["Application"]] = relationship(
        "Application", foreign_keys="Application.customer_id", back_populates="customer"
    )
    assigned_applications: Mapped[List["Application"]] = relationship(
        "Application", foreign_keys="Application.assigned_employee_id", back_populates="assigned_employee"
    )
    assigned_by_applications: Mapped[List["Application"]] = relationship(
        "Application", foreign_keys="Application.assigned_by", back_populates="assigner"
    )
    verified_documents: Mapped[List["Document"]] = relationship(
        "Document", foreign_keys="Document.verified_by", back_populates="verifier"
    )
    attachments: Mapped[List["Attachment"]] = relationship(
        "Attachment", foreign_keys="Attachment.uploaded_by", back_populates="uploader"
    )
    ai_agent_logs: Mapped[List["AIAgentLog"]] = relationship(
        "AIAgentLog", foreign_keys="AIAgentLog.triggered_by", back_populates="triggering_user"
    )
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="assignee")
    customer_appointments: Mapped[List["Appointment"]] = relationship(
        "Appointment", foreign_keys="Appointment.customer_id", back_populates="customer"
    )
    employee_appointments: Mapped[List["Appointment"]] = relationship(
        "Appointment", foreign_keys="Appointment.employee_id", back_populates="employee"
    )
    reports: Mapped[List["Report"]] = relationship("Report", back_populates="generator")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="user")


class Role(BaseEntity):
    """Role entity defining system permissions (Customer, Employee, Manager, Admin)."""

    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    user_roles: Mapped[List["UserRole"]] = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")
    users: Mapped[List["User"]] = relationship("User", secondary="user_roles", back_populates="roles", viewonly=True)


class UserRole(BaseEntity):
    """Many-to-Many association model linking Users and Roles with Composite Unique constraint."""

    __tablename__ = "user_roles"
    __table_args__ = (
        UniqueConstraint("user_id", "role_id", name="uq_user_role"),
    )

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id: Mapped[str] = mapped_column(String(36), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_roles")
    role: Mapped["Role"] = relationship("Role", back_populates="user_roles")


class UserSession(BaseEntity):
    """UserSession entity storing active authentication refresh tokens and client metadata."""

    __tablename__ = "user_sessions"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    refresh_token: Mapped[str] = mapped_column(String(500), unique=True, nullable=False, index=True)
    hashed_refresh_token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    device: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    browser: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    last_activity: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False, index=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="sessions")
