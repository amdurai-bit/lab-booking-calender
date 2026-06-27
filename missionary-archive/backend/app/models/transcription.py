import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Integer, ForeignKey, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class Transcription(Base):
    __tablename__ = "transcriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    image_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("document_images.id", ondelete="CASCADE"), nullable=True)

    # Content
    raw_text: Mapped[str] = mapped_column(Text, nullable=True)  # OCR raw output
    corrected_text: Mapped[str] = mapped_column(Text, nullable=True)  # Human-corrected
    normalized_text: Mapped[str] = mapped_column(Text, nullable=True)  # Spelling-normalized

    # Line-level data with bounding boxes for image linking
    line_data: Mapped[list] = mapped_column(JSON, default=list)
    # Format: [{"line": 1, "text": "...", "bbox": [x1,y1,x2,y2], "confidence": 0.95}]

    # OCR metadata
    ocr_engine: Mapped[str] = mapped_column(String(100), nullable=True)
    ocr_confidence: Mapped[float] = mapped_column(Float, nullable=True)
    ocr_language: Mapped[str] = mapped_column(String(50), nullable=True)
    ocr_metadata: Mapped[dict] = mapped_column(JSON, default=dict)

    # Version
    version: Mapped[int] = mapped_column(Integer, default=1)
    is_current: Mapped[bool] = mapped_column(default=True)

    # Status
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, reviewed, approved

    # Audit
    transcriber_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="transcriptions")
    image = relationship("DocumentImage")
    transcriber_user = relationship("User", back_populates="transcriptions")
    versions = relationship("TranscriptionVersion", back_populates="transcription", order_by="TranscriptionVersion.version_number", cascade="all, delete-orphan")


class TranscriptionVersion(Base):
    __tablename__ = "transcription_versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transcription_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("transcriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    text_snapshot: Mapped[str] = mapped_column(Text, nullable=True)
    line_data_snapshot: Mapped[list] = mapped_column(JSON, default=list)
    change_summary: Mapped[str] = mapped_column(Text, nullable=True)
    saved_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    saved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    transcription = relationship("Transcription", back_populates="versions")
    saved_by_user = relationship("User")
