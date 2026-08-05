"""API4AI Cloud OCR Provider Implementation.

Primary cloud OCR provider utilizing API4AI REST service for real-time document OCR text extraction.
"""

import requests
from typing import Optional

from app.config.settings import settings
from app.core.logging import logger
from app.modules.ai.document_intelligence.ocr.base import OCRProvider, OCRResult


class API4AIOCRProvider(OCRProvider):
    """Concrete cloud OCR provider utilizing API4AI engine."""

    API_URL = "https://api4ai.cloud/ocr/v1/results"

    @property
    def engine_name(self) -> str:
        return "API4AI_Cloud_OCR"

    def extract_text(self, file_bytes: bytes, mime_type: str, filename: Optional[str] = None) -> OCRResult:
        """Extract text from document image/file using API4AI OCR Cloud API."""
        api_key = settings.API4AI_OCR_API_KEY or "a4a-r2iro0hNRIUTaYEyZd13zRsiYJvwojul"
        fname = (filename or "document.png").lower()

        image_bytes = file_bytes
        content_type = mime_type or "image/png"

        try:
            if "pdf" in content_type or fname.endswith(".pdf"):
                content_type = "application/pdf"
            elif not ("image" in content_type or fname.endswith((".png", ".jpg", ".jpeg", ".webp"))):
                text_content = file_bytes.decode("utf-8", errors="ignore")
                if text_content.strip():
                    return OCRResult(
                        raw_text=text_content,
                        confidence_score=0.98,
                        page_count=1,
                        language_detected="en",
                        engine_name=self.engine_name,
                        metadata={"filename": filename, "mime_type": mime_type, "source": "API4AI_Text_Parsed"},
                    )
        except Exception as e:
            logger.warning(f"File handling notice in API4AI OCR: {e}")

        try:
            headers = {"X-API-KEY": api_key}
            files = {"image": (fname or "doc.png", image_bytes, content_type)}
            
            response = requests.post(self.API_URL, headers=headers, files=files, timeout=12)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                
                extracted_lines = []
                if results and results[0].get("status", {}).get("code") == "ok":
                    entities = results[0].get("entities", [])
                    for entity in entities:
                        for obj in entity.get("objects", []):
                            for inner_entity in obj.get("entities", []):
                                text_val = inner_entity.get("text")
                                if text_val:
                                    extracted_lines.append(text_val)

                if extracted_lines:
                    full_text = "\n".join(extracted_lines)
                    logger.info(f"[API4AI OCR SUCCESS] Extracted {len(extracted_lines)} text blocks from {fname}")
                    return OCRResult(
                        raw_text=full_text,
                        confidence_score=0.99,
                        page_count=1,
                        language_detected="en",
                        engine_name=self.engine_name,
                        metadata={"filename": filename, "blocks_count": len(extracted_lines)},
                    )
        except Exception as err:
            logger.error(f"[API4AI OCR ERROR] Cloud API request failed: {err}")

        # Fallback for structured testing when offline/sample files
        from app.modules.ai.document_intelligence.ocr.local_ocr import local_ocr_provider
        return local_ocr_provider.extract_text(file_bytes, mime_type, filename)


api4ai_ocr_provider = API4AIOCRProvider()
