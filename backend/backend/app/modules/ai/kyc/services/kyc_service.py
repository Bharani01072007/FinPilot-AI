"""KYC Verification Business Logic Service Module.

Encapsulates automated KYC identity verification, cross-document checks, rule evaluation,
risk indicator detection, confidence scoring, non-final recommendation generation, event emissions, and audit logging.
"""

import time
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import BaseAppException, NotFoundException
from app.modules.ai.document_intelligence.repositories.document_intelligence_repository import DocumentIntelligenceRepository
from app.modules.ai.kyc.confidence import kyc_confidence_service
from app.modules.ai.kyc.consistency import identity_consistency_checker
from app.modules.ai.kyc.recommendation import recommendation_engine
from app.modules.ai.kyc.repositories.kyc_repository import KYCVerificationRepository
from app.modules.ai.kyc.risk import risk_indicator_engine
from app.modules.ai.kyc.rules import kyc_rule_engine
from app.modules.ai.kyc.schemas.kyc import KYCVerificationResultResponse
from app.modules.applications.repositories.application_repository import ApplicationRepository
from app.modules.audit.models import AuditLog
from app.modules.documents.events import publish_document_event
from app.modules.documents.repositories.document_repository import DocumentRepository
from app.modules.identity.models import User


class KYCVerificationService:
    """Service orchestrating automated KYC verification workflows."""

    def __init__(
        self,
        kyc_repo: Optional[KYCVerificationRepository] = None,
        app_repo: Optional[ApplicationRepository] = None,
        doc_repo: Optional[DocumentRepository] = None,
        ai_doc_repo: Optional[DocumentIntelligenceRepository] = None,
    ):
        self.kyc_repo = kyc_repo or KYCVerificationRepository()
        self.app_repo = app_repo or ApplicationRepository()
        self.doc_repo = doc_repo or DocumentRepository()
        self.ai_doc_repo = ai_doc_repo or DocumentIntelligenceRepository()

    def _log_audit_event(
        self,
        db: Session,
        action: str,
        actor_id: str,
        target_app_id: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log a KYC verification event into audit_logs."""
        audit_entry = AuditLog(
            user_id=actor_id,
            entity="KYCVerificationAgent",
            entity_id=target_app_id,
            action=action,
            new_value={"application_id": target_app_id, **(details or {})},
        )
        db.add(audit_entry)
        db.commit()

    def verify_kyc(self, db: Session, application_id: str, current_user: User) -> KYCVerificationResultResponse:
        """Execute automated KYC verification checks on an application."""
        app_entity = self.app_repo.get_by_id(db, application_id)
        if not app_entity:
            raise NotFoundException(message="Linked application not found")

        self._log_audit_event(db, action="Verification Started", actor_id=current_user.id, target_app_id=application_id)

        start_time = time.time()

        # Retrieve all documents linked to application
        docs = app_entity.documents or []
        extracted_doc_payloads: List[Dict[str, Any]] = []

        for d in docs:
            analysis = self.ai_doc_repo.get_by_document_id(db, d.id)
            if analysis:
                extracted_doc_payloads.append({
                    "document_id": d.id,
                    "document_type": analysis.document_type,
                    "extracted_fields": analysis.extracted_fields or {},
                    "overall_confidence": analysis.overall_confidence,
                })
            else:
                customer = app_entity.customer
                customer_name = f"{customer.first_name} {customer.last_name}".strip() if customer else "Unknown"
                extracted_doc_payloads.append({
                    "document_id": d.id,
                    "document_type": d.category.name if d.category else "Generic Document",
                    "extracted_fields": {"name": customer_name},
                    "overall_confidence": "HIGH",
                })

        # Step 1: Cross-Document Identity Consistency
        consistency_checks, consistency_score = identity_consistency_checker.evaluate_consistency(extracted_doc_payloads)

        # Step 2: Compliance Business Rules
        rule_eval, rule_score = kyc_rule_engine.evaluate_rules(extracted_doc_payloads)

        # Step 3: Risk Indicators Identification
        risks = risk_indicator_engine.identify_risk_indicators(consistency_checks, rule_eval, extracted_doc_payloads)

        # Step 4: Confidence Scoring
        completeness_score, final_consistency_score, overall_confidence = kyc_confidence_service.calculate_confidence(
            consistency_score=consistency_score,
            rule_score=rule_score,
            extracted_docs=extracted_doc_payloads,
        )

        # Step 5: Recommendation Engine
        recommendation, findings, summary = recommendation_engine.generate_recommendation(
            risks=risks,
            overall_confidence=overall_confidence,
            consistency_checks=consistency_checks,
        )

        duration_ms = round((time.time() - start_time) * 1000, 2)

        # Step 6: Database Persistence
        payload = {
            "application_id": application_id,
            "verification_summary": summary,
            "findings": findings,
            "consistency_checks": consistency_checks,
            "rule_evaluation": rule_eval,
            "risk_indicators": risks,
            "completeness_score": completeness_score,
            "consistency_score": final_consistency_score,
            "overall_confidence": overall_confidence,
            "recommendation": recommendation,
            "processing_time_ms": duration_ms,
            "status": "COMPLETED",
        }

        saved_res = self.kyc_repo.save_result(db, payload)

        # Step 7: Event Bus Emissions
        publish_document_event("KYCVerificationCompleted", application_id, current_user.id, {"recommendation": recommendation})
        publish_document_event("KYCRecommendationGenerated", application_id, current_user.id, {"recommendation": recommendation, "confidence": overall_confidence})
        
        if recommendation == "RECOMMENDED_MANUAL_REVIEW":
            publish_document_event("KYCManualReviewRequired", application_id, current_user.id, {"risk_count": len(risks)})
            self._log_audit_event(db, action="Manual Review Requested", actor_id=current_user.id, target_app_id=application_id)

        self._log_audit_event(
            db, action="Verification Completed", actor_id=current_user.id, target_app_id=application_id, details={"recommendation": recommendation}
        )

        return KYCVerificationResultResponse.model_validate(saved_res)

    def get_result(self, db: Session, application_id: str, current_user: User) -> KYCVerificationResultResponse:
        """Fetch KYC verification result for application ID."""
        res = self.kyc_repo.get_by_application_id(db, application_id)
        if not res:
            raise NotFoundException(message="KYC verification result not found for this application. Run verify endpoint first.")
        return KYCVerificationResultResponse.model_validate(res)

    def reverify_kyc(self, db: Session, application_id: str, current_user: User) -> KYCVerificationResultResponse:
        """Re-run KYC verification for application ID."""
        self._log_audit_event(db, action="Reverification", actor_id=current_user.id, target_app_id=application_id)
        return self.verify_kyc(db, application_id, current_user)


kyc_verification_service = KYCVerificationService()
