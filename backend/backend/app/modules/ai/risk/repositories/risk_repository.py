"""Risk Assessment Repository."""

from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.modules.ai.risk.models import RiskAssessmentResult


class RiskAssessmentRepository(BaseRepository[RiskAssessmentResult, Any, Any]):
    """Repository for RiskAssessmentResult persistence."""

    def __init__(self):
        super().__init__(model=RiskAssessmentResult)

    def get_by_application_id(self, db: Session, app_id: str) -> Optional[RiskAssessmentResult]:
        return (
            db.query(RiskAssessmentResult)
            .filter(RiskAssessmentResult.application_id == app_id, RiskAssessmentResult.is_deleted == False)
            .order_by(RiskAssessmentResult.created_at.desc())
            .first()
        )

    def save_result(self, db: Session, payload: Dict[str, Any]) -> RiskAssessmentResult:
        app_id = payload["application_id"]
        existing = self.get_by_application_id(db, app_id)
        fields = [
            "income_score", "employment_score", "debt_score",
            "document_consistency_score", "application_completeness_score",
            "overall_risk_level", "overall_confidence", "explanation",
            "risk_factors", "risk_breakdown", "processing_time_ms", "status",
        ]
        if not existing:
            res = RiskAssessmentResult(application_id=app_id, **{f: payload.get(f) for f in fields if payload.get(f) is not None})
            db.add(res)
        else:
            for f in fields:
                if f in payload:
                    setattr(existing, f, payload[f])
            res = existing
            db.add(existing)
        db.commit()
        db.refresh(res)
        return res
