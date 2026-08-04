"""KYC Risk Indicator Engine Module.

Detects risk indicators, document mismatches, and data quality flags.
"""

from typing import Any, Dict, List


class RiskIndicatorEngine:
    """Engine identifying risk flags and document quality warnings."""

    @staticmethod
    def identify_risk_indicators(
        consistency_checks: Dict[str, Any],
        rule_evaluation: Dict[str, Any],
        extracted_docs: List[Dict[str, Any]],
    ) -> List[Dict[str, str]]:
        """Identify risk indicators.

        Returns:
            List of flagged risk indicator dictionaries.
        """
        risks: List[Dict[str, str]] = []

        # 1. Missing Identity Proof Check
        if not rule_evaluation.get("mandatory_identity_proof", {}).get("passed"):
            risks.append({
                "code": "MISSING_IDENTITY_PROOF",
                "severity": "HIGH",
                "message": "Mandatory identity proof document is missing from application submission.",
            })

        # 2. Name Mismatch Check
        name_check = consistency_checks.get("name_match", {})
        if name_check.get("status") == "MISMATCH":
            risks.append({
                "code": "NAME_MISMATCH",
                "severity": "HIGH",
                "message": "Customer name mismatch detected across submitted documents.",
            })

        # 3. DOB Mismatch Check
        dob_check = consistency_checks.get("dob_match", {})
        if dob_check.get("status") == "MISMATCH":
            risks.append({
                "code": "DOB_MISMATCH",
                "severity": "HIGH",
                "message": "Date of Birth mismatch detected across submitted documents.",
            })

        # 4. Low Confidence Extraction Check
        for doc in extracted_docs:
            if doc.get("overall_confidence") == "LOW":
                risks.append({
                    "code": "LOW_EXTRACTION_CONFIDENCE",
                    "severity": "MEDIUM",
                    "message": f"Document '{doc.get('document_type')}' has low OCR/extraction confidence rating.",
                })

        return risks


risk_indicator_engine = RiskIndicatorEngine()
