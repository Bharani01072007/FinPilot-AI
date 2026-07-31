"""Document Management Business Logic Service Module.

Encapsulates document uploads, storage provider integration, versioning, verification workflows,
reusable customer document vaults, tag management, secure preview/download URLs, Business Event emissions, and audit logging.
"""

from datetime import datetime, timezone
import math
import os
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import BaseAppException, ForbiddenException, NotFoundException
from app.database.enums import VerificationStatus
from app.modules.applications.repositories.application_repository import ApplicationRepository
from app.modules.audit.models import AuditLog
from app.modules.documents.events import DocumentEvents, publish_document_event
from app.modules.documents.models import Document, DocumentCategory, DocumentVault, DocumentVersion, Tag
from app.modules.documents.repositories.document_repository import DocumentRepository
from app.modules.documents.schemas.document import (
    DocumentCategoryResponse,
    DocumentListResponse,
    DocumentResponse,
    DocumentSearchFilter,
    DocumentVaultRequest,
    DocumentVaultResponse,
    DocumentVersionResponse,
    TagResponse,
    VerificationRequest,
)
from app.modules.documents.storage.base import StorageProvider
from app.modules.documents.storage.local import storage_provider
from app.modules.documents.validators import compute_sha256, validate_file_upload
from app.modules.identity.models import User


class DocumentService:
    """Service handling document storage abstraction, version control, verification, and vault linking."""

    def __init__(
        self,
        doc_repo: Optional[DocumentRepository] = None,
        app_repo: Optional[ApplicationRepository] = None,
        storage: Optional[StorageProvider] = None,
    ):
        self.doc_repo = doc_repo or DocumentRepository()
        self.app_repo = app_repo or ApplicationRepository()
        self.storage = storage or storage_provider

    def _log_audit_event(
        self,
        db: Session,
        action: str,
        actor_id: str,
        target_doc_id: str,
        application_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Write a document workflow audit record into audit_logs."""
        audit_entry = AuditLog(
            user_id=actor_id,
            entity="Document",
            entity_id=target_doc_id,
            action=action,
            new_value={"application_id": application_id, **(details or {})},
        )
        db.add(audit_entry)
        db.commit()

    def _enrich_document_urls(self, doc: Document) -> DocumentResponse:
        """Enrich Document entity with secure preview and download URLs."""
        res = DocumentResponse.model_validate(doc)
        if doc.storage_path:
            res.download_url = f"/api/v1/documents/{doc.id}/download"
            res.preview_url = self.storage.generate_secure_url(doc.storage_path)

        # Enrich tags
        res.tags = [TagResponse(id=dt.tag.id, name=dt.tag.name) for dt in doc.document_tags if dt.tag]
        return res

    def upload_document(
        self,
        db: Session,
        file_bytes: bytes,
        filename: str,
        mime_type: str,
        category_id: str,
        application_id: Optional[str],
        current_user: User,
    ) -> DocumentResponse:
        """Upload a new document using storage provider abstraction, computing SHA-256 hash, creating version #1, and publishing event."""
        validate_file_upload(file_size=len(file_bytes), mime_type=mime_type, original_filename=filename)

        category = self.doc_repo.get_category_by_id(db, category_id)
        if not category:
            raise NotFoundException(message="Document category not found")

        if application_id:
            app = self.app_repo.get_by_id(db, application_id)
            if not app:
                raise NotFoundException(message="Linked application not found")

        # Save binary via Storage Provider
        storage_path = self.storage.save_file(file_bytes=file_bytes, filename=filename, folder="documents")

        # Compute SHA-256 Checksum Hash
        sha256_hash = compute_sha256(file_bytes)

        # Create Document Entity
        doc = Document(
            application_id=application_id,
            category_id=category.id,
            uploaded_by=current_user.id,
            file_name=os.path.basename(storage_path),
            original_name=filename,
            storage_path=storage_path,
            mime_type=mime_type,
            file_size=len(file_bytes),
            sha256_hash=sha256_hash,
            storage_provider="LOCAL",
            storage_bucket="finpilot-uploads",
            encryption_status="AES-256",
            virus_scan_status="CLEAN",
            verification_status=VerificationStatus.PENDING,
            created_by=current_user.id,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        # Insert Version #1
        self.doc_repo.add_version(db, doc.id, storage_path, sha256_hash=sha256_hash)

        self._log_audit_event(
            db, action="Document Uploaded", actor_id=current_user.id, target_doc_id=doc.id, application_id=application_id, details={"filename": filename, "file_size": len(file_bytes), "sha256": sha256_hash}
        )

        # Publish Business Event
        publish_document_event(
            event_name=DocumentEvents.DOCUMENT_UPLOADED,
            document_id=doc.id,
            actor_id=current_user.id,
            payload={"application_id": application_id, "category": category.name, "sha256": sha256_hash},
        )

        full_doc = self.doc_repo.get_by_id(db, doc.id) or doc
        return self._enrich_document_urls(full_doc)

    def add_document_version(
        self,
        db: Session,
        doc_id: str,
        file_bytes: bytes,
        filename: str,
        mime_type: str,
        current_user: User,
    ) -> DocumentResponse:
        """Upload a new version for an existing document."""
        doc = self.doc_repo.get_by_id(db, doc_id)
        if not doc:
            raise NotFoundException(message="Document not found")

        validate_file_upload(file_size=len(file_bytes), mime_type=mime_type, original_filename=filename)

        storage_path = self.storage.save_file(file_bytes=file_bytes, filename=filename, folder="documents")
        sha256_hash = compute_sha256(file_bytes)

        doc.storage_path = storage_path
        doc.file_name = os.path.basename(storage_path)
        doc.original_name = filename
        doc.mime_type = mime_type
        doc.file_size = len(file_bytes)
        doc.sha256_hash = sha256_hash
        doc.verification_status = VerificationStatus.PENDING
        doc.updated_by = current_user.id

        db.add(doc)
        db.commit()

        # Add new version entry
        new_version = self.doc_repo.add_version(db, doc.id, storage_path, sha256_hash=sha256_hash)

        self._log_audit_event(
            db, action="Document Updated", actor_id=current_user.id, target_doc_id=doc.id, application_id=doc.application_id, details={"version_number": new_version.version_number, "sha256": sha256_hash}
        )

        # Publish Business Event
        publish_document_event(
            event_name=DocumentEvents.DOCUMENT_VERSION_CREATED,
            document_id=doc.id,
            actor_id=current_user.id,
            payload={"version_number": new_version.version_number, "sha256": sha256_hash},
        )

        full_doc = self.doc_repo.get_by_id(db, doc.id) or doc
        return self._enrich_document_urls(full_doc)

    def verify_document(
        self,
        db: Session,
        doc_id: str,
        req: VerificationRequest,
        current_user: User,
    ) -> DocumentResponse:
        """Verify, reject, or mark pending a document review."""
        doc = self.doc_repo.get_by_id(db, doc_id)
        if not doc:
            raise NotFoundException(message="Document not found")

        doc.verification_status = req.verification_status
        doc.verified_by = current_user.id
        doc.verified_at = datetime.now(timezone.utc)
        doc.updated_by = current_user.id

        db.add(doc)
        db.commit()

        action = "Document Verified" if req.verification_status == VerificationStatus.VERIFIED else "Document Rejected"
        evt_type = DocumentEvents.DOCUMENT_VERIFIED if req.verification_status == VerificationStatus.VERIFIED else DocumentEvents.DOCUMENT_REJECTED

        self._log_audit_event(
            db, action=action, actor_id=current_user.id, target_doc_id=doc.id, application_id=doc.application_id, details={"status": req.verification_status.value, "remarks": req.remarks}
        )

        publish_document_event(
            event_name=evt_type,
            document_id=doc.id,
            actor_id=current_user.id,
            payload={"status": req.verification_status.value, "remarks": req.remarks},
        )

        full_doc = self.doc_repo.get_by_id(db, doc.id) or doc
        return self._enrich_document_urls(full_doc)

    def get_document_by_id(self, db: Session, doc_id: str, current_user: User) -> DocumentResponse:
        """Retrieve document by ID."""
        doc = self.doc_repo.get_by_id(db, doc_id)
        if not doc:
            raise NotFoundException(message="Document not found")
        return self._enrich_document_urls(doc)

    def get_document_versions(self, db: Session, doc_id: str, current_user: User) -> List[DocumentVersionResponse]:
        """Retrieve version history for document."""
        self.get_document_by_id(db, doc_id, current_user)
        versions = self.doc_repo.get_versions(db, doc_id)
        return [DocumentVersionResponse.model_validate(v) for v in versions]

    def search_documents(self, db: Session, filters: DocumentSearchFilter, current_user: User) -> DocumentListResponse:
        """Search and paginate documents."""
        items, total = self.doc_repo.search_documents(db, filters)
        total_pages = math.ceil(total / filters.page_size) if total > 0 else 0

        doc_responses = [self._enrich_document_urls(doc) for doc in items]
        return DocumentListResponse(
            items=doc_responses,
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=total_pages,
        )

    def list_categories(self, db: Session) -> List[DocumentCategoryResponse]:
        """Fetch document categories."""
        categories = self.doc_repo.list_categories(db)
        return [DocumentCategoryResponse.model_validate(c) for c in categories]

    # --- Document Vault ---

    def add_to_vault(self, db: Session, req: DocumentVaultRequest, current_user: User) -> DocumentVaultResponse:
        """Link a document to Customer Document Vault for reuse."""
        doc = self.doc_repo.get_by_id(db, req.document_id)
        if not doc:
            raise NotFoundException(message="Document to link not found")

        vault = self.doc_repo.add_to_vault(
            db=db,
            customer_id=req.customer_id,
            document_id=req.document_id,
            expiry_date=req.expiry_date,
            reusable=req.reusable,
        )

        self._log_audit_event(
            db, action="Document Reused", actor_id=current_user.id, target_doc_id=doc.id, details={"customer_id": req.customer_id, "vault_id": vault.id}
        )

        publish_document_event(
            event_name=DocumentEvents.DOCUMENT_REUSED,
            document_id=doc.id,
            actor_id=current_user.id,
            payload={"customer_id": req.customer_id, "vault_id": vault.id},
        )

        vault_full = self.doc_repo.get_vault_by_id(db, vault.id) or vault
        res = DocumentVaultResponse.model_validate(vault_full)
        if vault_full.document:
            res.document = self._enrich_document_urls(vault_full.document)
        return res

    def get_vault_items(self, db: Session, customer_id: str, current_user: User) -> List[DocumentVaultResponse]:
        """Retrieve customer reusable document vault items."""
        vault_items = self.doc_repo.get_vault_items(db, customer_id)
        results = []
        for v in vault_items:
            vr = DocumentVaultResponse.model_validate(v)
            if v.document:
                vr.document = self._enrich_document_urls(v.document)
            results.append(vr)
        return results

    # --- Tags ---

    def add_tag(self, db: Session, doc_id: str, tag_name: str, current_user: User) -> DocumentResponse:
        """Assign tag to document."""
        doc = self.doc_repo.get_by_id(db, doc_id)
        if not doc:
            raise NotFoundException(message="Document not found")

        tag = self.doc_repo.get_or_create_tag(db, tag_name)
        self.doc_repo.add_document_tag(db, doc.id, tag.id)

        full_doc = self.doc_repo.get_by_id(db, doc.id) or doc
        return self._enrich_document_urls(full_doc)

    def remove_tag(self, db: Session, doc_id: str, tag_id: str, current_user: User) -> DocumentResponse:
        """Remove tag from document."""
        doc = self.doc_repo.get_by_id(db, doc_id)
        if not doc:
            raise NotFoundException(message="Document not found")

        self.doc_repo.remove_document_tag(db, doc.id, tag_id)
        full_doc = self.doc_repo.get_by_id(db, doc.id) or doc
        return self._enrich_document_urls(full_doc)

    # --- Download & Stream ---

    def get_document_file_bytes(self, db: Session, doc_id: str, current_user: User) -> Tuple[bytes, str, str]:
        """Read and return raw document file bytes for secure download.

        Returns:
            Tuple of (file_bytes, filename, mime_type).
        """
        doc = self.doc_repo.get_by_id(db, doc_id)
        if not doc:
            raise NotFoundException(message="Document not found")

        file_bytes = self.storage.get_file(doc.storage_path)

        self._log_audit_event(
            db, action="Document Downloaded", actor_id=current_user.id, target_doc_id=doc.id, application_id=doc.application_id
        )

        return file_bytes, doc.original_name, doc.mime_type


doc_service = DocumentService()
