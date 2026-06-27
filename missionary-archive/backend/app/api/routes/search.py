import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, text
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.document import Document
from app.models.transcription import Transcription
from app.schemas.document import DocumentListItem

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=dict)
async def search(
    q: Optional[str] = Query(None, description="Full-text search query"),
    missionary_id: Optional[uuid.UUID] = Query(None),
    year_from: Optional[int] = Query(None),
    year_to: Optional[int] = Query(None),
    genre_id: Optional[uuid.UUID] = Query(None),
    language: Optional[str] = Query(None),
    ocr_status: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    base_q = (
        select(Document)
        .options(selectinload(Document.missionary), selectinload(Document.genre))
    )

    if missionary_id:
        base_q = base_q.where(Document.missionary_id == missionary_id)
    if year_from:
        base_q = base_q.where(Document.year >= year_from)
    if year_to:
        base_q = base_q.where(Document.year <= year_to)
    if genre_id:
        base_q = base_q.where(Document.genre_id == genre_id)
    if language:
        base_q = base_q.where(Document.language == language)
    if ocr_status:
        base_q = base_q.where(Document.ocr_status == ocr_status)

    if q:
        # Full-text search across transcriptions + document metadata
        search_term = q.strip()
        # Use pg_trgm similarity for fuzzy matching of historical spelling
        transcription_subq = (
            select(Transcription.document_id)
            .where(
                or_(
                    func.lower(Transcription.raw_text).contains(search_term.lower()),
                    func.lower(Transcription.corrected_text).contains(search_term.lower()),
                )
            )
            .scalar_subquery()
        )
        base_q = base_q.where(
            or_(
                func.lower(Document.title).contains(search_term.lower()),
                func.lower(Document.description).contains(search_term.lower()),
                func.lower(Document.notes).contains(search_term.lower()),
                Document.id.in_(transcription_subq),
            )
        )

    count_q = select(func.count()).select_from(base_q.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar()

    paged_q = base_q.order_by(Document.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(paged_q)
    docs = result.scalars().all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "results": [DocumentListItem.model_validate(d) for d in docs],
    }


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    total_docs = await db.execute(select(func.count(Document.id)))
    ocr_pending = await db.execute(select(func.count(Document.id)).where(Document.ocr_status == "pending"))
    ocr_completed = await db.execute(select(func.count(Document.id)).where(Document.ocr_status == "completed"))
    ocr_failed = await db.execute(select(func.count(Document.id)).where(Document.ocr_status == "failed"))
    total_transcriptions = await db.execute(select(func.count(Transcription.id)).where(Transcription.is_current == True))

    total = total_docs.scalar() or 0
    completed = ocr_completed.scalar() or 0

    return {
        "total_documents": total,
        "ocr_pending": ocr_pending.scalar() or 0,
        "ocr_completed": completed,
        "ocr_failed": ocr_failed.scalar() or 0,
        "total_transcriptions": total_transcriptions.scalar() or 0,
        "ocr_success_rate": round((completed / total * 100) if total > 0 else 0, 1),
    }
