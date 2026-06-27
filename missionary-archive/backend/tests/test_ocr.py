"""Unit tests for OCR engine layer (no database required)."""
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
from app.services.ocr.base import OCRResult, LineResult, BoundingBox
from app.services.ocr.factory import get_ocr_engine, list_available_engines, AVAILABLE_ENGINES
from app.services.storage import generate_reference_number, slugify


def test_generate_reference_number():
    ref = generate_reference_number("Samuel Mateer", 1874, "Personal Letter", 1)
    assert "1874" in ref
    assert "001" in ref


def test_slugify():
    assert slugify("Samuel Mateer") == "samuel_mateer"
    assert slugify("Personal Letters") == "personal_letters"


def test_ocr_result_to_line_data():
    result = OCRResult(
        full_text="Line one\nLine two",
        lines=[
            LineResult(line_number=1, text="Line one", confidence=0.95, bbox=BoundingBox(10, 20, 100, 40)),
            LineResult(line_number=2, text="Line two", confidence=0.88),
        ],
        confidence=0.915,
        engine="tesseract",
    )
    line_data = result.to_line_data()
    assert len(line_data) == 2
    assert line_data[0]["text"] == "Line one"
    assert line_data[0]["confidence"] == 0.95
    assert line_data[0]["bbox"] == [10, 20, 100, 40]
    assert "bbox" not in line_data[1]


def test_list_available_engines():
    engines = list_available_engines()
    assert len(engines) >= 1
    assert all("id" in e for e in engines)
    assert all("name" in e for e in engines)


def test_get_ocr_engine_invalid():
    with pytest.raises(ValueError, match="Unknown OCR engine"):
        get_ocr_engine("nonexistent_engine")


def test_tesseract_engine_import():
    from app.services.ocr.tesseract_engine import TesseractEngine
    engine = TesseractEngine()
    assert engine.name == "tesseract"
    assert engine.supports_bboxes is True


def test_easyocr_engine_import():
    from app.services.ocr.easyocr_engine import EasyOCREngine
    engine = EasyOCREngine()
    assert engine.name == "easyocr"
    assert engine.supports_bboxes is True
