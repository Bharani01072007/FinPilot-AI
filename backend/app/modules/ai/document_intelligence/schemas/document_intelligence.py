"""Document Intelligence Domain Pydantic Schemas.

Defines DTOs for document processing requests, analysis results, and pipeline status endpoints.
"""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class DocumentProcessRequest(BaseModel):
    """Payload for initiating Document Intelligence Pipeline processing."""

    document_id: str = Field(..., description="Target Document UUID to process")


class DocumentAnalysisResultResponse(BaseModel):
    """Document Intelligence Analysis Result DTO."""

    id: str
    document_id: str
    document_type: str
    ocr_text: Optional[str] = None
    cleaned_text: Optional[str] = None
    extracted_fields: Optional[Dict[str, Any]] = None
    validation_results: Optional[Dict[str, Any]] = None
    classification_confidence: float
    extraction_confidence: float
    overall_confidence: str
    processing_time_ms: float
    status: str
    provider_used: str
    model_used: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentStatusResponse(BaseModel):
    """Pipeline processing status response schema."""

    document_id: str
    status: str
    overall_confidence: Optional[str] = None
    created_at: Optional[datetime] = None
