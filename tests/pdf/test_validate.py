import importlib.util
import io
import unittest
import zlib
from hashlib import sha256
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import (
    ArrayObject,
    DecodedStreamObject,
    DictionaryObject,
    NameObject,
    NumberObject,
    StreamObject,
    TextStringObject,
)

spec = importlib.util.spec_from_file_location(
    "scoremap_pdf_validator",
    Path(__file__).resolve().parents[2] / "src/pdf-validator/validate.py",
)
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


def fixture(*, password=None, bomb=False, action=False, false_count=False):
    writer = PdfWriter()
    page = writer.add_blank_page(width=612, height=792)
    writer.add_blank_page(width=612, height=792)
    content = DecodedStreamObject()
    content.set_data(b"q 0 0 10 10 re f Q\n")
    page[NameObject("/Contents")] = writer._add_object(content)
    if bomb:
        stream = StreamObject()
        stream._data = zlib.compress(b"0" * (validator.MAX_STREAM + 1))
        stream[NameObject("/Filter")] = NameObject("/FlateDecode")
        stream[NameObject("/Type")] = NameObject("/XObject")
        stream[NameObject("/Subtype")] = NameObject("/Form")
        stream[NameObject("/BBox")] = ArrayObject(
            [NumberObject(0), NumberObject(0), NumberObject(10), NumberObject(10)]
        )
        page[NameObject("/Resources")] = DictionaryObject(
            {
                NameObject("/XObject"): DictionaryObject(
                    {NameObject("/Fm0"): writer._add_object(stream)}
                )
            }
        )
    if false_count:
        writer._root_object["/Pages"].get_object()[NameObject("/Count")] = NumberObject(
            1
        )
    if action:
        writer._root_object[NameObject("/OpenAction")] = DictionaryObject(
            {
                NameObject("/S"): NameObject("/JavaScript"),
                NameObject("/JS"): TextStringObject("app.alert('synthetic')"),
            }
        )
    if password is not None:
        writer.encrypt(password, algorithm="RC4-128")
    result = io.BytesIO()
    writer.write(result)
    return result.getvalue()


class PdfValidation(unittest.TestCase):
    def test_returns_digest_and_actual_pages(self):
        data = fixture()
        self.assertEqual(
            validator.validate_pdf(data, 2),
            {"sha256": sha256(data).hexdigest(), "pages": 2},
        )

    def test_accepts_browser_generated_synthetic_score(self):
        data = (
            Path(__file__).resolve().parents[1] / "fixtures/pdf/synthetic-chromium.pdf"
        ).read_bytes()
        self.assertEqual(validator.validate_pdf(data)["pages"], 1)

    def test_validates_scanned_jpeg_dimensions(self):
        data = (
            Path(__file__).resolve().parents[1] / "fixtures/pdf/synthetic-scanned.pdf"
        ).read_bytes()
        self.assertEqual(validator.validate_pdf(data)["pages"], 1)
        writer = PdfWriter()
        writer.append(PdfReader(io.BytesIO(data)))
        images = writer.pages[0]["/Resources"]["/XObject"]
        image = next(
            images[key] for key in images if images[key].get("/Subtype") == "/Image"
        )
        for width in (1, validator.MAX_PIXELS + 1):
            image[NameObject("/Width")] = NumberObject(width)
            changed = io.BytesIO()
            writer.write(changed)
            with self.subTest(width=width), self.assertRaises(validator.InvalidPdf):
                validator.validate_pdf(changed.getvalue())

    def test_rejects_encryption_truncation_and_incorrect_page_count(self):
        for data in [
            fixture(password="synthetic"),
            fixture(password=""),
            fixture()[:80],
            fixture(false_count=True),
        ]:
            with self.subTest(size=len(data)), self.assertRaises(validator.InvalidPdf):
                validator.validate_pdf(data)
        with self.assertRaises(validator.InvalidPdf):
            validator.validate_pdf(fixture(), 3)

    def test_rejects_reachable_resource_bomb_and_active_content(self):
        for data in [fixture(bomb=True), fixture(action=True)]:
            with self.subTest(size=len(data)), self.assertRaises(validator.InvalidPdf):
                validator.validate_pdf(data)
        validator.validate_pdf(fixture())

    def test_object_stream_document_and_resource_bomb(self):
        root = Path(__file__).resolve().parents[1] / "fixtures/pdf"
        self.assertEqual(
            validator.validate_pdf((root / "objectstream-normal.pdf").read_bytes())[
                "pages"
            ],
            2,
        )
        with self.assertRaises(validator.InvalidPdf):
            validator.validate_pdf(
                (root / "objectstream-resource-bomb.pdf").read_bytes()
            )

    def test_rejects_a_cyclic_page_tree(self):
        writer = PdfWriter()
        writer.add_blank_page(width=612, height=792)
        pages = writer._root_object["/Pages"].get_object()
        pages[NameObject("/Kids")] = ArrayObject([writer._pages])
        data = io.BytesIO()
        writer.write(data)
        with self.assertRaises(validator.InvalidPdf):
            validator.validate_pdf(data.getvalue())

    def test_rejects_file_over_limit(self):
        with self.assertRaises(validator.InvalidPdf):
            validator.validate_pdf(b"%PDF-" + b" " * validator.MAX_FILE)


if __name__ == "__main__":
    unittest.main()
