"""System Domain ORM Models.

Defines Setting and Integration models.
"""

from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import DateTime, JSON, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import BaseEntity


class Setting(BaseEntity):
    """Setting entity storing global system configurations."""

    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    value: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


class Integration(BaseEntity):
    """Integration entity tracking third-party API configurations, webhooks, and health status."""

    __tablename__ = "integrations"

    provider: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    base_url: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)
    encrypted_secret_reference: Mapped[str] = mapped_column(String(500), nullable=False)
    last_checked: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
