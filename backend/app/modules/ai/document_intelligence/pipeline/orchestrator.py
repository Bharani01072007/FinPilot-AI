"""Document Intelligence Pipeline Orchestrator Module.

Orchestrates multi-stage document processing (Classification -> OCR -> Cleaning -> Extraction -> Validation -> Confidence -> Events).
"""

import time
from typing import Any, Dict, Optional
from app.modules.ai.document_intelligence.ocr.api4ai_ocr import api4ai_ocr_provider
from app.modules.ai.document_intelligence.pipeline.classification import classification_service
from app.modules.ai.document_intelligence.pipeline.cleaning import text_cleaning_service
from app.modules.ai.document_intelligence.pipeline.confidence import confidence_scoring_service
from app.modules.ai.document_intelligence.pipeline.extraction import extraction_service
from app.modules.ai.document_intelligence.pipeline.validation import field_validation_service
from app.modules.documents.events import publish_document_event


class DocumentIntelligencePipeline:
    """Multi-stage document processing pipeline orchestrator."""

    def __init__(self, ocr=None):
        self.ocr = ocr or api4ai_ocr_provider

    def process(
        self,
        file_bytes: bytes,
        filename: str,
        mime_type: str,
        document_id: str,
        actor_id: str,
    ) -> Dict[str, Any]:
        """Execute all stages of Document Intelligence Pipeline.

        Returns:
            Dictionary payload containing execution outputs.
        """
        start_time = time.time()

        # Step 1: OCR Text Extraction
        ocr_res = self.ocr.extract_text(file_bytes=file_bytes, mime_type=mime_type, filename=filename)
        raw_text = ocr_res.raw_text

        # Step 2: Document Classification
        doc_type, class_conf = classification_service.classify_document(raw_text=raw_text, filename=filename)
        publish_document_event("DocumentClassified", document_id, actor_id, {"document_type": doc_type, "confidence": class_conf})

        # Step 3: Text Cleaning & Normalization
        cleaned_text = text_cleaning_service.clean_text(raw_text)
        publish_document_event("OCRCompleted", document_id, actor_id, {"page_count": ocr_res.page_count, "char_count": len(cleaned_text)})

        # Step 4: Structured Field Extraction via AI Platform Core Gateway
        extracted_fields = extraction_service.extract_fields(cleaned_text=cleaned_text, document_type=doc_type)

        # Step 5: Field Validation
        val_results = field_validation_service.validate_fields(extracted_fields=extracted_fields, document_type=doc_type)
        publish_document_event("ExtractionCompleted", document_id, actor_id, {"fields_count": len(extracted_fields)})

        # Step 6: Confidence Scoring
        c_conf, e_conf, rating = confidence_scoring_service.calculate_confidence(
            classification_conf=class_conf,
            validation_results=val_results,
            extracted_fields=extracted_fields,
        )

        duration_ms = round((time.time() - start_time) * 1000, 2)

        pipeline_result = {
            "document_id": document_id,
            "document_type": doc_type,
            "ocr_text": raw_text,
            "cleaned_text": cleaned_text,
            "extracted_fields": extracted_fields,
            "validation_results": val_results,
            "classification_confidence": c_conf,
            "extraction_confidence": e_conf,
            "overall_confidence": rating,
            "processing_time_ms": duration_ms,
            "status": "COMPLETED",
            "provider_used": "Gemini",
            "model_used": "gemini-1.5-pro",
        }

        publish_document_event("DocumentProcessed", document_id, actor_id, {"overall_confidence": rating, "duration_ms": duration_ms})

        return pipeline_result


pipeline_orchestrator = DocumentIntelligencePipeline()
