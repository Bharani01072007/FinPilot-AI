"""Base Entity Model Definition for FinPilot AI.

Provides BaseEntity with multi-tenant UUID, soft delete, audit timestamps, and creator references.
"""

from datetime import datetime, timezone
import uuid
from typing import Optional
from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy ORM models."""
    pass


class BaseEntity(Base):
    """Abstract Base Entity class inheriting all standard enterprise audit & multi-tenancy fields.

    Every model in the FinPilot AI platform inherits from BaseEntity.
    """

    __abstract__ = True

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
        nullable=False,
    )

    tenant_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        default=lambda: str(uuid.uuid4()),
        index=True,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    created_by: Mapped[Optional[str]] = mapped_column(
        String(36),
        nullable=True,
    )

    updated_by: Mapped[Optional[str]] = mapped_column(
        String(36),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
