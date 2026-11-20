"""Single-use PDF worker: raw input on stdin, no document bytes on stdout."""

import importlib.util
import json
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "scoremap_pdf_validate", Path(__file__).with_name("validate.py")
)
if spec is None or spec.loader is None:
    sys.exit(3)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
InvalidPdf, MAX_FILE, validate_pdf = (
    module.InvalidPdf,
    module.MAX_FILE,
    module.validate_pdf,
)

try:
    pages = int(sys.argv[1]) if len(sys.argv) == 2 else None
    if len(sys.argv) > 2 or (pages is not None and pages < 1):
        raise InvalidPdf("Invalid page count")
    document = sys.stdin.buffer.read(MAX_FILE + 1)
    result = validate_pdf(document, pages)
    print(json.dumps(result, separators=(",", ":")))
except InvalidPdf:
    sys.exit(2)
except Exception:
    sys.exit(3)
