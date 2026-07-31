"""Export Architecture Interface.

Defines abstract base class for report export providers (JSON, CSV, Excel, PDF).
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Tuple


class ExportProvider(ABC):
    """Abstract base class for report exporter implementations."""

    @abstractmethod
    def export(self, report_name: str, data: Dict[str, Any], format_type: str = "json") -> Tuple[bytes, str, str]:
        """Export report dataset into formatted bytes.

        Returns:
            Tuple of (formatted_bytes, filename, mime_type).
        """
        pass
