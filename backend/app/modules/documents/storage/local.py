"""Local Disk Storage Provider Implementation.

Stores files locally on the filesystem under configured upload storage directory.
"""

import os
import uuid
from typing import Optional
from app.config.settings import settings
from app.core.exceptions import BaseAppException, NotFoundException
from app.modules.documents.storage.base import StorageProvider

# Ensure storage directory exists
STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "storage", "uploads")
os.makedirs(STORAGE_DIR, exist_ok=True)


class LocalStorageProvider(StorageProvider):
    """Local disk storage provider implementation."""

    def __init__(self, base_dir: str = STORAGE_DIR):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    def _full_path(self, storage_path: str) -> str:
        """Resolve full filesystem path safely."""
        clean_path = storage_path.replace("..", "").lstrip("/\\")
        return os.path.join(self.base_dir, clean_path)

    def save_file(self, file_bytes: bytes, filename: str, folder: str = "documents") -> str:
        """Save file bytes locally under target folder with unique name."""
        ext = os.path.splitext(filename)[1].lower()
        unique_name = f"{uuid.uuid4().hex}{ext}"
        relative_path = os.path.join(folder, unique_name)
        full_dest = self._full_path(relative_path)

        os.makedirs(os.path.dirname(full_dest), exist_ok=True)
        with open(full_dest, "wb") as f:
            f.write(file_bytes)

        return relative_path.replace("\\", "/")

    def get_file(self, storage_path: str) -> bytes:
        """Read and return local file bytes."""
        full_dest = self._full_path(storage_path)
        if not os.path.exists(full_dest):
            raise NotFoundException(message=f"File not found at storage path '{storage_path}'")
        with open(full_dest, "rb") as f:
            return f.read()

    def delete_file(self, storage_path: str) -> bool:
        """Delete local file if exists."""
        full_dest = self._full_path(storage_path)
        if os.path.exists(full_dest):
            os.remove(full_dest)
            return True
        return False

    def generate_secure_url(self, storage_path: str, expires_in: int = 3600) -> str:
        """Generate local secure preview / download URL string."""
        clean_path = storage_path.replace("\\", "/")
        return f"/api/v1/documents/preview-file?path={clean_path}"


# Default Singleton Storage Instance
storage_provider = LocalStorageProvider()
