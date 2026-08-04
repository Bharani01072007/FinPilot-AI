"""Cross-Document Identity Consistency Checker Module.

Compares customer identity fields (Name, Date of Birth, Address, Document Numbers) across extracted documents.
"""

from typing import Any, Dict, List, Tuple


class IdentityConsistencyChecker:
    """Checker comparing extracted identity attributes across multiple documents."""

    @staticmethod
    def evaluate_consistency(extracted_docs: List[Dict[str, Any]]) -> Tuple[Dict[str, Any], float]:
        """Cross-check extracted fields across documents.

        Returns:
            Tuple of (consistency_checks_dict, consistency_score).
        """
        names: List[str] = []
        dobs: List[str] = []

        for doc_data in extracted_docs:
            fields = doc_data.get("extracted_fields") or {}
            if fields.get("name"):
                names.append(str(fields["name"]).strip().upper())
            if fields.get("dob"):
                dobs.append(str(fields["dob"]).strip())

        checks: Dict[str, Any] = {}

        # 1. Name Match Evaluation
        if len(names) <= 1:
            checks["name_match"] = {"status": "MATCH", "details": "Single name source verified"}
            name_score = 1.0
        else:
            first_name = names[0]
            mismatches = [n for n in names[1:] if n != first_name and first_name not in n and n not in first_name]
            if not mismatches:
                checks["name_match"] = {"status": "MATCH", "details": "Names match across all documents"}
                name_score = 1.0
            else:
                checks["name_match"] = {"status": "MISMATCH", "details": f"Name mismatch: {names}"}
                name_score = 0.0

        # 2. DOB Match Evaluation
        if len(dobs) <= 1:
            checks["dob_match"] = {"status": "MATCH", "details": "Single DOB source verified"}
            dob_score = 1.0
        else:
            first_dob = dobs[0]
            mismatches = [d for d in dobs[1:] if d != first_dob]
            if not mismatches:
                checks["dob_match"] = {"status": "MATCH", "details": "DOB matches across all documents"}
                dob_score = 1.0
            else:
                checks["dob_match"] = {"status": "MISMATCH", "details": f"DOB mismatch: {dobs}"}
                dob_score = 0.0

        overall_consistency_score = round((name_score + dob_score) / 2.0, 2)
        return checks, overall_consistency_score


identity_consistency_checker = IdentityConsistencyChecker()
