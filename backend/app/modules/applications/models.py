"""Application Domain ORM Models.

Defines Application and ApplicationStatusHistory models with performance indexes.
"""

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import BaseEntity
from app.database.enums import ApplicationStatus, Priority


class Application(BaseEntity):
    """Application entity tracking customer financial application submissions."""

    __tablename__ = "applications"
    __table_args__ = (
        Index("ix_applications_customer_status", "customer_id", "status"),
    )

    application_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    customer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    assigned_employee_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    application_type: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[ApplicationStatus] = mapped_column(
        SQLEnum(ApplicationStatus), default=ApplicationStatus.SUBMITTED, nullable=False, index=True
    )
    priority: Mapped[Priority] = mapped_column(
        SQLEnum(Priority), default=Priority.MEDIUM, nullable=False, index=True
    )
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    customer: Mapped["User"] = relationship("User", foreign_keys=[customer_id], back_populates="applications")
    assigned_employee: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_employee_id], back_populates="assigned_applications")
    assigner: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_by], back_populates="assigned_by_applications")
    
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    attachments: Mapped[List["Attachment"]] = relationship("Attachment", back_populates="application", cascade="all, delete-orphan")
    status_history: Mapped[List["ApplicationStatusHistory"]] = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan")
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="application", cascade="all, delete-orphan")


class ApplicationStatusHistory(BaseEntity):
    """ApplicationStatusHistory entity recording immutable audit status transitions."""

    __tablename__ = "application_status_history"

    application_id: Mapped[str] = mapped_column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[ApplicationStatus] = mapped_column(SQLEnum(ApplicationStatus), nullable=False)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    changed_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    application: Mapped["Application"] = relationship("Application", back_populates="status_history")
    changer: Mapped[Optional["User"]] = relationship("User", foreign_keys=[changed_by])
