"""Document Domain ORM Models.

Defines DocumentCategory, Document, DocumentVersion, DocumentVault, Tag, DocumentTag, and Attachment models.
"""

from datetime import datetime, timezone, date
from typing import List, Optional
from sqlalchemy import BigInteger, Boolean, Date, DateTime, Enum as SQLEnum, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import BaseEntity
from app.database.enums import VerificationStatus


class DocumentCategory(BaseEntity):
    """DocumentCategory entity storing document classifications (Aadhaar, PAN, etc.)."""

    __tablename__ = "document_categories"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="category")


class Document(BaseEntity):
    """Document entity holding document metadata, verification state, security checksums, and verifier audit details."""

    __tablename__ = "documents"
    __table_args__ = (
        Index("ix_documents_app_verification", "application_id", "verification_status"),
    )

    application_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("applications.id", ondelete="SET NULL"), nullable=True, index=True)
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("document_categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    uploaded_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    verified_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)

    # Security & Compliance Metadata
    sha256_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    storage_provider: Mapped[str] = mapped_column(String(50), default="LOCAL", nullable=False)
    storage_bucket: Mapped[str] = mapped_column(String(100), default="finpilot-uploads", nullable=False)
    encryption_status: Mapped[str] = mapped_column(String(50), default="AES-256", nullable=False)
    virus_scan_status: Mapped[str] = mapped_column(String(50), default="CLEAN", nullable=False)
    
    verification_status: Mapped[VerificationStatus] = mapped_column(
        SQLEnum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False, index=True
    )

    # Relationships
    application: Mapped[Optional["Application"]] = relationship("Application", back_populates="documents")
    category: Mapped["DocumentCategory"] = relationship("DocumentCategory", back_populates="documents")
    uploader: Mapped["User"] = relationship("User", foreign_keys=[uploaded_by])
    verifier: Mapped[Optional["User"]] = relationship("User", foreign_keys=[verified_by], back_populates="verified_documents")

    versions: Mapped[List["DocumentVersion"]] = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")
    vault_entries: Mapped[List["DocumentVault"]] = relationship("DocumentVault", back_populates="document", cascade="all, delete-orphan")
    document_tags: Mapped[List["DocumentTag"]] = relationship("DocumentTag", back_populates="document", cascade="all, delete-orphan")
    tags: Mapped[List["Tag"]] = relationship("Tag", secondary="document_tags", back_populates="documents", viewonly=True)


class DocumentVersion(BaseEntity):
    """DocumentVersion entity recording version history of uploaded documents."""

    __tablename__ = "document_versions"

    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    sha256_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    document: Mapped["Document"] = relationship("Document", back_populates="versions")


class DocumentVault(BaseEntity):
    """DocumentVault entity providing DigiLocker-style reusable customer document storage."""

    __tablename__ = "document_vault"

    customer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    is_expired: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    reusable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    customer: Mapped["User"] = relationship("User", foreign_keys=[customer_id])
    document: Mapped["Document"] = relationship("Document", back_populates="vault_entries")


class Tag(BaseEntity):
    """Tag entity for categorizing and searching documents."""

    __tablename__ = "tags"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    # Relationships
    document_tags: Mapped[List["DocumentTag"]] = relationship("DocumentTag", back_populates="tag", cascade="all, delete-orphan")
    documents: Mapped[List["Document"]] = relationship("Document", secondary="document_tags", back_populates="tags", viewonly=True)


class DocumentTag(BaseEntity):
    """DocumentTag join model linking Documents and Tags with Composite Unique constraint."""

    __tablename__ = "document_tags"
    __table_args__ = (
        UniqueConstraint("document_id", "tag_id", name="uq_document_tag"),
    )

    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    tag_id: Mapped[str] = mapped_column(String(36), ForeignKey("tags.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    document: Mapped["Document"] = relationship("Document", back_populates="document_tags")
    tag: Mapped["Tag"] = relationship("Tag", back_populates="document_tags")


class Attachment(BaseEntity):
    """Attachment entity for storing auxiliary file attachments associated with applications."""

    __tablename__ = "attachments"

    application_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=True, index=True)
    uploaded_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relationships
    application: Mapped[Optional["Application"]] = relationship("Application", back_populates="attachments")
    uploader: Mapped["User"] = relationship("User", foreign_keys=[uploaded_by], back_populates="attachments")
