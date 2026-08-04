"""Document Intelligence Analysis Result ORM Model.

Stores multi-stage pipeline analysis results including raw OCR text, normalized text, structured JSON fields,
field validation flags, confidence scores, and processing metadata linked to Documents.
"""

from typing import Any, Dict, Optional
from sqlalchemy import Float, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import BaseEntity


class DocumentAnalysisResult(BaseEntity):
    """DocumentAnalysisResult entity holding structured AI extraction outputs."""

    __tablename__ = "document_analysis_results"

    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    
    ocr_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cleaned_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extracted_fields: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    validation_results: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    classification_confidence: Mapped[float] = mapped_column(Float, default=0.9, nullable=False)
    extraction_confidence: Mapped[float] = mapped_column(Float, default=0.9, nullable=False)
    overall_confidence: Mapped[str] = mapped_column(String(20), default="HIGH", nullable=False, index=True)
    
    processing_time_ms: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="COMPLETED", nullable=False, index=True)
    provider_used: Mapped[str] = mapped_column(String(50), default="Gemini", nullable=False)
    model_used: Mapped[str] = mapped_column(String(50), default="gemini-1.5-pro", nullable=False)

    # Relationships
    document: Mapped["Document"] = relationship("Document", foreign_keys=[document_id])
