import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class MissionaryCreate(BaseModel):
    name: str
    birth_year: Optional[int] = None
    death_year: Optional[int] = None
    nationality: Optional[str] = None
    denomination: Optional[str] = None
    mission_society: Optional[str] = None
    region: Optional[str] = None
    biography: Optional[str] = None
    notes: Optional[str] = None


class MissionaryUpdate(MissionaryCreate):
    name: Optional[str] = None


class MissionaryOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    birth_year: Optional[int]
    death_year: Optional[int]
    nationality: Optional[str]
    denomination: Optional[str]
    mission_society: Optional[str]
    region: Optional[str]
    biography: Optional[str]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
