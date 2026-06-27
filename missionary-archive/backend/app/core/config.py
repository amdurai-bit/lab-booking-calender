from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Missionary Archive"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "postgresql+asyncpg://archiver:archiver_secret@localhost:5432/missionary_archive"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "change_me_in_production_32chars_min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    STORAGE_PATH: str = "./storage"
    MAX_UPLOAD_SIZE_MB: int = 100
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "tiff", "tif", "pdf"]

    CORS_ORIGINS: str = "http://localhost:3000"

    DEFAULT_OCR_ENGINE: str = "tesseract"
    TESSERACT_CMD: str = "tesseract"

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


settings = Settings()
