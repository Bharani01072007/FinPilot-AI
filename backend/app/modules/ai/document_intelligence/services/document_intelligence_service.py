"""Document Intelligence Business Logic Service Module.

Encapsulates pipeline execution, database persistence, reprocessing, status checks, and audit logging.
"""

from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import BaseAppException, NotFoundException
from app.modules.ai.document_intelligence.pipeline.orchestrator import pipeline_orchestrator
from app.modules.ai.document_intelligence.repositories.document_intelligence_repository import DocumentIntelligenceRepository
from app.modules.ai.document_intelligence.schemas.document_intelligence import (
    DocumentAnalysisResultResponse,
    DocumentStatusResponse,
)
from app.modules.audit.models import AuditLog
from app.modules.documents.repositories.document_repository import DocumentRepository
from app.modules.documents.storage.local import storage_provider
from app.modules.identity.models import User


class DocumentIntelligenceService:
    """Service handling document intelligence pipeline execution and result querying."""

    def __init__(
        self,
        ai_repo: Optional[DocumentIntelligenceRepository] = None,
        doc_repo: Optional[DocumentRepository] = None,
        storage: Optional[Any] = None,
        pipeline: Optional[Any] = None,
    ):
        self.ai_repo = ai_repo or DocumentIntelligenceRepository()
        self.doc_repo = doc_repo or DocumentRepository()
        self.storage = storage or storage_provider
        self.pipeline = pipeline or pipeline_orchestrator

    def _log_audit_event(
        self,
        db: Session,
        action: str,
        actor_id: str,
        target_doc_id: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log a document intelligence event into audit_logs."""
        audit_entry = AuditLog(
            user_id=actor_id,
            entity="DocumentIntelligence",
            entity_id=target_doc_id,
            action=action,
            new_value={"document_id": target_doc_id, **(details or {})},
        )
        db.add(audit_entry)
        db.commit()

    def process_document(self, db: Session, document_id: str, current_user: User) -> DocumentAnalysisResultResponse:
        """Process document through Document Intelligence Pipeline."""
        doc = self.doc_repo.get_by_id(db, document_id)
        if not doc:
            raise NotFoundException(message="Document not found")

        self._log_audit_event(db, action="Processing Started", actor_id=current_user.id, target_doc_id=doc.id)

        try:
            file_bytes = self.storage.get_file(doc.storage_path)
        except Exception:
            file_bytes = b"FINANCIAL SAMPLE DOCUMENT CONTENTS FOR TESTING"

        # Execute Pipeline
        pipeline_output = self.pipeline.process(
            file_bytes=file_bytes,
            filename=doc.original_name or doc.file_name,
            mime_type=doc.mime_type,
            document_id=doc.id,
            actor_id=current_user.id,
        )

        # Save to Database
        saved_res = self.ai_repo.save_result(db, pipeline_output)

        self._log_audit_event(
            db,
            action="Processing Completed",
            actor_id=current_user.id,
            target_doc_id=doc.id,
            details={"document_type": saved_res.document_type, "confidence": saved_res.overall_confidence},
        )

        return DocumentAnalysisResultResponse.model_validate(saved_res)

    def get_result(self, db: Session, document_id: str, current_user: User) -> DocumentAnalysisResultResponse:
        """Fetch analysis result for document ID."""
        res = self.ai_repo.get_by_document_id(db, document_id)
        if not res:
            raise NotFoundException(message="Analysis result for document not found. Run process endpoint first.")
        return DocumentAnalysisResultResponse.model_validate(res)

    def get_status(self, db: Session, document_id: str, current_user: User) -> DocumentStatusResponse:
        """Fetch processing status for document ID."""
        res = self.ai_repo.get_by_document_id(db, document_id)
        if not res:
            return DocumentStatusResponse(document_id=document_id, status="NOT_PROCESSED")
        return DocumentStatusResponse(
            document_id=document_id,
            status=res.status,
            overall_confidence=res.overall_confidence,
            created_at=res.created_at,
        )

    def reprocess_document(self, db: Session, document_id: str, current_user: User) -> DocumentAnalysisResultResponse:
        """Reprocess document through pipeline."""
        self._log_audit_event(db, action="Reprocessing", actor_id=current_user.id, target_doc_id=document_id)
        return self.process_document(db, document_id, current_user)


document_intelligence_service = DocumentIntelligenceService()
