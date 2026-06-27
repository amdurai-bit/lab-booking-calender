from app.services.ocr.tesseract_engine import TesseractEngine
from app.services.ocr.easyocr_engine import EasyOCREngine
from app.services.ocr.base import OCREngine

AVAILABLE_ENGINES: dict[str, type[OCREngine]] = {
    "tesseract": TesseractEngine,
    "easyocr": EasyOCREngine,
}

_instances: dict[str, OCREngine] = {}


def get_ocr_engine(name: str) -> OCREngine:
    name = name.lower()
    if name not in AVAILABLE_ENGINES:
        raise ValueError(f"Unknown OCR engine: {name}. Available: {list(AVAILABLE_ENGINES.keys())}")
    if name not in _instances:
        _instances[name] = AVAILABLE_ENGINES[name]()
    return _instances[name]


def list_available_engines() -> list[dict]:
    results = []
    for key, cls in AVAILABLE_ENGINES.items():
        try:
            engine = get_ocr_engine(key)
            available = engine.is_available()
        except Exception:
            available = False
        results.append({
            "id": key,
            "name": cls.display_name if hasattr(cls, "display_name") else key,
            "available": available,
            "supports_bboxes": getattr(cls, "supports_bboxes", False),
            "supports_multi_language": getattr(cls, "supports_multi_language", False),
        })
    return results
