"""Report Domain ORM Models.

Defines Report model with generated_at timestamp.
"""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import BaseEntity


class Report(BaseEntity):
    """Report entity storing generated analytics and export documents."""

    __tablename__ = "reports"

    report_name: Mapped[str] = mapped_column(String(255), nullable=False)
    report_type: Mapped[str] = mapped_column(String(100), nullable=False)
    generated_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=True)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)

    # Relationships
    generator: Mapped["User"] = relationship("User", back_populates="reports")
