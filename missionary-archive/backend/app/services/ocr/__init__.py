from app.services.ocr.base import OCREngine, OCRResult, BoundingBox
from app.services.ocr.tesseract_engine import TesseractEngine
from app.services.ocr.easyocr_engine import EasyOCREngine
from app.services.ocr.factory import get_ocr_engine, AVAILABLE_ENGINES

__all__ = ["OCREngine", "OCRResult", "BoundingBox", "TesseractEngine", "EasyOCREngine", "get_ocr_engine", "AVAILABLE_ENGINES"]
