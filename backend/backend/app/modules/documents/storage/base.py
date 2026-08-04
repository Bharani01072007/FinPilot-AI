"""Storage Provider Abstraction Layer Interface.

Defines the contract for file storage implementations (Local Disk, AWS S3, Azure Blob, GCP).
"""

from abc import ABC, abstractmethod
from typing import Optional


class StorageProvider(ABC):
    """Abstract interface for file storage operations."""

    @abstractmethod
    def save_file(self, file_bytes: bytes, filename: str, folder: str = "documents") -> str:
        """Save raw file bytes to storage provider and return relative storage path."""
        pass

    @abstractmethod
    def get_file(self, storage_path: str) -> bytes:
        """Retrieve raw file bytes from storage path."""
        pass

    @abstractmethod
    def delete_file(self, storage_path: str) -> bool:
        """Delete stored file by path."""
        pass

    @abstractmethod
    def generate_secure_url(self, storage_path: str, expires_in: int = 3600) -> str:
        """Generate a temporary signed or secure access URL for preview / download."""
        pass
