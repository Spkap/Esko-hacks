"""Bounded local extraction. Coordinates are normalized display-page coordinates."""

from pathlib import Path
import math

MAX_PAGES = 20
MAX_PIXELS = 24_000_000


def _plain_visible_text_page(page, text):
    """Absence is decidable only for a narrow text-only PDF drawing language.

    No images, forms, vector paths, clipping, optional content, graphics states,
    or invisible text. A native text layer by itself never establishes coverage.
    """
    resources = page.get("/Resources", {})
    if hasattr(resources, "get_object"):
        resources = resources.get_object()
    if resources.get("/XObject") or resources.get("/ExtGState"):
        return False
    fonts = resources.get("/Font", {})
    if hasattr(fonts, "get_object"):
        fonts = fonts.get_object()
    if any(font.get_object().get("/Subtype") == "/Type3" for font in fonts.values()):
        return False
    allowed = {
        b"BT",
        b"ET",
        b"Tf",
        b"Tm",
        b"Td",
        b"TD",
        b"T*",
        b"Tj",
        b"TJ",
        b"'",
        b'"',
        b"Tc",
        b"Tw",
        b"Tz",
        b"TL",
        b"Tr",
        b"Ts",
        b"q",
        b"Q",
        b"cm",
        b"rg",
        b"RG",
        b"g",
        b"G",
        b"k",
        b"K",
    }
    stream = page.get_contents()
    if stream is None or not text.strip() or "\ufffd" in text:
        return False
    return all(
        op in allowed and (op != b"Tr" or int(args[0]) in (0, 1, 2))
        for args, op in stream.operations
    )


def _ocr(image):
    import pytesseract
    from pytesseract import Output

    if image.width * image.height > MAX_PIXELS:
        raise ValueError("Image exceeds decoded pixel limit")
    languages = pytesseract.get_languages(config="")
    lang = "+".join(x for x in ("eng", "jpn") if x in languages) or "eng"
    data = pytesseract.image_to_data(
        image, lang=lang, output_type=Output.DICT, timeout=20
    )
    spans = []
    for i, word in enumerate(data["text"]):
        confidence = float(data["conf"][i])
        if word.strip() and confidence >= 0:
            spans.append(
                {
                    "text": word,
                    "confidence": confidence / 100,
                    "region": {
                        "x": data["left"][i] / image.width,
                        "y": data["top"][i] / image.height,
                        "width": data["width"][i] / image.width,
                        "height": data["height"][i] / image.height,
                    },
                }
            )
    # Line groups preserve multiword quantities and literal phrases.
    groups = {}
    for i, word in enumerate(data["text"]):
        if word.strip() and float(data["conf"][i]) >= 0:
            key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
            groups.setdefault(key, []).append(i)
    lines = []
    for indices in groups.values():
        left = min(data["left"][i] for i in indices)
        top = min(data["top"][i] for i in indices)
        right = max(data["left"][i] + data["width"][i] for i in indices)
        bottom = max(data["top"][i] + data["height"][i] for i in indices)
        lines.append(
            {
                "text": " ".join(data["text"][i] for i in indices),
                "confidence": min(float(data["conf"][i]) / 100 for i in indices),
                "region": {
                    "x": left / image.width,
                    "y": top / image.height,
                    "width": (right - left) / image.width,
                    "height": (bottom - top) / image.height,
                },
            }
        )
    return "\n".join(s["text"] for s in lines), lines, lang


def extract_document(path: Path, file_type: str) -> dict:
    path = Path(path)
    pages = []
    if file_type in ("application/pdf", "pdf"):
        from pypdf import PdfReader

        reader = PdfReader(path)
        if reader.is_encrypted:
            raise ValueError("Password-protected PDFs are unsupported")
        if not 0 < len(reader.pages) <= MAX_PAGES:
            raise ValueError("PDF page count exceeds limit")
        raster = None
        for index, page in enumerate(reader.pages):
            width, height = float(page.cropbox.width), float(page.cropbox.height)
            rotation = int(page.rotation or 0) % 360
            spans = []

            def visit(text, cm, tm, font, size):
                if not text.strip():
                    return
                # pypdf visitor text coordinates can be unreliable in complex graphics;
                # retain only plausible boxes, never invent a matching location.
                x = cm[0] * tm[4] + cm[2] * tm[5] + cm[4] - float(page.cropbox.left)
                y = cm[1] * tm[4] + cm[3] * tm[5] + cm[5] - float(page.cropbox.bottom)
                h = abs(float(size))
                if 0 <= x < width and 0 <= y <= height and h > 0:
                    top = max(0, (height - y - h) / height)
                    spans.append(
                        {
                            "text": text.strip(),
                            "confidence": 1.0,
                            "regionAccuracy": "approximate-text-run",
                            "region": {
                                "x": x / width,
                                "y": top,
                                "width": min(
                                    1 - x / width,
                                    max(0.001, len(text.strip()) * h * 0.5 / width),
                                ),
                                "height": min(1 - top, max(0.001, h / height)),
                            },
                        }
                    )

            text = page.extract_text(visitor_text=visit) or ""
            method = "native-pdf"
            # Native content alone does not imply complete visual coverage.
            if len("".join(c for c in text if c.isalnum())) < 12:
                import pypdfium2 as pdfium

                if raster is None:
                    raster = pdfium.PdfDocument(str(path))
                rp = raster[index]
                scale = min(2, math.sqrt(MAX_PIXELS / (width * height)))
                bitmap = rp.render(scale=scale)
                image = bitmap.to_pil()
                text, spans, language = _ocr(image)
                image.close()
                bitmap.close()
                rp.close()
                method = "ocr"
            pages.append(
                {
                    "width": width,
                    "height": height,
                    "rotation": rotation,
                    "crop": [float(v) for v in page.cropbox],
                    "text": text,
                    "spans": spans,
                    "method": method,
                    "ocrLanguages": language if method == "ocr" else None,
                    "nativeTextCoverage": method == "native-pdf"
                    and _plain_visible_text_page(page, text),
                }
            )
        if raster is not None:
            raster.close()
    elif file_type in ("image/png", "image/jpeg", "png", "jpeg", "jpg"):
        from PIL import Image

        with Image.open(path) as image:
            if image.width * image.height > MAX_PIXELS:
                raise ValueError("Image exceeds decoded pixel limit")
            text, spans, language = _ocr(image)
            pages.append(
                {
                    "width": image.width,
                    "height": image.height,
                    "rotation": 0,
                    "text": text,
                    "spans": spans,
                    "method": "ocr",
                    "ocrLanguages": language,
                }
            )
    else:
        raise ValueError("Unsupported artwork type")
    text = "\n".join(p["text"] for p in pages)
    return {
        "pages": pages,
        "text": text,
        "readingStatus": "partial"
        if not text.strip() or any(p["method"] == "ocr" for p in pages)
        else "read",
        "method": "+".join(sorted({p["method"] for p in pages})),
        "completeCoverage": all(p.get("nativeTextCoverage", False) for p in pages),
        "coverageScope": "declared supplied text-only panels; vector, image, hidden or complex content abstains",
    }
