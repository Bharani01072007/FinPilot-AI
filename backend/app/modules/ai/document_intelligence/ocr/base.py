"""OCR Provider Abstraction Layer Interface.

Defines standard data classes and abstract base class for Optical Character Recognition (OCR) engines.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass
class OCRResult:
    """Standardized OCR extraction result container."""

    raw_text: str
    confidence_score: float
    page_count: int = 1
    language_detected: str = "en"
    engine_name: str = "LocalOCR"
    metadata: Dict[str, Any] = field(default_factory=dict)


class OCRProvider(ABC):
    """Abstract base class for OCR engines."""

    @property
    @abstractmethod
    def engine_name(self) -> str:
        """Name of the OCR engine."""
        pass

    @abstractmethod
    def extract_text(self, file_bytes: bytes, mime_type: str, filename: Optional[str] = None) -> OCRResult:
        """Extract raw text from binary document file."""
        pass
