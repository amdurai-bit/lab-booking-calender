from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "missionary_archive",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    task_track_started=True,
    task_routes={
        "app.worker.tasks.run_ocr_job": {"queue": "ocr"},
        "app.worker.tasks.export_document": {"queue": "export"},
    },
)
