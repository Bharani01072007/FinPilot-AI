"""OCR Package."""

from app.modules.ai.document_intelligence.ocr.base import OCRProvider, OCRResult
from app.modules.ai.document_intelligence.ocr.webhook_ocr import WebhookOCRProvider, webhook_ocr_provider
from app.modules.ai.document_intelligence.ocr.local_ocr import LocalOCRProvider, local_ocr_provider
from app.modules.ai.document_intelligence.ocr.api4ai_ocr import API4AIOCRProvider, api4ai_ocr_provider
from app.modules.ai.document_intelligence.ocr.interfaces import (
    TesseractOCRProvider,
    GoogleVisionOCRProvider,
    AzureDocIntelligenceProvider,
    AWSTextractProvider,
    PaddleOCRProvider,
)

__all__ = [
    "OCRProvider",
    "OCRResult",
    "WebhookOCRProvider",
    "webhook_ocr_provider",
    "LocalOCRProvider",
    "local_ocr_provider",
    "API4AIOCRProvider",
    "api4ai_ocr_provider",
    "TesseractOCRProvider",
    "GoogleVisionOCRProvider",
    "AzureDocIntelligenceProvider",
    "AWSTextractProvider",
    "PaddleOCRProvider",
]
