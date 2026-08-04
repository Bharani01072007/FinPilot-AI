"""Task Domain ORM Models.

Defines Task model with completion timestamps and composite performance indexes.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import BaseEntity
from app.database.enums import Priority, TaskStatus


class Task(BaseEntity):
    """Task entity representing internal processing and operational work items."""

    __tablename__ = "tasks"
    __table_args__ = (
        Index("ix_tasks_assigned_status_deadline", "assigned_to", "status", "deadline"),
    )

    assigned_to: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    application_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("applications.id", ondelete="SET NULL"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[Priority] = mapped_column(
        SQLEnum(Priority), default=Priority.MEDIUM, nullable=False, index=True
    )
    status: Mapped[TaskStatus] = mapped_column(
        SQLEnum(TaskStatus), default=TaskStatus.TODO, nullable=False, index=True
    )
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    assignee: Mapped[Optional["User"]] = relationship("User", back_populates="tasks")
    application: Mapped[Optional["Application"]] = relationship("Application", back_populates="tasks")
