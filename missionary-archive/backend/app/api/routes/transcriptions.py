import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.transcription import Transcription, TranscriptionVersion
from app.schemas.transcription import TranscriptionOut, TranscriptionUpdate, TranscriptionVersionOut

router = APIRouter(prefix="/transcriptions", tags=["transcriptions"])


@router.get("/document/{doc_id}", response_model=list[TranscriptionOut])
async def get_document_transcriptions(doc_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Transcription).where(
            Transcription.document_id == doc_id,
            Transcription.is_current == True,
        ).options(selectinload(Transcription.versions))
        .order_by(Transcription.created_at)
    )
    return result.scalars().all()


@router.get("/{transcription_id}", response_model=TranscriptionOut)
async def get_transcription(transcription_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Transcription).where(Transcription.id == transcription_id)
        .options(selectinload(Transcription.versions))
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Not found")
    return t


@router.put("/{transcription_id}", response_model=TranscriptionOut)
async def update_transcription(
    transcription_id: uuid.UUID,
    data: TranscriptionUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(
        select(Transcription).where(Transcription.id == transcription_id)
        .options(selectinload(Transcription.versions))
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Not found")

    # Save version snapshot before update
    version = TranscriptionVersion(
        transcription_id=t.id,
        version_number=t.version,
        text_snapshot=t.corrected_text or t.raw_text,
        line_data_snapshot=t.line_data or [],
        change_summary=data.change_summary or f"Manual edit (version {t.version})",
        saved_by=user.id,
        saved_at=datetime.now(timezone.utc),
    )
    db.add(version)

    t.corrected_text = data.corrected_text
    if data.line_data is not None:
        t.line_data = data.line_data
    t.version += 1
    t.transcriber_id = user.id
    t.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(t)

    result = await db.execute(
        select(Transcription).where(Transcription.id == transcription_id)
        .options(selectinload(Transcription.versions))
    )
    return result.scalar_one()


@router.get("/{transcription_id}/versions", response_model=list[TranscriptionVersionOut])
async def get_versions(transcription_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TranscriptionVersion).where(
            TranscriptionVersion.transcription_id == transcription_id
        ).order_by(TranscriptionVersion.version_number.desc())
    )
    return result.scalars().all()


@router.get("/{transcription_id}/versions/{version_num}", response_model=TranscriptionVersionOut)
async def get_version(
    transcription_id: uuid.UUID,
    version_num: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TranscriptionVersion).where(
            TranscriptionVersion.transcription_id == transcription_id,
            TranscriptionVersion.version_number == version_num,
        )
    )
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Version not found")
    return v
