"""Document Storage Package."""

from app.modules.documents.storage.base import StorageProvider
from app.modules.documents.storage.local import LocalStorageProvider, storage_provider

__all__ = ["StorageProvider", "LocalStorageProvider", "storage_provider"]
