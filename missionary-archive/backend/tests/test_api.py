"""
Integration tests for the Missionary Archive API.
Run with: pytest tests/ -v
Requires a running PostgreSQL + Redis (use docker compose up db redis).
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.core.database import get_db, Base
from app.core.config import settings

TEST_DB_URL = settings.DATABASE_URL.replace("missionary_archive", "missionary_test")

test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSession = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async def override_get_db():
        async with TestSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_register_and_login(client):
    # Register
    resp = await client.post("/api/v1/auth/register", json={
        "email": "test@archive.org",
        "username": "testuser",
        "password": "TestPass123!",
        "full_name": "Test User",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "test@archive.org"

    # Login
    resp = await client.post("/api/v1/auth/login", json={
        "email": "test@archive.org",
        "password": "TestPass123!",
    })
    assert resp.status_code == 200
    token_data = resp.json()
    assert "access_token" in token_data
    return token_data["access_token"]


@pytest.mark.asyncio
async def test_missionary_crud(client):
    # Get token
    await client.post("/api/v1/auth/register", json={
        "email": "admin@test.com", "username": "admin", "password": "pass123"
    })
    login = await client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "pass123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create missionary
    resp = await client.post("/api/v1/missionaries", json={
        "name": "Samuel Mateer",
        "nationality": "British",
        "mission_society": "London Missionary Society",
        "region": "Travancore",
        "birth_year": 1835,
        "death_year": 1893,
    }, headers=headers)
    assert resp.status_code == 201
    m = resp.json()
    assert m["name"] == "Samuel Mateer"
    assert m["slug"] == "samuel-mateer"

    # List missionaries
    resp = await client.get("/api/v1/missionaries")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


@pytest.mark.asyncio
async def test_genre_seed(client):
    await client.post("/api/v1/auth/register", json={"email": "g@test.com", "username": "guser", "password": "pass123"})
    login = await client.post("/api/v1/auth/login", json={"email": "g@test.com", "password": "pass123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post("/api/v1/genres/seed", headers=headers)
    assert resp.status_code == 201
    genres = resp.json()["created"]
    assert "Personal Letter" in genres


@pytest.mark.asyncio
async def test_document_create(client):
    await client.post("/api/v1/auth/register", json={"email": "d@test.com", "username": "duser", "password": "pass123"})
    login = await client.post("/api/v1/auth/login", json={"email": "d@test.com", "password": "pass123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Seed genres
    await client.post("/api/v1/genres/seed", headers=headers)
    genres = (await client.get("/api/v1/genres")).json()
    genre_id = genres[0]["id"]

    # Create missionary
    m_resp = await client.post("/api/v1/missionaries", json={"name": "Robert Caldwell"}, headers=headers)
    missionary_id = m_resp.json()["id"]

    # Create document
    resp = await client.post("/api/v1/documents", json={
        "missionary_id": missionary_id,
        "year": 1857,
        "genre_id": genre_id,
        "language": "English",
        "keywords": ["Tirunelveli", "Tamil"],
    }, headers=headers)
    assert resp.status_code == 201
    doc = resp.json()
    assert "RobertCaldwell" in doc["reference_number"]
    assert doc["year"] == 1857


@pytest.mark.asyncio
async def test_search(client):
    resp = await client.get("/api/v1/search")
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "results" in data


@pytest.mark.asyncio
async def test_stats(client):
    resp = await client.get("/api/v1/search/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_documents" in data
    assert "ocr_success_rate" in data


@pytest.mark.asyncio
async def test_ocr_engines(client):
    resp = await client.get("/api/v1/ocr/engines")
    assert resp.status_code == 200
    engines = resp.json()
    assert any(e["id"] == "tesseract" for e in engines)
