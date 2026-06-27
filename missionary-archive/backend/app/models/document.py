import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Integer, ForeignKey, JSON, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, TSVECTOR
from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Identification
    reference_number: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=True)
    slug: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)

    # Hierarchical metadata
    missionary_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("missionaries.id"), nullable=False, index=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    month: Mapped[int] = mapped_column(Integer, nullable=True)
    genre_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("genres.id"), nullable=True)
    location_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True)

    # Document details
    language: Mapped[str] = mapped_column(String(50), default="English")  # English, Tamil, Malayalam, Mixed
    document_number: Mapped[int] = mapped_column(Integer, default=1)
    page_count: Mapped[int] = mapped_column(Integer, default=1)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    keywords: Mapped[list] = mapped_column(JSON, default=list)

    # Physical description
    condition: Mapped[str] = mapped_column(String(100), nullable=True)  # excellent, good, fair, poor
    physical_description: Mapped[str] = mapped_column(Text, nullable=True)

    # Storage paths
    storage_path: Mapped[str] = mapped_column(String(1000), nullable=True)

    # OCR status
    ocr_status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, processing, completed, failed
    ocr_engine: Mapped[str] = mapped_column(String(100), nullable=True)

    # Audit
    uploaded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Full-text search vector (populated by trigger or application)
    search_vector: Mapped[str] = mapped_column(TSVECTOR, nullable=True)

    # Relationships
    missionary = relationship("Missionary", back_populates="documents")
    genre = relationship("Genre", back_populates="documents")
    location = relationship("Location", back_populates="documents")
    uploaded_by_user = relationship("User", back_populates="documents", foreign_keys=[uploaded_by])
    images = relationship("DocumentImage", back_populates="document", order_by="DocumentImage.page_number", cascade="all, delete-orphan")
    transcriptions = relationship("Transcription", back_populates="document", cascade="all, delete-orphan")
    ocr_jobs = relationship("OCRJob", back_populates="document", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary="document_tags", back_populates="documents")
    audit_logs = relationship("AuditLog", back_populates="document")

    __table_args__ = (
        Index("ix_documents_search_vector", "search_vector", postgresql_using="gin"),
    )


class DocumentImage(Base):
    __tablename__ = "document_images"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    thumbnail_path: Mapped[str] = mapped_column(String(1000), nullable=True)
    file_size: Mapped[int] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=True)
    width: Mapped[int] = mapped_column(Integer, nullable=True)
    height: Mapped[int] = mapped_column(Integer, nullable=True)
    dpi: Mapped[int] = mapped_column(Integer, nullable=True)
    rotation: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="images")
