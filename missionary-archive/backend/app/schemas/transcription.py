import uuid
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class TranscriptionUpdate(BaseModel):
    corrected_text: str
    line_data: Optional[List[Any]] = None
    change_summary: Optional[str] = None


class TranscriptionVersionOut(BaseModel):
    id: uuid.UUID
    version_number: int
    text_snapshot: Optional[str]
    change_summary: Optional[str]
    saved_at: datetime

    model_config = {"from_attributes": True}


class TranscriptionOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    image_id: Optional[uuid.UUID]
    raw_text: Optional[str]
    corrected_text: Optional[str]
    line_data: List[Any] = []
    ocr_engine: Optional[str]
    ocr_confidence: Optional[float]
    version: int
    status: str
    created_at: datetime
    updated_at: datetime
    versions: List[TranscriptionVersionOut] = []

    model_config = {"from_attributes": True}


class OCRJobOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    image_id: Optional[uuid.UUID]
    engine: str
    language: str
    status: str
    progress: int
    confidence: Optional[float]
    error_message: Optional[str]
    processing_time_ms: Optional[int]
    queued_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class OCRStartRequest(BaseModel):
    engine: str = "tesseract"
    language: str = "English"
    image_ids: Optional[List[uuid.UUID]] = None  # None = all images
    options: dict = {}
