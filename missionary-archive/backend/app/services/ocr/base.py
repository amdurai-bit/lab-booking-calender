from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional
from pathlib import Path


@dataclass
class BoundingBox:
    x1: int
    y1: int
    x2: int
    y2: int
    page: int = 1


@dataclass
class LineResult:
    line_number: int
    text: str
    confidence: float
    bbox: Optional[BoundingBox] = None


@dataclass
class OCRResult:
    full_text: str
    lines: List[LineResult] = field(default_factory=list)
    confidence: float = 0.0
    engine: str = ""
    language: str = "eng"
    page_count: int = 1
    metadata: dict = field(default_factory=dict)

    def to_line_data(self) -> list:
        """Serialise to JSON-compatible list for storage."""
        result = []
        for line in self.lines:
            entry = {
                "line": line.line_number,
                "text": line.text,
                "confidence": line.confidence,
            }
            if line.bbox:
                entry["bbox"] = [line.bbox.x1, line.bbox.y1, line.bbox.x2, line.bbox.y2]
                entry["page"] = line.bbox.page
            result.append(entry)
        return result


class OCREngine(ABC):
    name: str = "base"
    display_name: str = "Base OCR"
    supports_bboxes: bool = False
    supports_multi_language: bool = False

    @abstractmethod
    async def process_image(self, image_path: Path, language: str = "eng", options: dict = None) -> OCRResult:
        """Process a single image file and return OCR result."""
        ...

    async def process_pdf(self, pdf_path: Path, language: str = "eng", options: dict = None) -> List[OCRResult]:
        """Process a multi-page PDF; default converts to images first."""
        from pdf2image import convert_from_path
        import tempfile, os
        results = []
        with tempfile.TemporaryDirectory() as tmpdir:
            images = convert_from_path(str(pdf_path), dpi=300, output_folder=tmpdir)
            for i, img in enumerate(images):
                img_path = Path(tmpdir) / f"page_{i+1}.png"
                img.save(str(img_path), "PNG")
                result = await self.process_image(img_path, language, options)
                result.page_count = len(images)
                results.append(result)
        return results

    def is_available(self) -> bool:
        return True
