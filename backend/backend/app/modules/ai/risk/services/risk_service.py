"""Financial Risk Assessment Service — Orchestrates the complete risk pipeline."""

import time
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.modules.ai.document_intelligence.repositories.document_intelligence_repository import DocumentIntelligenceRepository
from app.modules.ai.risk.assessment.debt import debt_indicator_service
from app.modules.ai.risk.assessment.document_consistency import document_consistency_service
from app.modules.ai.risk.assessment.employment import employment_stability_service
from app.modules.ai.risk.assessment.income import income_assessment_service
from app.modules.ai.risk.confidence import risk_confidence_service
from app.modules.ai.risk.governance import risk_governance_config
from app.modules.ai.risk.repositories.risk_repository import RiskAssessmentRepository
from app.modules.ai.risk.schemas.risk import RiskAssessmentResultResponse
from app.modules.applications.repositories.application_repository import ApplicationRepository
from app.modules.audit.models import AuditLog
from app.modules.documents.events import publish_document_event
from app.modules.identity.models import User


class RiskAssessmentService:
    """Service orchestrating financial risk assessment pipeline."""

    def __init__(
        self,
        risk_repo: Optional[RiskAssessmentRepository] = None,
        app_repo: Optional[ApplicationRepository] = None,
        ai_doc_repo: Optional[DocumentIntelligenceRepository] = None,
    ):
        self.risk_repo = risk_repo or RiskAssessmentRepository()
        self.app_repo = app_repo or ApplicationRepository()
        self.ai_doc_repo = ai_doc_repo or DocumentIntelligenceRepository()

    def _audit(self, db: Session, action: str, actor_id: str, app_id: str, details: Optional[Dict] = None) -> None:
        db.add(AuditLog(user_id=actor_id, entity="RiskAssessmentAgent", entity_id=app_id,
                        action=action, new_value={"application_id": app_id, **(details or {})}))
        db.commit()

    def assess(self, db: Session, application_id: str, current_user: User) -> RiskAssessmentResultResponse:
        """Execute full financial risk assessment pipeline."""
        app_entity = self.app_repo.get_by_id(db, application_id)
        if not app_entity:
            raise NotFoundException(message="Application not found")

        self._audit(db, "Risk Assessment Started", current_user.id, application_id)
        start_time = time.time()

        # Gather extracted document payloads
        extracted_docs: List[Dict[str, Any]] = []
        for d in (app_entity.documents or []):
            analysis = self.ai_doc_repo.get_by_document_id(db, d.id)
            extracted_docs.append({
                "document_type": analysis.document_type if analysis else (d.category.name if d.category else "Generic"),
                "overall_confidence": analysis.overall_confidence if analysis else "HIGH",
                "extracted_fields": analysis.extracted_fields or {} if analysis else {},
            })

        # Run assessment pipeline
        income_score, income_factors = income_assessment_service.assess(extracted_docs)
        employ_score, employ_factors = employment_stability_service.assess(extracted_docs)
        debt_score, debt_factors = debt_indicator_service.assess(extracted_docs)
        doc_score, doc_factors = document_consistency_service.assess(extracted_docs)
        completeness_score = 1.0 if len(extracted_docs) > 0 else 0.5

        # Aggregate risk factors
        all_factors = income_factors + employ_factors + debt_factors + doc_factors

        # Compute overall risk level
        risk_level, confidence, explanation = risk_confidence_service.calculate(
            income_score, employ_score, debt_score, doc_score, completeness_score
        )

        duration_ms = round((time.time() - start_time) * 1000, 2)

        payload = {
            "application_id": application_id,
            "income_score": income_score,
            "employment_score": employ_score,
            "debt_score": debt_score,
            "document_consistency_score": doc_score,
            "application_completeness_score": completeness_score,
            "overall_risk_level": risk_level,
            "overall_confidence": confidence,
            "explanation": explanation,
            "risk_factors": all_factors,
            "risk_breakdown": {
                "income_score": income_score,
                "employment_score": employ_score,
                "debt_score": debt_score,
                "document_consistency_score": doc_score,
                "completeness_score": completeness_score,
                "governance_policy": risk_governance_config.to_metadata(),
                "review_routing": risk_governance_config.route_for_review(risk_level),
            },
            "processing_time_ms": duration_ms,
            "status": "COMPLETED",
        }

        saved = self.risk_repo.save_result(db, payload)
        publish_document_event("RiskAssessmentCompleted", application_id, current_user.id,
                               {"risk_level": risk_level, "confidence": confidence})

        self._audit(db, "Risk Assessment Completed", current_user.id, application_id,
                    {"risk_level": risk_level, "confidence": confidence})

        return RiskAssessmentResultResponse.model_validate(saved)

    def get_result(self, db: Session, application_id: str, current_user: User) -> RiskAssessmentResultResponse:
        res = self.risk_repo.get_by_application_id(db, application_id)
        if not res:
            raise NotFoundException(message="Risk assessment result not found. Run assess endpoint first.")
        return RiskAssessmentResultResponse.model_validate(res)

    def reassess(self, db: Session, application_id: str, current_user: User) -> RiskAssessmentResultResponse:
        self._audit(db, "Risk Reassessment", current_user.id, application_id)
        return self.assess(db, application_id, current_user)


risk_assessment_service = RiskAssessmentService()
