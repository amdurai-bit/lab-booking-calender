import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class DocumentCreate(BaseModel):
    missionary_id: uuid.UUID
    year: int
    month: Optional[int] = None
    genre_id: Optional[uuid.UUID] = None
    location_id: Optional[uuid.UUID] = None
    language: str = "English"
    title: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    keywords: List[str] = []
    condition: Optional[str] = None
    physical_description: Optional[str] = None


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    keywords: Optional[List[str]] = None
    condition: Optional[str] = None
    physical_description: Optional[str] = None
    language: Optional[str] = None
    location_id: Optional[uuid.UUID] = None
    genre_id: Optional[uuid.UUID] = None
    month: Optional[int] = None


class DocumentImageOut(BaseModel):
    id: uuid.UUID
    page_number: int
    original_filename: str
    stored_filename: str
    file_path: str
    thumbnail_path: Optional[str]
    file_size: Optional[int]
    width: Optional[int]
    height: Optional[int]
    rotation: int
    created_at: datetime

    model_config = {"from_attributes": True}


class MissionaryBrief(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    model_config = {"from_attributes": True}


class GenreBrief(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    model_config = {"from_attributes": True}


class DocumentOut(BaseModel):
    id: uuid.UUID
    reference_number: str
    title: Optional[str]
    slug: str
    year: int
    month: Optional[int]
    language: str
    document_number: int
    page_count: int
    description: Optional[str]
    notes: Optional[str]
    keywords: List[str]
    ocr_status: str
    ocr_engine: Optional[str]
    condition: Optional[str]
    missionary: Optional[MissionaryBrief]
    genre: Optional[GenreBrief]
    images: List[DocumentImageOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentListItem(BaseModel):
    id: uuid.UUID
    reference_number: str
    title: Optional[str]
    year: int
    language: str
    ocr_status: str
    page_count: int
    missionary: Optional[MissionaryBrief]
    genre: Optional[GenreBrief]
    created_at: datetime

    model_config = {"from_attributes": True}
