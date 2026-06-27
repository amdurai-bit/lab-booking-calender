from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import auth, missionaries, documents, ocr, transcriptions, search, export, genres

import app.models  # noqa: ensure models registered


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (development convenience; use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Ensure storage directories exist
    Path(settings.STORAGE_PATH).mkdir(parents=True, exist_ok=True)
    (Path(settings.STORAGE_PATH) / "uploads").mkdir(exist_ok=True)
    (Path(settings.STORAGE_PATH) / "thumbnails").mkdir(exist_ok=True)

    yield


app = FastAPI(
    title="Missionary Archive API",
    description="Historical Missionary Letter Transcription Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
storage_path = Path(settings.STORAGE_PATH)
storage_path.mkdir(parents=True, exist_ok=True)
app.mount("/storage", StaticFiles(directory=str(storage_path)), name="storage")

# API routers
PREFIX = "/api/v1"
app.include_router(auth.router, prefix=PREFIX)
app.include_router(missionaries.router, prefix=PREFIX)
app.include_router(documents.router, prefix=PREFIX)
app.include_router(ocr.router, prefix=PREFIX)
app.include_router(transcriptions.router, prefix=PREFIX)
app.include_router(search.router, prefix=PREFIX)
app.include_router(export.router, prefix=PREFIX)
app.include_router(genres.router, prefix=PREFIX)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": settings.VERSION}
