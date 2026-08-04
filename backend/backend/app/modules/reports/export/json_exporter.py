"""JSON Report Exporter Implementation.

Serializes analytics datasets into formatted JSON file bytes.
"""

import json
from typing import Any, Dict, Tuple
from app.modules.reports.export.base import ExportProvider


class JsonExportProvider(ExportProvider):
    """Concrete JSON report exporter provider."""

    def export(self, report_name: str, data: Dict[str, Any], format_type: str = "json") -> Tuple[bytes, str, str]:
        """Serialize data dictionary to formatted JSON bytes."""
        json_str = json.dumps(data, indent=2, default=str)
        filename = f"{report_name.lower().replace(' ', '_')}_export.json"
        mime_type = "application/json"
        return json_str.encode("utf-8"), filename, mime_type


json_exporter = JsonExportProvider()
