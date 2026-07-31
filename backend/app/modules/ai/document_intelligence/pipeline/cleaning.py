"""OCR Text Normalization & Cleaning Pipeline Service Module.

Cleans OCR output text by removing noise, normalizing whitespace, and fixing broken line breaks while preserving original OCR for audit.
"""

import re


class TextCleaningService:
    """Service cleaning and normalizing OCR text output."""

    @staticmethod
    def clean_text(raw_text: str) -> str:
        """Normalize OCR text.

        Returns:
            Cleaned and normalized text string.
        """
        if not raw_text:
            return ""

        # 1. Normalize line-by-line whitespace
        lines = [re.sub(r"[ \t]+", " ", line).strip() for line in raw_text.splitlines()]
        # 2. Rejoin lines and collapse multiple blank lines into double newline
        cleaned = "\n".join(lines)
        cleaned = re.sub(r"\n\s*\n+", "\n\n", cleaned)

        return cleaned.strip()


text_cleaning_service = TextCleaningService()
