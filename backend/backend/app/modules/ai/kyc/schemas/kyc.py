"""KYC Domain Pydantic Schemas.

Defines DTOs for KYC verification requests, evaluation results, and recommendations.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class KYCVerifyRequest(BaseModel):
    """Request payload for executing automated KYC verification on an application."""

    application_id: str = Field(..., description="Target Application UUID to verify")


class KYCVerificationResultResponse(BaseModel):
    """KYC Verification Evaluation Result DTO."""

    id: str
    application_id: str
    recommendation: str = Field(..., description="Generated non-final recommendation rating (RECOMMENDED_APPROVAL, RECOMMENDED_MANUAL_REVIEW, RECOMMENDED_REJECTION)")
    overall_confidence: str
    completeness_score: float
    consistency_score: float
    verification_summary: Optional[str] = None
    findings: Optional[List[Any]] = None
    consistency_checks: Optional[Dict[str, Any]] = None
    rule_evaluation: Optional[Dict[str, Any]] = None
    risk_indicators: Optional[List[Any]] = None
    processing_time_ms: float
    created_at: datetime

    model_config = {"from_attributes": True}
