"""KYC Verification Repository Module.

Provides database access logic for KYCVerificationResult ORM entities.
"""

from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.modules.ai.kyc.models import KYCVerificationResult


class KYCVerificationRepository(BaseRepository[KYCVerificationResult, Any, Any]):
    """Repository managing database persistence for KYC verification outputs."""

    def __init__(self):
        super().__init__(model=KYCVerificationResult)

    def get_by_application_id(self, db: Session, app_id: str) -> Optional[KYCVerificationResult]:
        """Fetch KYC verification result entity linked to application ID."""
        return (
            db.query(KYCVerificationResult)
            .filter(KYCVerificationResult.application_id == app_id, KYCVerificationResult.is_deleted == False)
            .order_by(KYCVerificationResult.created_at.desc())
            .first()
        )

    def save_result(self, db: Session, payload: Dict[str, Any]) -> KYCVerificationResult:
        """Create or update KYCVerificationResult record."""
        app_id = payload["application_id"]
        existing = self.get_by_application_id(db, app_id)

        if not existing:
            res = KYCVerificationResult(
                application_id=app_id,
                verification_summary=payload.get("verification_summary"),
                findings=payload.get("findings"),
                consistency_checks=payload.get("consistency_checks"),
                rule_evaluation=payload.get("rule_evaluation"),
                risk_indicators=payload.get("risk_indicators"),
                completeness_score=payload.get("completeness_score", 1.0),
                consistency_score=payload.get("consistency_score", 1.0),
                overall_confidence=payload.get("overall_confidence", "HIGH"),
                recommendation=payload.get("recommendation", "RECOMMENDED_APPROVAL"),
                processing_time_ms=payload.get("processing_time_ms", 0.0),
                status=payload.get("status", "COMPLETED"),
            )
            db.add(res)
        else:
            existing.verification_summary = payload.get("verification_summary")
            existing.findings = payload.get("findings")
            existing.consistency_checks = payload.get("consistency_checks")
            existing.rule_evaluation = payload.get("rule_evaluation")
            existing.risk_indicators = payload.get("risk_indicators")
            existing.completeness_score = payload.get("completeness_score", 1.0)
            existing.consistency_score = payload.get("consistency_score", 1.0)
            existing.overall_confidence = payload.get("overall_confidence", "HIGH")
            existing.recommendation = payload.get("recommendation", "RECOMMENDED_APPROVAL")
            existing.processing_time_ms = payload.get("processing_time_ms", 0.0)
            existing.status = payload.get("status", "COMPLETED")
            res = existing
            db.add(existing)

        db.commit()
        db.refresh(res)
        return res
