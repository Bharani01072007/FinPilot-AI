"""Recommendation REST Endpoints — Module 6."""

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from app.modules.ai.recommendations.services.recommendation_service import recommendation_service
from app.modules.identity.dependencies import RequireRoles
from app.modules.identity.schemas.auth import APIResponse

router = APIRouter(prefix="/ai/recommendations", tags=["Recommendation Engine"])


class RecommendationRequest(BaseModel):
    extracted_docs: List[Dict[str, Any]] = Field(default_factory=list)
    risk_level: Optional[str] = Field(default="LOW")


@router.post(
    "/generate",
    response_model=APIResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Generate AI Recommendations",
    description="Generate actionable recommendations with confidence, reason, and evidence. (Employee, Manager, Admin)",
    dependencies=[Depends(RequireRoles("Employee", "Manager", "Admin"))],
)
def generate_recommendations(req: RecommendationRequest) -> APIResponse[dict]:
    res = recommendation_service.generate(req.extracted_docs, risk_level=req.risk_level or "LOW")
    return APIResponse(success=True, message="Recommendations generated", data=res)
