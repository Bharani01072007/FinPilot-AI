"""Risk Assessment Pydantic Schemas."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RiskAssessRequest(BaseModel):
    """Request payload for executing financial risk assessment."""
    application_id: str = Field(..., description="Target Application UUID")


class RiskAssessmentResultResponse(BaseModel):
    """Risk Assessment Result DTO."""
    id: str
    application_id: str
    income_score: float
    employment_score: float
    debt_score: float
    document_consistency_score: float
    application_completeness_score: float
    overall_risk_level: str
    overall_confidence: str
    explanation: Optional[str] = None
    risk_factors: Optional[List[Any]] = None
    risk_breakdown: Optional[Dict[str, Any]] = None
    processing_time_ms: float
    created_at: datetime

    model_config = {"from_attributes": True}
