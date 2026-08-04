"""Document Classification Pipeline Service Module.

Identifies document types (Aadhaar Card, PAN Card, Passport, Driving License, Bank Statement, Salary Slip, Generic PDF/Image).
"""

from typing import Tuple


class ClassificationService:
    """Service classifying document categories from OCR text and metadata."""

    @staticmethod
    def classify_document(raw_text: str, filename: str) -> Tuple[str, float]:
        """Classify document type and calculate classification confidence score.

        Returns:
            Tuple of (document_type, confidence_score).
        """
        text_upper = raw_text.upper()
        fname_upper = filename.upper()

        if "AADHAAR" in text_upper or "GOVERNMENT OF INDIA" in text_upper or "AADHAAR" in fname_upper:
            return "Aadhaar Card", 0.98
        elif "INCOME TAX DEPARTMENT" in text_upper or "PERMANENT ACCOUNT NUMBER" in text_upper or "PAN" in fname_upper:
            return "PAN Card", 0.98
        elif "PASSPORT" in text_upper or "REPUBLIC OF INDIA" in text_upper or "PASSPORT" in fname_upper:
            return "Passport", 0.95
        elif "DRIVING LICENSE" in text_upper or "LICENCE" in text_upper or "DL" in fname_upper:
            return "Driving License", 0.92
        elif "BANK" in text_upper or "STATEMENT" in text_upper or "IFSC" in text_upper:
            return "Bank Statement", 0.90
        elif "SALARY" in text_upper or "PAYSLIP" in text_upper:
            return "Salary Slip", 0.90
        else:
            return "Generic Document", 0.85


classification_service = ClassificationService()
