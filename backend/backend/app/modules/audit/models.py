"""Audit Domain ORM Models.

Defines AuditLog and AIAgentLog models for system auditing and AI execution tracking.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy import DateTime, Float, ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import BaseEntity


class AuditLog(BaseEntity):
    """AuditLog entity recording change events, security actions, and state mutations."""

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_entity_entity_id", "entity", "entity_id"),
    )

    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    entity: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    
    old_value: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    new_value: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")


class AIAgentLog(BaseEntity):
    """AIAgentLog entity tracking autonomous AI agent executions, inputs, outputs, and performance metrics."""

    __tablename__ = "ai_agent_logs"

    agent_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    triggered_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    input_payload: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    output_payload: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="RUNNING", nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    execution_time: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    triggering_user: Mapped[Optional["User"]] = relationship("User", back_populates="ai_agent_logs")
