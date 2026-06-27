import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.missionary import Missionary
from app.schemas.missionary import MissionaryCreate, MissionaryUpdate, MissionaryOut

router = APIRouter(prefix="/missionaries", tags=["missionaries"])


def make_slug(name: str) -> str:
    return re.sub(r"[-\s]+", "-", re.sub(r"[^\w\s-]", "", name.lower())).strip("-")


@router.get("", response_model=list[MissionaryOut])
async def list_missionaries(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Missionary).order_by(Missionary.name))
    return result.scalars().all()


@router.post("", response_model=MissionaryOut, status_code=201)
async def create_missionary(
    data: MissionaryCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    slug = make_slug(data.name)
    existing = await db.execute(select(Missionary).where(Missionary.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Missionary already exists")
    m = Missionary(**data.model_dump(), slug=slug)
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return m


@router.get("/{missionary_id}", response_model=MissionaryOut)
async def get_missionary(missionary_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Missionary).where(Missionary.id == missionary_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Not found")
    return m


@router.put("/{missionary_id}", response_model=MissionaryOut)
async def update_missionary(
    missionary_id: str,
    data: MissionaryUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(select(Missionary).where(Missionary.id == missionary_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(m, k, v)
    await db.commit()
    await db.refresh(m)
    return m
