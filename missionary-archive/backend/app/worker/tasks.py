import asyncio
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

from celery import current_task
from sqlalchemy import select, update

from app.worker.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.models.ocr_job import OCRJob
from app.models.transcription import Transcription, TranscriptionVersion
from app.models.document import Document, DocumentImage
from app.services.ocr.factory import get_ocr_engine


def run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, name="app.worker.tasks.run_ocr_job", max_retries=2)
def run_ocr_job(self, job_id: str):
    return run_async(_run_ocr_job_async(job_id, self))


async def _run_ocr_job_async(job_id: str, task):
    async with AsyncSessionLocal() as db:
        # Load job
        result = await db.execute(select(OCRJob).where(OCRJob.id == uuid.UUID(job_id)))
        job = result.scalar_one_or_none()
        if not job:
            return {"error": "Job not found"}

        # Mark as processing
        job.status = "processing"
        job.started_at = datetime.now(timezone.utc)
        job.celery_task_id = task.request.id
        await db.commit()

        try:
            # Get image path
            result = await db.execute(select(DocumentImage).where(DocumentImage.id == job.image_id))
            image = result.scalar_one_or_none()
            if not image:
                raise ValueError("Image not found")

            image_path = Path(image.file_path)
            engine = get_ocr_engine(job.engine)

            start_ms = int(time.time() * 1000)
            ocr_result = await engine.process_image(image_path, language=job.language, options=job.options)
            elapsed_ms = int(time.time() * 1000) - start_ms

            # Upsert transcription
            tr_result = await db.execute(
                select(Transcription).where(
                    Transcription.document_id == job.document_id,
                    Transcription.image_id == job.image_id,
                    Transcription.is_current == True,
                )
            )
            transcription = tr_result.scalar_one_or_none()

            if transcription:
                # Save old version
                old_version = TranscriptionVersion(
                    transcription_id=transcription.id,
                    version_number=transcription.version,
                    text_snapshot=transcription.raw_text,
                    line_data_snapshot=transcription.line_data or [],
                    change_summary="OCR re-run",
                )
                db.add(old_version)
                transcription.raw_text = ocr_result.full_text
                transcription.line_data = ocr_result.to_line_data()
                transcription.ocr_engine = job.engine
                transcription.ocr_confidence = ocr_result.confidence
                transcription.version += 1
            else:
                transcription = Transcription(
                    document_id=job.document_id,
                    image_id=job.image_id,
                    raw_text=ocr_result.full_text,
                    corrected_text=None,
                    line_data=ocr_result.to_line_data(),
                    ocr_engine=job.engine,
                    ocr_confidence=ocr_result.confidence,
                    ocr_language=job.language,
                    version=1,
                    is_current=True,
                )
                db.add(transcription)

            # Update job status
            job.status = "completed"
            job.result_text = ocr_result.full_text
            job.confidence = ocr_result.confidence
            job.processing_time_ms = elapsed_ms
            job.completed_at = datetime.now(timezone.utc)
            job.progress = 100

            # Update document ocr_status
            await db.execute(
                update(Document).where(Document.id == job.document_id).values(ocr_status="completed")
            )

            await db.commit()
            return {"status": "completed", "confidence": ocr_result.confidence}

        except Exception as exc:
            job.status = "failed"
            job.error_message = str(exc)
            job.completed_at = datetime.now(timezone.utc)
            await db.execute(
                update(Document).where(Document.id == job.document_id).values(ocr_status="failed")
            )
            await db.commit()
            raise self.retry(exc=exc, countdown=30)
