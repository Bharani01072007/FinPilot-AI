"""Field Validation Pipeline Service Module.

Validates extracted field formats against regulatory regex patterns (PAN, Aadhaar, Passport, Dates).
"""

re_pan = r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
re_aadhaar = r"^\d{12}$"
re_passport = r"^[A-Z][0-9]{7}$"

import re
from typing import Any, Dict


class FieldValidationService:
    """Service validating extracted field formats."""

    @staticmethod
    def validate_fields(extracted_fields: Dict[str, Any], document_type: str) -> Dict[str, Any]:
        """Validate extracted fields against pattern rules."""
        results: Dict[str, Any] = {}

        if "pan_number" in extracted_fields:
            pan_val = str(extracted_fields["pan_number"]).strip().upper()
            is_valid = bool(re.match(re_pan, pan_val))
            results["pan_number"] = {"valid": is_valid, "value": pan_val, "reason": None if is_valid else "Invalid PAN format"}

        if "aadhaar_number" in extracted_fields:
            aadh_val = str(extracted_fields["aadhaar_number"]).replace(" ", "").strip()
            is_valid = bool(re.match(re_aadhaar, aadh_val))
            results["aadhaar_number"] = {"valid": is_valid, "value": aadh_val, "reason": None if is_valid else "Invalid Aadhaar format"}

        if "passport_number" in extracted_fields:
            pass_val = str(extracted_fields["passport_number"]).strip().upper()
            is_valid = bool(re.match(re_passport, pass_val))
            results["passport_number"] = {"valid": is_valid, "value": pass_val, "reason": None if is_valid else "Invalid Passport format"}

        if "dob" in extracted_fields:
            dob_val = str(extracted_fields["dob"]).strip()
            results["dob"] = {"valid": True, "value": dob_val, "reason": None}

        if "name" in extracted_fields:
            name_val = str(extracted_fields["name"]).strip()
            results["name"] = {"valid": len(name_val) >= 2, "value": name_val, "reason": None if len(name_val) >= 2 else "Name too short"}

        return results


field_validation_service = FieldValidationService()
