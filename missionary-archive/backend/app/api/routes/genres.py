import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.genre import Genre

router = APIRouter(prefix="/genres", tags=["genres"])


class GenreCreate(BaseModel):
    name: str
    description: Optional[str] = None


def slugify(text: str) -> str:
    return re.sub(r"[-\s]+", "-", re.sub(r"[^\w\s-]", "", text.lower())).strip("-")


DEFAULT_GENRES = [
    "Personal Letter", "Mission Report", "Diary", "Travel Notes",
    "Church Correspondence", "Administrative Report", "Sermon Notes",
    "Census Record", "Map", "Photograph",
]


@router.get("")
async def list_genres(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Genre).order_by(Genre.name))
    return result.scalars().all()


@router.post("", status_code=201)
async def create_genre(data: GenreCreate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    slug = slugify(data.name)
    existing = await db.execute(select(Genre).where(Genre.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Genre already exists")
    genre = Genre(name=data.name, slug=slug, description=data.description)
    db.add(genre)
    await db.commit()
    await db.refresh(genre)
    return genre


@router.post("/seed", status_code=201)
async def seed_genres(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    """Populate default genres for the first-time setup."""
    created = []
    for name in DEFAULT_GENRES:
        slug = slugify(name)
        existing = await db.execute(select(Genre).where(Genre.slug == slug))
        if not existing.scalar_one_or_none():
            genre = Genre(name=name, slug=slug)
            db.add(genre)
            created.append(name)
    await db.commit()
    return {"created": created}
