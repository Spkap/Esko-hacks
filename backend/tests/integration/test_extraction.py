from pathlib import Path
import json
import pytest
from app.extraction.documents import extract_document
from app.extraction.references import extract_reference


@pytest.fixture(autouse=True)
def database():
    # Extraction tests use actual parsers and files, independent of database state.
    yield


ROOT = Path(__file__).resolve().parents[3]


def latin_font(size=60):
    from PIL import ImageFont

    for path in [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    pytest.skip("OCR reference measurement requires an installed Latin TrueType font")


def test_organizer_actual_files():
    artwork = extract_document(
        ROOT / "frontend/public/demo/dancingfish-carton.pdf", "application/pdf"
    )
    assert artwork["pages"] and artwork["pages"][0]["width"] > 0
    assert artwork["text"].strip()
    workbook = extract_reference(
        ROOT / "frontend/public/demo/dancingfish-content.xlsx", "xlsx"
    )
    assert len(workbook["fields"]) > 10
    assert all("!" in f["location"] for f in workbook["fields"])
    assert not workbook["specification"]
    assert workbook["qualifiers"]  # Organizer draft/reconstructed labels must survive.


def test_reference_json_and_changed_contents(tmp_path):
    path = tmp_path / "spec.json"
    data = json.loads(
        (ROOT / "reference-data/live-specification-example.json").read_text()
    )
    path.write_text(json.dumps(data))
    assert (
        extract_reference(path, "json")["specification"]["netQuantity"]["value"] == 250
    )
    data["product"]["netQuantity"]["value"] = 500
    path.write_text(json.dumps(data))
    assert (
        extract_reference(path, "json")["specification"]["netQuantity"]["value"] == 500
    )


def test_spreadsheet_conflicts(tmp_path):
    from openpyxl import Workbook

    book = Workbook()
    sheet = book.active
    sheet.append(["Quantity", "250 mL"])
    sheet.append(["Quantity", "500 mL"])
    path = tmp_path / "conflict.xlsx"
    book.save(path)
    result = extract_reference(path, "xlsx")
    assert result["conflicts"] and len(result["fields"]) == 4


def test_malformed_and_password_pdf(tmp_path):
    from pypdf import PdfWriter

    path = tmp_path / "bad.pdf"
    path.write_bytes(b"%PDF-broken")
    with pytest.raises(Exception):
        extract_document(path, "pdf")
    writer = PdfWriter()
    writer.add_blank_page(100, 100)
    writer.encrypt("secret")
    writer.write(path)
    with pytest.raises(ValueError, match="Password"):
        extract_document(path, "pdf")


def test_native_rotated_page_and_image_ocr(tmp_path):
    from pypdf import PdfWriter
    from pypdf.generic import NameObject, DictionaryObject, DecodedStreamObject
    from PIL import Image, ImageDraw

    writer = PdfWriter()
    page = writer.add_blank_page(300, 200)
    font = DictionaryObject(
        {
            NameObject("/Type"): NameObject("/Font"),
            NameObject("/Subtype"): NameObject("/Type1"),
            NameObject("/BaseFont"): NameObject("/Helvetica"),
        }
    )
    page[NameObject("/Resources")] = DictionaryObject(
        {NameObject("/Font"): DictionaryObject({NameObject("/F1"): font})}
    )
    stream = DecodedStreamObject()
    stream.set_data(b"BT /F1 18 Tf 20 120 Td (Net quantity 250 mL) Tj ET")
    page[NameObject("/Contents")] = writer._add_object(stream)
    page.rotate(90)
    path = tmp_path / "rotated.pdf"
    writer.write(path)
    result = extract_document(path, "pdf")
    assert result["pages"][0]["rotation"] == 90 and "250 mL" in result["text"]
    # Regions stay in the unrotated crop-page coordinate system; the viewer
    # applies the separately retained page rotation exactly once.
    assert result["pages"][0]["spans"]
    assert all(
        0 <= span["region"]["x"] < 1 and 0 <= span["region"]["y"] < 1
        for span in result["pages"][0]["spans"]
    )
    image = Image.new("RGB", (1000, 200), "white")
    draw = ImageDraw.Draw(image)
    draw.text((20, 50), "Net quantity 500 mL", font=latin_font(), fill="black")
    image_path = tmp_path / "scan.png"
    image.save(image_path)
    result = extract_document(image_path, "image/png")
    assert "500" in result["text"] and result["method"] == "ocr"
    assert result["readingStatus"] == "partial" and not result["completeCoverage"]


def test_ocr_quantity_drives_real_rules(tmp_path):
    from PIL import Image, ImageDraw
    from app.verification.rules import evaluate_run

    image = Image.new("RGB", (1200, 200), "white")
    ImageDraw.Draw(image).text(
        (20, 50), "Net quantity: 500 mL", font=latin_font(), fill="black"
    )
    path = tmp_path / "quantity.png"
    image.save(path)
    artwork = {"id": "actual", **extract_document(path, "image/png")}
    ref = {
        "id": "spec",
        "role": "product_specification",
        "approvalStatus": "approved",
        "extraction": extract_reference(
            ROOT / "reference-data/live-specification-example.json", "json"
        ),
    }
    run = {
        "id": "actual",
        "ruleSetVersion": "wavelength-core-v1",
        "selectedRuleIds": ["net-quantity"],
    }
    assert evaluate_run(artwork, [ref], run)["checks"][0]["result"] == "fail"


def test_native_file_changes_exact_checks(tmp_path):
    from pypdf import PdfWriter
    from pypdf.generic import NameObject, DictionaryObject, DecodedStreamObject
    from app.verification.rules import evaluate_run

    ref = {
        "id": "spec",
        "role": "product_specification",
        "approvalStatus": "approved",
        "extraction": extract_reference(
            ROOT / "reference-data/live-specification-example.json", "json"
        ),
    }
    ref["extraction"]["requirements"] = [{"id": "statement", "text": "Required phrase"}]
    run = {
        "id": "native",
        "ruleSetVersion": "wavelength-core-v1",
        "selectedRuleIds": ["net-quantity", "required-statements"],
    }
    outcomes = []
    for index, content in enumerate(
        ("Net quantity: 250 mL Required phrase", "Net quantity: 500 mL")
    ):
        writer = PdfWriter()
        page = writer.add_blank_page(600, 200)
        font = DictionaryObject(
            {
                NameObject("/Type"): NameObject("/Font"),
                NameObject("/Subtype"): NameObject("/Type1"),
                NameObject("/BaseFont"): NameObject("/Helvetica"),
            }
        )
        page[NameObject("/Resources")] = DictionaryObject(
            {NameObject("/Font"): DictionaryObject({NameObject("/F1"): font})}
        )
        stream = DecodedStreamObject()
        stream.set_data(f"BT /F1 18 Tf 20 120 Td ({content}) Tj ET".encode())
        page[NameObject("/Contents")] = writer._add_object(stream)
        path = tmp_path / f"native-{index}.pdf"
        writer.write(path)
        artwork = {"id": f"actual-{index}", **extract_document(path, "pdf")}
        outcomes.append(
            [c["result"] for c in evaluate_run(artwork, [ref], run)["checks"]]
        )
    assert outcomes == [["pass", "pass"], ["fail", "fail"]]


def test_vector_or_invisible_content_cannot_prove_absence(tmp_path):
    from pypdf import PdfWriter
    from pypdf.generic import NameObject, DictionaryObject, DecodedStreamObject

    for suffix in (
        b" 10 10 m 60 80 l S",
        b" BT /F1 12 Tf 3 Tr 10 10 Td (unseen text) Tj ET",
    ):
        writer = PdfWriter()
        page = writer.add_blank_page(600, 200)
        font = DictionaryObject(
            {
                NameObject("/Type"): NameObject("/Font"),
                NameObject("/Subtype"): NameObject("/Type1"),
                NameObject("/BaseFont"): NameObject("/Helvetica"),
            }
        )
        page[NameObject("/Resources")] = DictionaryObject(
            {NameObject("/Font"): DictionaryObject({NameObject("/F1"): font})}
        )
        stream = DecodedStreamObject()
        stream.set_data(b"BT /F1 18 Tf 20 120 Td (Net quantity 250 mL) Tj ET" + suffix)
        page[NameObject("/Contents")] = writer._add_object(stream)
        path = tmp_path / "complex.pdf"
        writer.write(path)
        assert extract_document(path, "pdf")["completeCoverage"] is False


def test_japanese_scan_keeps_unknown_coverage(tmp_path):
    import pytesseract
    from PIL import Image, ImageDraw, ImageFont

    font = Path("/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc")
    if "jpn" not in pytesseract.get_languages(config="") or not font.exists():
        pytest.skip(
            "Japanese OCR language and Japanese font required for this local measurement"
        )
    image = Image.new("RGB", (1200, 350), "white")
    ImageDraw.Draw(image).text(
        (40, 70),
        "果汁2%  内容量250mL",
        font=ImageFont.truetype(str(font), 70),
        fill="black",
    )
    path = tmp_path / "japanese-scan.pdf"
    image.save(path, "PDF", resolution=144)
    result = extract_document(path, "application/pdf")
    compact = "".join(result["text"].split())
    assert "果汁" in compact and "250" in compact, result["text"]
    assert result["method"] == "ocr" and "jpn" in result["pages"][0]["ocrLanguages"]
    assert result["readingStatus"] == "partial" and not result["completeCoverage"]


def test_pdf_reference_derives_only_exact_labeled_quantity(tmp_path):
    from pypdf import PdfWriter
    from pypdf.generic import NameObject, DictionaryObject, DecodedStreamObject

    writer = PdfWriter()
    page = writer.add_blank_page(600, 200)
    font = DictionaryObject(
        {
            NameObject("/Type"): NameObject("/Font"),
            NameObject("/Subtype"): NameObject("/Type1"),
            NameObject("/BaseFont"): NameObject("/Helvetica"),
        }
    )
    page[NameObject("/Resources")] = DictionaryObject(
        {NameObject("/Font"): DictionaryObject({NameObject("/F1"): font})}
    )
    stream = DecodedStreamObject()
    stream.set_data(
        b"BT /F1 18 Tf 20 120 Td (Product specification - Net content: 250 mL) Tj ET"
    )
    page[NameObject("/Contents")] = writer._add_object(stream)
    path = tmp_path / "specification.pdf"
    writer.write(path)
    result = extract_reference(path, "application/pdf")
    assert result["specification"]["netQuantity"]["value"] == 250
    assert "Page 1" in result["specification"]["netQuantity"]["location"]
