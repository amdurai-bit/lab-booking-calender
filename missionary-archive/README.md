# Missionary Archive — Transcription Platform

A production-ready web application for digitising and transcribing 19th-century missionary letters, optimised for manuscripts from Robert Caldwell, Samuel Mateer, and missionaries working in Travancore, Tirunelveli, the Madras Presidency, and Ceylon.

## Features

- **Upload & Organise** — Hierarchical archive: Missionary → Year → Genre → Documents
- **OCR/HTR** — Pluggable engine support: Tesseract (with Tamil/Malayalam) and EasyOCR
- **Side-by-side Editor** — Original image with zoom/pan/rotate/contrast alongside editable transcription
- **Line-level Linking** — Click a transcription line to highlight its region on the image
- **Version Control** — Every save creates a numbered version with diff history
- **Full-text Search** — Across transcriptions, metadata, keywords, notes
- **Export** — TXT, JSON, TEI-XML, DOCX
- **Dashboard** — OCR success rates, recently added documents
- **Multi-language** — English, Tamil, Malayalam, Mixed content

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React, TypeScript, TailwindCSS |
| Backend | Python FastAPI |
| Database | PostgreSQL 16 |
| Queue | Redis + Celery |
| OCR | Tesseract + EasyOCR |
| Auth | JWT (Bearer tokens) |
| Storage | Local filesystem (S3-ready) |
| Containers | Docker + Docker Compose |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Setup

```bash
# Clone and enter the project
cd missionary-archive

# Copy environment config
cp .env.example .env

# Start all services
docker compose up -d

# Wait ~30s for database to initialise, then seed default data
curl -X POST http://localhost:3000/api/v1/genres/seed \
  -H "Authorization: Bearer <your_token>"
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **API docs**: http://localhost:8000/api/docs

### First-time setup

1. Open http://localhost:3000 and click **Sign In**
2. Click **Register** to create your first account
3. Go to **Missionaries** and add or seed sample missionaries (Robert Caldwell, Samuel Mateer, etc.)
4. Go to **Upload** to add your first scanned letter
5. On the document page, select an OCR engine and click **▶ Run OCR**
6. Edit the transcription and press **Ctrl+S** to save

## Development (without Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql+asyncpg://archiver:archiver_secret@localhost:5432/missionary_archive"
export REDIS_URL="redis://localhost:6379/0"
export SECRET_KEY="dev_secret_change_me"
export STORAGE_PATH="./storage"

uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

## Folder Structure

```
missionary-archive/
├── backend/
│   ├── app/
│   │   ├── api/routes/         # FastAPI route handlers
│   │   ├── core/               # Config, database, security
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── ocr/            # Pluggable OCR engines
│   │   │   └── storage.py      # File storage service
│   │   └── worker/             # Celery async tasks
│   ├── alembic/                # Database migrations
│   └── tests/
├── frontend/
│   └── src/
│       ├── app/                # Next.js app router pages
│       ├── components/
│       │   ├── editor/         # Image viewer + transcription editor
│       │   └── layout/         # Sidebar, navigation
│       ├── lib/                # API client, auth store, utilities
│       └── types/              # TypeScript interfaces
└── storage/                    # Uploaded files (gitignored)
```

## Archive Folder Convention

Files are stored as:
```
storage/uploads/
└── samuel_mateer/
    └── 1874/
        └── personal_letter/
            └── <uuid>.jpg
```

Reference numbers follow:
```
SamuelMateer_1874_PersonalLetter_001
```

Associated files:
```
SamuelMateer_1874_PersonalLetter_001.jpg
SamuelMateer_1874_PersonalLetter_001.txt
SamuelMateer_1874_PersonalLetter_001.json
SamuelMateer_1874_PersonalLetter_001.tei.xml
```

## OCR Engine Priority

1. **Tesseract** — Best support for English + Tamil (`eng+tam`). Includes adaptive thresholding pre-processing for faded manuscripts.
2. **EasyOCR** — Good for degraded images; supports English, Tamil, Malayalam.

Engines are selected per OCR job via the UI dropdown. The pluggable architecture allows adding Kraken or Transkribus later by implementing `OCREngine`.

## API Reference

Full OpenAPI documentation: http://localhost:8000/api/docs

Key endpoints:
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Get JWT token |
| GET | `/api/v1/documents` | List documents |
| POST | `/api/v1/documents` | Create document |
| POST | `/api/v1/documents/{id}/images` | Upload images |
| POST | `/api/v1/ocr/start/{id}` | Queue OCR job |
| GET | `/api/v1/ocr/status/{job_id}` | Check job status |
| PUT | `/api/v1/transcriptions/{id}` | Save transcription |
| GET | `/api/v1/search` | Full-text search |
| GET | `/api/v1/export/{id}/tei` | Export as TEI-XML |

## Metadata Fields

Each document stores:
- Missionary Name, Year, Month, Genre, Location, Language
- Archive Reference Number (auto-generated)
- Keywords, Notes, Physical Condition
- OCR Engine used, Confidence score
- Transcriber, Date Uploaded/Modified

## Future Extensions (Architecture Hooks)

The codebase is structured to support:
- **Historical spelling normalisation** — hook into `TranscriptionEditor` post-save
- **Named Entity Recognition** — add a `/ner/{doc_id}` endpoint
- **Automatic summary generation** — Claude API integration
- **Missionary network visualisation** — D3.js graph from metadata
- **S3 storage** — swap `services/storage.py` implementation
- **Kraken HTR** — add `KrakenEngine` implementing `OCREngine` base class
- **TEI scholarly editions** — extend the TEI export with critical apparatus

## Licence

MIT
