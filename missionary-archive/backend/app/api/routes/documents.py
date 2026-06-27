import uuid
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.document import Document, DocumentImage
from app.models.missionary import Missionary
from app.models.genre import Genre
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentOut, DocumentListItem
from app.services.storage import save_upload, generate_reference_number, slugify

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_MIME = {
    "image/jpeg", "image/png", "image/tiff", "application/pdf"
}


def _make_slug(text: str) -> str:
    return re.sub(r"[-\s]+", "-", re.sub(r"[^\w\s-]", "", text.lower())).strip("-")


@router.get("", response_model=list[DocumentListItem])
async def list_documents(
    missionary_id: Optional[uuid.UUID] = Query(None),
    year: Optional[int] = Query(None),
    genre_id: Optional[uuid.UUID] = Query(None),
    ocr_status: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    q = select(Document).options(
        selectinload(Document.missionary),
        selectinload(Document.genre),
    )
    if missionary_id:
        q = q.where(Document.missionary_id == missionary_id)
    if year:
        q = q.where(Document.year == year)
    if genre_id:
        q = q.where(Document.genre_id == genre_id)
    if ocr_status:
        q = q.where(Document.ocr_status == ocr_status)
    if language:
        q = q.where(Document.language == language)
    q = q.order_by(Document.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=DocumentOut, status_code=201)
async def create_document(
    data: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    # Get missionary and genre for naming
    m_result = await db.execute(select(Missionary).where(Missionary.id == data.missionary_id))
    missionary = m_result.scalar_one_or_none()
    if not missionary:
        raise HTTPException(404, "Missionary not found")

    genre_name = "Document"
    if data.genre_id:
        g_result = await db.execute(select(Genre).where(Genre.id == data.genre_id))
        genre = g_result.scalar_one_or_none()
        if genre:
            genre_name = genre.name

    # Count existing docs for this missionary/year/genre to auto-number
    count_q = select(func.count(Document.id)).where(
        Document.missionary_id == data.missionary_id,
        Document.year == data.year,
    )
    if data.genre_id:
        count_q = count_q.where(Document.genre_id == data.genre_id)
    count_result = await db.execute(count_q)
    doc_num = (count_result.scalar() or 0) + 1

    ref = generate_reference_number(missionary.name, data.year, genre_name, doc_num)
    slug = _make_slug(ref)

    doc = Document(
        **data.model_dump(),
        reference_number=ref,
        slug=slug,
        document_number=doc_num,
        uploaded_by=user.id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Re-fetch with relationships
    result = await db.execute(
        select(Document).where(Document.id == doc.id).options(
            selectinload(Document.missionary),
            selectinload(Document.genre),
            selectinload(Document.images),
        )
    )
    return result.scalar_one()


@router.get("/{doc_id}", response_model=DocumentOut)
async def get_document(doc_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document).where(Document.id == doc_id).options(
            selectinload(Document.missionary),
            selectinload(Document.genre),
            selectinload(Document.images),
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Document not found")
    return doc


@router.put("/{doc_id}", response_model=DocumentOut)
async def update_document(
    doc_id: uuid.UUID,
    data: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(doc, k, v)
    await db.commit()

    result = await db.execute(
        select(Document).where(Document.id == doc_id).options(
            selectinload(Document.missionary),
            selectinload(Document.genre),
            selectinload(Document.images),
        )
    )
    return result.scalar_one()


@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Not found")
    await db.delete(doc)
    await db.commit()


@router.post("/{doc_id}/images", response_model=DocumentOut, status_code=201)
async def upload_images(
    doc_id: uuid.UUID,
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(
        select(Document).where(Document.id == doc_id).options(
            selectinload(Document.missionary),
            selectinload(Document.genre),
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Document not found")

    missionary_name = doc.missionary.name if doc.missionary else "unknown"
    genre_name = doc.genre.name if doc.genre else "document"

    # Current page count
    existing_count_result = await db.execute(
        select(func.count(DocumentImage.id)).where(DocumentImage.document_id == doc_id)
    )
    page_offset = existing_count_result.scalar() or 0

    for i, file in enumerate(files):
        content = await file.read()
        if len(content) > 100 * 1024 * 1024:
            raise HTTPException(413, f"File {file.filename} exceeds 100MB limit")

        info = await save_upload(content, file.filename, missionary_name, doc.year, genre_name)
        mime = file.content_type or "application/octet-stream"

        img = DocumentImage(
            document_id=doc_id,
            page_number=page_offset + i + 1,
            original_filename=info["original_filename"],
            stored_filename=info["stored_filename"],
            file_path=info["file_path"],
            thumbnail_path=info.get("thumbnail_path"),
            file_size=info["file_size"],
            mime_type=mime,
            width=info.get("width"),
            height=info.get("height"),
            dpi=info.get("dpi"),
        )
        db.add(img)

    doc.page_count = page_offset + len(files)
    doc.ocr_status = "pending"
    await db.commit()

    result = await db.execute(
        select(Document).where(Document.id == doc_id).options(
            selectinload(Document.missionary),
            selectinload(Document.genre),
            selectinload(Document.images),
        )
    )
    return result.scalar_one()
