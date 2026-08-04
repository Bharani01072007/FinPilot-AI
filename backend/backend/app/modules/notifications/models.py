"""Notification Domain ORM Models.

Defines Notification model with composite performance indexes.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import BaseEntity
from app.database.enums import NotificationType, Priority


class Notification(BaseEntity):
    """Notification entity storing user alerts, notification delivery state, and delivery timestamps."""

    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_type_read", "user_id", "notification_type", "read_status"),
    )

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[NotificationType] = mapped_column(
        SQLEnum(NotificationType), default=NotificationType.SYSTEM, nullable=False
    )
    priority: Mapped[Priority] = mapped_column(
        SQLEnum(Priority), default=Priority.MEDIUM, nullable=False
    )
    read_status: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    is_sent: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")
