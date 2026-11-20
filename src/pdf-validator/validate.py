"""Experimental strict PDF admission for a resource-limited, no-egress worker.

Not connected to ScoreMap persistence. The caller must enforce process limits,
a deadline and authorization, and bind the result to the exact committed bytes.
"""

from hashlib import sha256
from io import BytesIO
from math import isfinite

from PIL import Image
from pypdf import PdfReader, apply_configuration
from pypdf.generic import ArrayObject, DictionaryObject, IndirectObject, StreamObject

MAX_FILE = 8 * 1024 * 1024
MAX_STREAM = 4 * 1024 * 1024
MAX_TOTAL = 32 * 1024 * 1024
MAX_OBJECTS = 50_000
MAX_PAGES = 200
MAX_POINTS = 5_000
MAX_PIXELS = 16_000_000
# Other decoders and embedded actions are not qualified for this provisional subset.
FORBIDDEN = {
    "/JavaScript",
    "/JS",
    "/Launch",
    "/SubmitForm",
    "/ImportData",
    "/EmbeddedFile",
    "/Filespec",
    "/RichMedia",
    "/XFA",
}


class InvalidPdf(ValueError):
    pass


def _page_tree_count(value, seen: set, depth: int = 0) -> int:
    if depth > 100:
        raise InvalidPdf("PDF page tree is too deep")
    if isinstance(value, IndirectObject):
        key = (value.idnum, value.generation)
        if key in seen:
            raise InvalidPdf("PDF page tree contains a cycle or duplicate")
        seen.add(key)
        value = value.get_object()
    if not isinstance(value, DictionaryObject):
        raise InvalidPdf("PDF page tree is malformed")
    kind = value.get("/Type")
    if kind == "/Page":
        return 1
    if kind != "/Pages":
        raise InvalidPdf("PDF page tree has an unsupported node")
    kids = value.get("/Kids")
    if not isinstance(kids, ArrayObject) or len(kids) > MAX_PAGES:
        raise InvalidPdf("PDF page tree has invalid children")
    count = 0
    for child in kids:
        count += _page_tree_count(child, seen, depth + 1)
        if count > MAX_PAGES:
            raise InvalidPdf("PDF has too many pages")
    if int(value.get("/Count", -1)) != count:
        raise InvalidPdf("PDF page count does not match its page tree")
    return count


def validate_pdf(data: bytes, expected_pages: int | None = None) -> dict:
    with apply_configuration(zlib_maximum_output_length=MAX_STREAM):
        return _validate_pdf(data, expected_pages)


def _validate_pdf(data: bytes, expected_pages: int | None) -> dict:
    if not isinstance(data, bytes) or not 0 < len(data) <= MAX_FILE:
        raise InvalidPdf("PDF file size is outside the supported range")
    if not data.startswith(b"%PDF-"):
        raise InvalidPdf("PDF signature is invalid")
    try:
        reader = PdfReader(BytesIO(data), strict=True)
        if reader.is_encrypted:
            raise InvalidPdf("Encrypted PDFs are not supported")
        declared = _page_tree_count(reader.trailer["/Root"].raw_get("/Pages"), set())
        if not 1 <= declared <= MAX_PAGES or (
            expected_pages is not None and declared != expected_pages
        ):
            raise InvalidPdf("PDF page count is invalid")
        pages = list(reader.pages)
        if len(pages) != declared:
            raise InvalidPdf("PDF page count does not match the page tree")
        for page in pages:
            dimensions = (float(page.mediabox.width), float(page.mediabox.height))
            if not all(
                isfinite(value) and 0 < value <= MAX_POINTS for value in dimensions
            ):
                raise InvalidPdf("PDF page dimensions are unsupported")
        refs = {
            (number, generation)
            for generation, objects in reader.xref.items()
            for number in objects
            if number
        }
        refs.update((number, 0) for number in reader.xref_objStm)
        if len(refs) > MAX_OBJECTS:
            raise InvalidPdf("PDF contains too many objects")
        total = 0
        for number, generation in refs:
            obj = reader.get_object(IndirectObject(number, generation, reader))
            stack = [obj]
            visited = set()
            while stack:
                value = stack.pop()
                if isinstance(value, IndirectObject):
                    continue  # Every declared indirect object is examined independently.
                if isinstance(value, (DictionaryObject, ArrayObject)):
                    identity = id(value)
                    if identity in visited:
                        continue
                    visited.add(identity)
                    if len(visited) > MAX_OBJECTS:
                        raise InvalidPdf("PDF object graph is too complex")
                if isinstance(value, DictionaryObject):
                    if any(str(key) in FORBIDDEN for key in value) or any(
                        str(value.get(key)) in FORBIDDEN
                        for key in ("/S", "/Type", "/Subtype")
                    ):
                        raise InvalidPdf(
                            "PDF uses unsupported active or embedded content"
                        )
                    if value.get("/Subtype") == "/Image":
                        width, height = int(value.get("/Width", 0)), int(
                            value.get("/Height", 0)
                        )
                        if width < 1 or height < 1 or width * height > MAX_PIXELS:
                            raise InvalidPdf("PDF image dimensions are unsupported")
                    if isinstance(value, StreamObject):
                        names = value.get("/Filter")
                        names = (
                            []
                            if names is None
                            else names if isinstance(names, ArrayObject) else [names]
                        )
                        filters_used = [str(name) for name in names]
                        jpeg = filters_used in (
                            ["/DCTDecode"],
                            ["/FlateDecode", "/DCTDecode"],
                        )
                        if not jpeg and any(
                            name != "/FlateDecode" for name in filters_used
                        ):
                            raise InvalidPdf("PDF stream compression is unsupported")
                        if jpeg and value.get("/Subtype") != "/Image":
                            raise InvalidPdf(
                                "JPEG compression is supported only for images"
                            )
                        decoded = value.get_data()
                        if len(decoded) > MAX_STREAM:
                            raise InvalidPdf("PDF stream exceeds the decoded limit")
                        if jpeg:
                            with Image.open(
                                BytesIO(decoded), formats=["JPEG"]
                            ) as image:
                                if (
                                    image.size != (width, height)
                                    or image.width * image.height > MAX_PIXELS
                                ):
                                    raise InvalidPdf(
                                        "JPEG and PDF image dimensions differ"
                                    )
                                image.load()
                        total += len(decoded)
                        if total > MAX_TOTAL:
                            raise InvalidPdf("PDF decoded content exceeds the limit")
                    stack.extend(value.raw_get(key) for key in value)
                elif isinstance(value, ArrayObject):
                    stack.extend(value)
        return {"sha256": sha256(data).hexdigest(), "pages": declared}
    except InvalidPdf:
        raise
    except Exception as error:
        raise InvalidPdf("PDF is malformed or unsupported") from error
