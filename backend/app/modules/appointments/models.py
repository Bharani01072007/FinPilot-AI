"""Appointment Domain ORM Models.

Defines Appointment model.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import BaseEntity
from app.database.enums import MeetingMode


class Appointment(BaseEntity):
    """Appointment entity tracking customer meetings and officer consultations."""

    __tablename__ = "appointments"

    customer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    meeting_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    meeting_mode: Mapped[MeetingMode] = mapped_column(
        SQLEnum(MeetingMode), default=MeetingMode.ONLINE, nullable=False
    )
    status: Mapped[str] = mapped_column(String(50), default="SCHEDULED", nullable=False)

    # Relationships
    customer: Mapped["User"] = relationship("User", foreign_keys=[customer_id], back_populates="customer_appointments")
    employee: Mapped[Optional["User"]] = relationship("User", foreign_keys=[employee_id], back_populates="employee_appointments")
