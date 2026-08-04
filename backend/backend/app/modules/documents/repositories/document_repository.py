"""Document Repository Module.

Provides data access logic for Document, DocumentCategory, DocumentVersion, DocumentVault, and Tag models with eager loading.
"""

from datetime import datetime, timezone
from typing import Any, List, Optional, Tuple
from sqlalchemy import or_, desc, asc
from sqlalchemy.orm import Session, joinedload
from app.repositories.base import BaseRepository
from app.modules.documents.models import (
    Document,
    DocumentCategory,
    DocumentTag,
    DocumentVault,
    DocumentVersion,
    Tag,
)
from app.modules.documents.schemas.document import DocumentSearchFilter


class DocumentRepository(BaseRepository[Document, Any, Any]):
    """Repository managing database operations for documents, versions, vault, and tags."""

    def __init__(self):
        super().__init__(model=Document)

    def get_by_id(self, db: Session, doc_id: str) -> Optional[Document]:
        """Fetch document by ID with loaded relationships."""
        return (
            db.query(Document)
            .options(
                joinedload(Document.category),
                joinedload(Document.uploader),
                joinedload(Document.verifier),
                joinedload(Document.versions),
                joinedload(Document.document_tags).joinedload(DocumentTag.tag),
            )
            .filter(Document.id == doc_id, Document.is_deleted == False)
            .first()
        )

    def search_documents(self, db: Session, filters: DocumentSearchFilter) -> Tuple[List[Document], int]:
        """Search, filter, sort, and paginate active documents.

        Returns:
            Tuple of (List[Document], total_count).
        """
        query = db.query(Document).filter(Document.is_deleted == False)

        # 1. Search term (Original Filename, Storage Filename)
        if filters.search and filters.search.strip():
            term = f"%{filters.search.strip()}%"
            query = query.filter(
                or_(
                    Document.original_name.ilike(term),
                    Document.file_name.ilike(term),
                )
            )

        # 2. Filters
        if filters.application_id:
            query = query.filter(Document.application_id == filters.application_id)

        if filters.category_id:
            query = query.filter(Document.category_id == filters.category_id)

        if filters.verification_status:
            query = query.filter(Document.verification_status == filters.verification_status)

        if filters.uploaded_by:
            query = query.filter(Document.uploaded_by == filters.uploaded_by)

        if filters.date_from:
            query = query.filter(Document.created_at >= filters.date_from)

        if filters.date_to:
            query = query.filter(Document.created_at <= filters.date_to)

        if filters.tag and filters.tag.strip():
            query = query.join(Document.document_tags).join(DocumentTag.tag).filter(Tag.name.ilike(filters.tag.strip()))

        total_count = query.count()

        # 3. Sorting
        sort_col = getattr(Document, filters.sort_by, Document.created_at)
        if filters.sort_order.lower() == "asc":
            query = query.order_by(asc(sort_col))
        else:
            query = query.order_by(desc(sort_col))

        # 4. Pagination with Eager Loading to eliminate N+1 queries
        skip = (filters.page - 1) * filters.page_size
        items = (
            query.options(
                joinedload(Document.category),
                joinedload(Document.uploader),
                joinedload(Document.verifier),
                joinedload(Document.versions),
                joinedload(Document.document_tags).joinedload(DocumentTag.tag),
            )
            .offset(skip)
            .limit(filters.page_size)
            .all()
        )

        return items, total_count

    # --- Categories ---

    def list_categories(self, db: Session) -> List[DocumentCategory]:
        """Fetch all document category definitions."""
        return db.query(DocumentCategory).all()

    def get_category_by_id(self, db: Session, category_id: str) -> Optional[DocumentCategory]:
        """Fetch category by ID."""
        return db.query(DocumentCategory).filter(DocumentCategory.id == category_id).first()

    def get_category_by_name(self, db: Session, name: str) -> Optional[DocumentCategory]:
        """Fetch category by name."""
        return db.query(DocumentCategory).filter(DocumentCategory.name == name).first()

    # --- Versioning ---

    def add_version(self, db: Session, doc_id: str, storage_path: str, sha256_hash: Optional[str] = None) -> DocumentVersion:
        """Create a new version record for a document."""
        current_max = (
            db.query(DocumentVersion)
            .filter(DocumentVersion.document_id == doc_id)
            .order_by(desc(DocumentVersion.version_number))
            .first()
        )
        next_ver = (current_max.version_number + 1) if current_max else 1

        version = DocumentVersion(
            document_id=doc_id,
            version_number=next_ver,
            storage_path=storage_path,
            sha256_hash=sha256_hash,
            uploaded_at=datetime.now(timezone.utc),
        )
        db.add(version)
        db.commit()
        db.refresh(version)
        return version

    def get_versions(self, db: Session, doc_id: str) -> List[DocumentVersion]:
        """Fetch version history for a document."""
        return (
            db.query(DocumentVersion)
            .filter(DocumentVersion.document_id == doc_id)
            .order_by(asc(DocumentVersion.version_number))
            .all()
        )

    # --- Tagging ---

    def get_or_create_tag(self, db: Session, tag_name: str) -> Tag:
        """Fetch existing tag or create new tag entity."""
        clean_name = tag_name.strip()
        tag = db.query(Tag).filter(Tag.name.ilike(clean_name)).first()
        if not tag:
            tag = Tag(name=clean_name)
            db.add(tag)
            db.commit()
            db.refresh(tag)
        return tag

    def add_document_tag(self, db: Session, doc_id: str, tag_id: str) -> Optional[DocumentTag]:
        """Link tag to document preventing duplicate tags."""
        existing = db.query(DocumentTag).filter(
            DocumentTag.document_id == doc_id,
            DocumentTag.tag_id == tag_id,
        ).first()
        if existing:
            return existing

        doc_tag = DocumentTag(document_id=doc_id, tag_id=tag_id)
        db.add(doc_tag)
        db.commit()
        db.refresh(doc_tag)
        return doc_tag

    def remove_document_tag(self, db: Session, doc_id: str, tag_id: str) -> bool:
        """Remove tag association from document."""
        doc_tag = db.query(DocumentTag).filter(
            DocumentTag.document_id == doc_id,
            DocumentTag.tag_id == tag_id,
        ).first()
        if doc_tag:
            db.delete(doc_tag)
            db.commit()
            return True
        return False

    # --- Document Vault ---

    def add_to_vault(
        self,
        db: Session,
        customer_id: str,
        document_id: str,
        expiry_date: Optional[Any] = None,
        reusable: bool = True,
    ) -> DocumentVault:
        """Create or update customer document vault record."""
        vault = (
            db.query(DocumentVault)
            .filter(DocumentVault.customer_id == customer_id, DocumentVault.document_id == document_id)
            .first()
        )
        if not vault:
            vault = DocumentVault(
                customer_id=customer_id,
                document_id=document_id,
                expiry_date=expiry_date,
                reusable=reusable,
            )
            db.add(vault)
        else:
            vault.expiry_date = expiry_date
            vault.reusable = reusable
            db.add(vault)

        db.commit()
        db.refresh(vault)
        return vault

    def get_vault_items(self, db: Session, customer_id: str) -> List[DocumentVault]:
        """Fetch active vault items for customer."""
        return (
            db.query(DocumentVault)
            .options(
                joinedload(DocumentVault.document).joinedload(Document.category),
                joinedload(DocumentVault.document).joinedload(Document.versions),
            )
            .filter(DocumentVault.customer_id == customer_id, DocumentVault.is_deleted == False)
            .all()
        )

    def get_vault_by_id(self, db: Session, vault_id: str) -> Optional[DocumentVault]:
        """Fetch vault record by ID."""
        return (
            db.query(DocumentVault)
            .options(
                joinedload(DocumentVault.document).joinedload(Document.category),
                joinedload(DocumentVault.document).joinedload(Document.versions),
            )
            .filter(DocumentVault.id == vault_id, DocumentVault.is_deleted == False)
            .first()
        )
