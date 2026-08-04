"""GDPR Compliance & Data Governance Module — Module 13.

Provides PII export, right-to-erasure workflow, immutable audit log verification, and data retention policies.
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.logging import logger


class GDPRComplianceService:
    """Handles GDPR right-to-access and right-to-erasure workflows."""

    @staticmethod
    def generate_data_export(user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a portable data export for a user (GDPR Article 20)."""
        export = {
            "export_generated_at": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id,
            "data": user_data,
            "gdpr_basis": "Right to Data Portability (Article 20)",
        }
        logger.info("[GDPR_EXPORT] Data export generated for user=%s", user_id)
        return export

    @staticmethod
    def request_erasure(user_id: str) -> Dict[str, Any]:
        """Log a Right-to-Erasure request (GDPR Article 17)."""
        logger.info("[GDPR_ERASURE] Erasure request received for user=%s", user_id)
        return {
            "user_id": user_id,
            "request_type": "RIGHT_TO_ERASURE",
            "status": "QUEUED",
            "message": "Erasure request has been queued for processing within 30 days per GDPR Article 17.",
            "requested_at": datetime.now(timezone.utc).isoformat(),
        }


class DataRetentionPolicy:
    """Configurable data retention and scheduled deletion policy."""

    # Default retention periods (days)
    RETENTION_PERIODS = {
        "audit_logs": 2555,       # 7 years (financial regulatory)
        "documents": 1825,         # 5 years
        "applications": 2555,      # 7 years
        "notifications": 365,      # 1 year
        "sessions": 30,            # 30 days
    }

    @classmethod
    def get_retention_days(cls, entity_type: str) -> int:
        return cls.RETENTION_PERIODS.get(entity_type, 365)


class ImmutableAuditLogService:
    """Append-only audit log integrity verification with hash chaining."""

    @staticmethod
    def compute_chain_hash(previous_hash: Optional[str], log_entry: Dict[str, Any]) -> str:
        """Compute SHA-256 chain hash for immutable log verification."""
        chain_input = f"{previous_hash or 'GENESIS'}:{json.dumps(log_entry, sort_keys=True, default=str)}"
        return hashlib.sha256(chain_input.encode()).hexdigest()

    @staticmethod
    def verify_chain(log_entries: List[Dict[str, Any]]) -> bool:
        """Verify audit log chain integrity. Returns True if unmodified."""
        prev_hash = None
        for entry in log_entries:
            stored_hash = entry.get("chain_hash")
            entry_data = {k: v for k, v in entry.items() if k != "chain_hash"}
            computed = ImmutableAuditLogService.compute_chain_hash(prev_hash, entry_data)
            if stored_hash and computed != stored_hash:
                return False
            prev_hash = stored_hash
        return True


gdpr_service = GDPRComplianceService()
data_retention = DataRetentionPolicy()
immutable_audit = ImmutableAuditLogService()
