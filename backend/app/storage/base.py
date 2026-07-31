"""Abstract File & Document Storage Provider Interface.

Defines contractual interface for future file uploads (Local, S3, Azure Blob).
"""

from abc import ABC, abstractmethod
from typing import BinaryIO, Optional


class BaseStorageProvider(ABC):
    """Abstract interface for object storage providers."""

    @abstractmethod
    async def upload_file(self, file_obj: BinaryIO, destination: str) -> str:
        """Upload file object to storage and return destination URL/path."""
        pass

    @abstractmethod
    async def download_file(self, file_path: str) -> Optional[bytes]:
        """Download file content from storage by path."""
        pass

    @abstractmethod
    async def delete_file(self, file_path: str) -> bool:
        """Delete file from storage by path."""
        pass
