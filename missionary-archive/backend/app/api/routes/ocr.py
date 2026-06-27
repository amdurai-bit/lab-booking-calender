import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.ocr_job import OCRJob
from app.models.document import Document, DocumentImage
from app.schemas.transcription import OCRStartRequest, OCRJobOut
from app.services.ocr.factory import list_available_engines
from app.worker.tasks import run_ocr_job

router = APIRouter(prefix="/ocr", tags=["ocr"])


@router.get("/engines")
async def get_engines():
    return list_available_engines()


@router.post("/start/{doc_id}", response_model=list[OCRJobOut])
async def start_ocr(
    doc_id: uuid.UUID,
    req: OCRStartRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    doc_result = await db.execute(
        select(Document).where(Document.id == doc_id).options(selectinload(Document.images))
    )
    doc = doc_result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Document not found")

    images = doc.images
    if req.image_ids:
        images = [img for img in images if img.id in req.image_ids]

    if not images:
        raise HTTPException(400, "No images to process")

    jobs = []
    for image in images:
        job = OCRJob(
            document_id=doc_id,
            image_id=image.id,
            engine=req.engine,
            language=req.language,
            options=req.options,
            status="queued",
            submitted_by=user.id,
        )
        db.add(job)
        jobs.append(job)

    doc.ocr_status = "processing"
    await db.commit()

    for job in jobs:
        await db.refresh(job)
        run_ocr_job.delay(str(job.id))

    return jobs


@router.get("/status/{job_id}", response_model=OCRJobOut)
async def get_job_status(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OCRJob).where(OCRJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.get("/jobs/{doc_id}", response_model=list[OCRJobOut])
async def get_document_jobs(doc_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(OCRJob).where(OCRJob.document_id == doc_id).order_by(OCRJob.queued_at.desc())
    )
    return result.scalars().all()
