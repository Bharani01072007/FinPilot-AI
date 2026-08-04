"""KYC Compliance Immutable Audit Trail Module.

Generates structured, immutable evidence payloads per verification run for regulatory compliance logging.
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.logging import logger


class KYCComplianceAudit:
    """Generates and validates immutable compliance evidence payloads for KYC verification runs."""

    @staticmethod
    def generate_evidence_payload(
        application_id: str,
        actor_id: str,
        recommendation: str,
        overall_confidence: str,
        rule_evaluation: Dict[str, Any],
        risk_indicators: List[Dict[str, Any]],
        consistency_checks: Dict[str, Any],
        findings: List[str],
    ) -> Dict[str, Any]:
        """Build structured compliance evidence payload with immutability hash.

        Returns:
            Compliance evidence dictionary including SHA-256 hash fingerprint.
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        evidence = {
            "application_id": application_id,
            "actor_id": actor_id,
            "recommendation": recommendation,
            "overall_confidence": overall_confidence,
            "rule_evaluation": rule_evaluation,
            "risk_indicators": risk_indicators,
            "consistency_checks": consistency_checks,
            "findings": findings,
            "evidence_timestamp": timestamp,
        }

        # SHA-256 fingerprint for immutability validation
        payload_json = json.dumps(evidence, sort_keys=True, default=str)
        evidence["evidence_hash"] = hashlib.sha256(payload_json.encode()).hexdigest()

        logger.info("[KYC_COMPLIANCE_AUDIT] Evidence generated for application=%s hash=%s", application_id, evidence["evidence_hash"])
        return evidence

    @staticmethod
    def verify_evidence_integrity(evidence: Dict[str, Any]) -> bool:
        """Verify that a compliance evidence payload has not been tampered with.

        Returns:
            True if hash is valid, False if tampered.
        """
        stored_hash = evidence.pop("evidence_hash", None)
        payload_json = json.dumps(evidence, sort_keys=True, default=str)
        computed_hash = hashlib.sha256(payload_json.encode()).hexdigest()
        if stored_hash:
            evidence["evidence_hash"] = stored_hash
        return computed_hash == stored_hash


kyc_compliance_audit = KYCComplianceAudit()
