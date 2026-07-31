"""Financial Risk Assessment Result ORM Model.

Stores AI-powered financial risk evaluation outputs linked to Applications.
"""

from typing import Any, Dict, List, Optional
from sqlalchemy import Float, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import BaseEntity


class RiskAssessmentResult(BaseEntity):
    """RiskAssessmentResult entity holding AI risk analysis findings and recommendation."""

    __tablename__ = "risk_assessment_results"

    application_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Component Scores (0.0 – 1.0)
    income_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    employment_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    debt_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    document_consistency_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    application_completeness_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    # Overall Assessment
    overall_risk_level: Mapped[str] = mapped_column(String(20), default="LOW", nullable=False, index=True)
    overall_confidence: Mapped[str] = mapped_column(String(20), default="HIGH", nullable=False)

    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    risk_factors: Mapped[Optional[List[Any]]] = mapped_column(JSON, nullable=True)
    risk_breakdown: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    recommendations: Mapped[Optional[List[Any]]] = mapped_column(JSON, nullable=True)

    processing_time_ms: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="COMPLETED", nullable=False, index=True)

    # Relationships
    application: Mapped["Application"] = relationship("Application", foreign_keys=[application_id])
