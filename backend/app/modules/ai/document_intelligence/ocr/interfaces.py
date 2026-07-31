"""Pluggable Provider Interfaces for Future OCR Engines.

Defines interface definitions for Tesseract, Google Vision, Azure Document Intelligence, AWS Textract, and PaddleOCR engines.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from app.modules.ai.document_intelligence.ocr.base import OCRResult


class TesseractOCRProvider(ABC):
    """Interface for Tesseract open-source OCR engine."""

    @abstractmethod
    def extract_tesseract(self, file_bytes: bytes, lang: str = "eng") -> OCRResult:
        pass


class GoogleVisionOCRProvider(ABC):
    """Interface for Google Cloud Vision OCR API."""

    @abstractmethod
    def extract_google_vision(self, file_bytes: bytes) -> OCRResult:
        pass


class AzureDocIntelligenceProvider(ABC):
    """Interface for Azure AI Document Intelligence Form Recognizer API."""

    @abstractmethod
    def extract_azure(self, file_bytes: bytes, model_id: str = "prebuilt-read") -> OCRResult:
        pass


class AWSTextractProvider(ABC):
    """Interface for AWS Textract Document Analysis API."""

    @abstractmethod
    def extract_textract(self, file_bytes: bytes) -> OCRResult:
        pass


class PaddleOCRProvider(ABC):
    """Interface for PaddleOCR deep learning OCR engine."""

    @abstractmethod
    def extract_paddle(self, file_bytes: bytes) -> OCRResult:
        pass
