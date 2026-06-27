import asyncio
from pathlib import Path
from typing import List
from app.services.ocr.base import OCREngine, OCRResult, LineResult, BoundingBox

LANG_MAP = {
    "English": ["en"],
    "Tamil": ["ta"],
    "Malayalam": ["ml"],
    "Mixed": ["en", "ta"],
    "eng": ["en"],
    "tam": ["ta"],
    "mal": ["ml"],
}


class EasyOCREngine(OCREngine):
    name = "easyocr"
    display_name = "EasyOCR"
    supports_bboxes = True
    supports_multi_language = True

    def __init__(self):
        self._reader_cache: dict = {}

    def _get_reader(self, langs: List[str]):
        key = tuple(sorted(langs))
        if key not in self._reader_cache:
            import easyocr
            self._reader_cache[key] = easyocr.Reader(list(langs), gpu=False)
        return self._reader_cache[key]

    async def process_image(self, image_path: Path, language: str = "eng", options: dict = None) -> OCRResult:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._run_easyocr, image_path, language, options or {})

    def _run_easyocr(self, image_path: Path, language: str, options: dict) -> OCRResult:
        langs = LANG_MAP.get(language, ["en"])
        reader = self._get_reader(langs)
        results = reader.readtext(str(image_path), detail=1)

        lines = []
        full_parts = []
        for idx, (bbox_pts, text, conf) in enumerate(results):
            text = text.strip()
            if not text:
                continue
            full_parts.append(text)
            xs = [p[0] for p in bbox_pts]
            ys = [p[1] for p in bbox_pts]
            bbox = BoundingBox(x1=int(min(xs)), y1=int(min(ys)), x2=int(max(xs)), y2=int(max(ys)))
            lines.append(LineResult(line_number=idx + 1, text=text, confidence=float(conf), bbox=bbox))

        full_text = "\n".join(full_parts)
        avg_conf = sum(l.confidence for l in lines) / len(lines) if lines else 0.0

        return OCRResult(
            full_text=full_text,
            lines=lines,
            confidence=avg_conf,
            engine="easyocr",
            language=language,
        )

    def is_available(self) -> bool:
        try:
            import easyocr  # noqa
            return True
        except ImportError:
            return False
