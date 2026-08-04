"""KYC Verification Result ORM Model.

Stores automated KYC verification evaluation outputs including findings, cross-document identity consistency checks,
rule evaluations, risk indicator flags, confidence scores, and recommendation rating linked to Applications.
"""

from typing import Any, Dict, List, Optional
from sqlalchemy import Float, ForeignKey, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import BaseEntity


class KYCVerificationResult(BaseEntity):
    """KYCVerificationResult entity holding automated KYC verification findings and recommendation."""

    __tablename__ = "kyc_verification_results"

    application_id: Mapped[str] = mapped_column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    
    verification_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    findings: Mapped[Optional[List[Any]]] = mapped_column(JSON, nullable=True)
    consistency_checks: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    rule_evaluation: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    risk_indicators: Mapped[Optional[List[Any]]] = mapped_column(JSON, nullable=True)
    
    completeness_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    consistency_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    overall_confidence: Mapped[str] = mapped_column(String(20), default="HIGH", nullable=False, index=True)
    recommendation: Mapped[str] = mapped_column(String(30), default="RECOMMENDED_APPROVAL", nullable=False, index=True)
    
    processing_time_ms: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="COMPLETED", nullable=False, index=True)

    # Relationships
    application: Mapped["Application"] = relationship("Application", foreign_keys=[application_id])
