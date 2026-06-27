import asyncio
from pathlib import Path
from typing import List, Optional
import pytesseract
from PIL import Image
from app.services.ocr.base import OCREngine, OCRResult, LineResult, BoundingBox

# Tesseract language code map
LANG_MAP = {
    "English": "eng",
    "Tamil": "tam",
    "Malayalam": "mal",
    "Mixed": "eng+tam",
    "eng": "eng",
    "tam": "tam",
    "mal": "mal",
}

# Tesseract config tuned for 19th-century manuscripts
HISTORICAL_CONFIG = (
    "--oem 3 --psm 6 "
    "-c preserve_interword_spaces=1 "
    "-c tessedit_char_blacklist=|"
)


class TesseractEngine(OCREngine):
    name = "tesseract"
    display_name = "Tesseract OCR"
    supports_bboxes = True
    supports_multi_language = True

    async def process_image(self, image_path: Path, language: str = "eng", options: dict = None) -> OCRResult:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._run_tesseract, image_path, language, options or {})

    def _run_tesseract(self, image_path: Path, language: str, options: dict) -> OCRResult:
        lang_code = LANG_MAP.get(language, "eng")
        config = options.get("config", HISTORICAL_CONFIG)

        img = Image.open(image_path)
        # Enhance contrast for faded manuscripts
        img = self._preprocess(img)

        # Get full text
        full_text = pytesseract.image_to_string(img, lang=lang_code, config=config)

        # Get word-level bounding boxes for line grouping
        try:
            data = pytesseract.image_to_data(img, lang=lang_code, config=config, output_type=pytesseract.Output.DICT)
            lines = self._group_into_lines(data)
            avg_conf = sum(l.confidence for l in lines) / len(lines) if lines else 0.0
        except Exception:
            lines = self._text_to_lines(full_text)
            avg_conf = 0.0

        return OCRResult(
            full_text=full_text.strip(),
            lines=lines,
            confidence=avg_conf,
            engine="tesseract",
            language=lang_code,
            metadata={"lang_code": lang_code, "config": config},
        )

    def _preprocess(self, img: Image.Image) -> Image.Image:
        """Basic preprocessing for degraded historical manuscripts."""
        import cv2, numpy as np
        arr = np.array(img.convert("RGB"))
        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
        # Adaptive thresholding helps with uneven illumination
        processed = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 10
        )
        return Image.fromarray(processed)

    def _group_into_lines(self, data: dict) -> List[LineResult]:
        """Group Tesseract word data into lines with bounding boxes."""
        line_groups: dict = {}
        n = len(data["text"])
        for i in range(n):
            word = data["text"][i].strip()
            if not word:
                continue
            conf = float(data["conf"][i])
            if conf < 0:
                continue
            line_key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
            if line_key not in line_groups:
                line_groups[line_key] = {"words": [], "confs": [], "x1": [], "y1": [], "x2": [], "y2": []}
            line_groups[line_key]["words"].append(word)
            line_groups[line_key]["confs"].append(conf)
            x = data["left"][i]
            y = data["top"][i]
            w = data["width"][i]
            h = data["height"][i]
            line_groups[line_key]["x1"].append(x)
            line_groups[line_key]["y1"].append(y)
            line_groups[line_key]["x2"].append(x + w)
            line_groups[line_key]["y2"].append(y + h)

        results = []
        for idx, (_, grp) in enumerate(sorted(line_groups.items())):
            text = " ".join(grp["words"])
            avg_conf = sum(grp["confs"]) / len(grp["confs"]) / 100.0
            bbox = BoundingBox(
                x1=min(grp["x1"]), y1=min(grp["y1"]),
                x2=max(grp["x2"]), y2=max(grp["y2"]),
            )
            results.append(LineResult(line_number=idx + 1, text=text, confidence=avg_conf, bbox=bbox))
        return results

    def _text_to_lines(self, text: str) -> List[LineResult]:
        lines = []
        for i, line in enumerate(text.split("\n")):
            if line.strip():
                lines.append(LineResult(line_number=i + 1, text=line.strip(), confidence=0.0))
        return lines

    def is_available(self) -> bool:
        try:
            pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False
