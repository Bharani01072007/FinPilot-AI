"""Document Intelligence Repository Module.

Provides database access logic for DocumentAnalysisResult ORM entities.
"""

from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.modules.ai.document_intelligence.models import DocumentAnalysisResult


class DocumentIntelligenceRepository(BaseRepository[DocumentAnalysisResult, Any, Any]):
    """Repository managing database persistence for document intelligence outputs."""

    def __init__(self):
        super().__init__(model=DocumentAnalysisResult)

    def get_by_document_id(self, db: Session, doc_id: str) -> Optional[DocumentAnalysisResult]:
        """Fetch analysis result entity linked to document ID."""
        return (
            db.query(DocumentAnalysisResult)
            .filter(DocumentAnalysisResult.document_id == doc_id, DocumentAnalysisResult.is_deleted == False)
            .order_by(DocumentAnalysisResult.created_at.desc())
            .first()
        )

    def save_result(self, db: Session, payload: Dict[str, Any]) -> DocumentAnalysisResult:
        """Create or update DocumentAnalysisResult record."""
        doc_id = payload["document_id"]
        existing = self.get_by_document_id(db, doc_id)

        if not existing:
            res = DocumentAnalysisResult(
                document_id=doc_id,
                document_type=payload["document_type"],
                ocr_text=payload.get("ocr_text"),
                cleaned_text=payload.get("cleaned_text"),
                extracted_fields=payload.get("extracted_fields"),
                validation_results=payload.get("validation_results"),
                classification_confidence=payload.get("classification_confidence", 0.9),
                extraction_confidence=payload.get("extraction_confidence", 0.9),
                overall_confidence=payload.get("overall_confidence", "HIGH"),
                processing_time_ms=payload.get("processing_time_ms", 0.0),
                status=payload.get("status", "COMPLETED"),
                provider_used=payload.get("provider_used", "Gemini"),
                model_used=payload.get("model_used", "gemini-1.5-pro"),
            )
            db.add(res)
        else:
            existing.document_type = payload["document_type"]
            existing.ocr_text = payload.get("ocr_text")
            existing.cleaned_text = payload.get("cleaned_text")
            existing.extracted_fields = payload.get("extracted_fields")
            existing.validation_results = payload.get("validation_results")
            existing.classification_confidence = payload.get("classification_confidence", 0.9)
            existing.extraction_confidence = payload.get("extraction_confidence", 0.9)
            existing.overall_confidence = payload.get("overall_confidence", "HIGH")
            existing.processing_time_ms = payload.get("processing_time_ms", 0.0)
            existing.status = payload.get("status", "COMPLETED")
            existing.provider_used = payload.get("provider_used", "Gemini")
            existing.model_used = payload.get("model_used", "gemini-1.5-pro")
            res = existing
            db.add(existing)

        db.commit()
        db.refresh(res)
        return res
