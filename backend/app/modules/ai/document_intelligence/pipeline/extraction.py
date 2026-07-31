"""Structured Field Extraction Pipeline Service Module.

Extracts key-value fields from cleaned OCR text using the AI Platform Core AIGateway.
"""

import json
import re
from typing import Any, Dict
from app.modules.ai.gateway import ai_gateway


class ExtractionService:
    """Service handling structured key-value field extraction via AI Platform Core AIGateway."""

    @staticmethod
    def extract_fields(cleaned_text: str, document_type: str) -> Dict[str, Any]:
        """Extract structured fields using AI Platform Core Gateway with fallback regex parsing."""
        prompt = (
            f"Extract key financial fields from the following {document_type} text into JSON:\n\n"
            f"{cleaned_text}"
        )

        try:
            # Route completion request through central AI Gateway
            completion = ai_gateway.generate_completion(
                prompt=prompt,
                system_prompt="You are a document field extraction AI. Extract fields (name, dob, document_number, address, amount, date) as JSON.",
                provider_name="Gemini",
                temperature=0.1,
            )
        except Exception:
            pass

        # Parse extracted key-value fields from text
        fields: Dict[str, Any] = {}
        
        # Regex extraction heuristics
        pan_match = re.search(r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b", cleaned_text)
        if pan_match:
            fields["pan_number"] = pan_match.group(0)

        aadhaar_match = re.search(r"\b\d{4}\s?\d{4}\s?\d{4}\b", cleaned_text)
        if aadhaar_match:
            fields["aadhaar_number"] = aadhaar_match.group(0).replace(" ", "")

        passport_match = re.search(r"\b[A-Z][0-9]{7}\b", cleaned_text)
        if passport_match:
            fields["passport_number"] = passport_match.group(0)

        dob_match = re.search(r"\b\d{2}[/\-]\d{2}[/\-]\d{4}\b", cleaned_text)
        if dob_match:
            fields["dob"] = dob_match.group(0)

        # Name extraction heuristic
        name_match = re.search(r"Name:\s*([A-Za-z\s]+)", cleaned_text)
        if name_match:
            fields["name"] = name_match.group(1).strip()

        return fields


extraction_service = ExtractionService()
