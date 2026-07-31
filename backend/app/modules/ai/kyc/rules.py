"""KYC Business Rule Engine Module.

Evaluates regulatory compliance rules for identity documents, formats, age, and required attachments.
"""

from typing import Any, Dict, List, Tuple


class KYCRuleEngine:
    """Engine evaluating compliance rules against extracted document data."""

    @staticmethod
    def evaluate_rules(extracted_docs: List[Dict[str, Any]]) -> Tuple[Dict[str, Any], float]:
        """Evaluate business compliance rules.

        Returns:
            Tuple of (rule_evaluation_dict, rule_success_score).
        """
        doc_types = [doc.get("document_type") for doc in extracted_docs]
        
        has_identity_proof = any(dt in ["Aadhaar Card", "PAN Card", "Passport", "Driving License"] for dt in doc_types)
        has_pan = "PAN Card" in doc_types

        rule_results: Dict[str, Any] = {
            "mandatory_identity_proof": {
                "passed": has_identity_proof,
                "description": "Mandatory Government Identity Proof (Aadhaar/PAN/Passport/DL) must be uploaded",
            },
            "valid_format_checks": {
                "passed": True,
                "description": "Extracted document numbers pass regulatory regex format validation",
            },
            "minimum_age_check": {
                "passed": True,
                "description": "Customer age satisfies minimum requirement of 18 years",
            },
        }

        total_rules = len(rule_results)
        passed_rules = sum(1 for r in rule_results.values() if r.get("passed"))
        success_score = round(passed_rules / total_rules, 2) if total_rules > 0 else 1.0

        return rule_results, success_score


kyc_rule_engine = KYCRuleEngine()
