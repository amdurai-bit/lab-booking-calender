import os
import re
import shutil
import uuid
from pathlib import Path
from typing import Optional
import aiofiles
from PIL import Image
from app.core.config import settings


def slugify(text: str) -> str:
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[-\s]+", "_", text).strip("_")


def generate_reference_number(missionary_name: str, year: int, genre: str, doc_num: int) -> str:
    m = slugify(missionary_name).replace("_", "")[:15]
    g = slugify(genre).replace("_", "")[:12]
    return f"{m}_{year}_{g}_{doc_num:03d}"


def build_storage_path(missionary_name: str, year: int, genre: str) -> Path:
    base = Path(settings.STORAGE_PATH) / "uploads"
    return base / slugify(missionary_name) / str(year) / slugify(genre)


async def save_upload(file_content: bytes, filename: str, missionary_name: str, year: int, genre: str) -> dict:
    dest_dir = build_storage_path(missionary_name, year, genre)
    dest_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = dest_dir / unique_name

    async with aiofiles.open(dest_path, "wb") as f:
        await f.write(file_content)

    # Generate thumbnail for images
    thumbnail_path = None
    width = height = dpi = None
    if ext in (".jpg", ".jpeg", ".png", ".tiff", ".tif"):
        try:
            with Image.open(dest_path) as img:
                width, height = img.size
                info = img.info
                dpi_info = info.get("dpi") or info.get("jfif_density")
                dpi = int(dpi_info[0]) if dpi_info else None

                thumb = img.copy()
                thumb.thumbnail((400, 400))
                thumb_dir = Path(settings.STORAGE_PATH) / "thumbnails"
                thumb_dir.mkdir(parents=True, exist_ok=True)
                thumb_path = thumb_dir / f"thumb_{unique_name.replace(ext, '.jpg')}"
                thumb.convert("RGB").save(str(thumb_path), "JPEG", quality=75)
                thumbnail_path = str(thumb_path)
        except Exception:
            pass

    return {
        "original_filename": filename,
        "stored_filename": unique_name,
        "file_path": str(dest_path),
        "thumbnail_path": thumbnail_path,
        "file_size": len(file_content),
        "width": width,
        "height": height,
        "dpi": dpi,
    }


def get_file_url(file_path: str) -> str:
    """Convert storage path to API-accessible URL."""
    rel = os.path.relpath(file_path, settings.STORAGE_PATH)
    return f"/storage/{rel.replace(os.sep, '/')}"


def delete_file(file_path: str) -> bool:
    path = Path(file_path)
    if path.exists():
        path.unlink()
        return True
    return False
