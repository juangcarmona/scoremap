"""Experimental internal-only PDF validator; it must run in a constrained container."""

import hashlib
import json
import os
import subprocess
import socket
import threading
import time
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

MAX_FILE = 8 * 1024 * 1024
TIMEOUT_SECONDS = 12
HEADER_SECONDS = 5
BODY_SECONDS = 10
WORKER = Path(__file__).resolve().with_name("validate_cli.py")


class Handler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.header_deadline = threading.Timer(HEADER_SECONDS, self.expire_headers)
        self.header_deadline.daemon = True
        self.header_deadline.start()

    def expire_headers(self):
        try:
            self.connection.shutdown(socket.SHUT_RDWR)
        except OSError:
            pass

    def finish(self):
        self.header_deadline.cancel()
        super().finish()

    def log_message(self, *_args):
        pass  # Document names, contents and request values never enter access logs.

    def respond(self, status, body=b""):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self.header_deadline.cancel()
        self.respond(200 if self.path == "/health" else 404)

    def do_POST(self):
        self.header_deadline.cancel()
        if self.path != "/validate":
            self.respond(404)
            return
        try:
            if (
                self.headers.get("Transfer-Encoding")
                or self.headers.get("Content-Type") != "application/pdf"
                or len(self.headers.get_all("Content-Length", [])) != 1
                or len(self.headers.get_all("X-ScoreMap-Pages", [])) > 1
            ):
                self.respond(400)
                return
            size = int(self.headers.get("Content-Length", "0"))
            page_count = self.headers.get("X-ScoreMap-Pages")
            if not 1 <= size <= MAX_FILE or (
                page_count is not None
                and (
                    not page_count.isascii()
                    or not page_count.isdecimal()
                    or not 1 <= int(page_count) <= 200
                )
            ):
                self.respond(400)
                return
            deadline = time.monotonic() + BODY_SECONDS
            received = bytearray()
            while len(received) < size:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise TimeoutError("PDF request deadline elapsed")
                self.connection.settimeout(remaining)
                chunk = self.rfile.read1(min(size - len(received), 64 * 1024))
                if not chunk:
                    self.respond(400)
                    return
                received.extend(chunk)
            data = bytes(received)
            args = [sys.executable, "-I", str(WORKER)] + (
                [page_count] if page_count else []
            )
            result = subprocess.run(
                args,
                input=data,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                timeout=TIMEOUT_SECONDS,
                check=False,
                env={"PATH": os.defpath},
            )
            if result.returncode == 2:
                self.respond(422)
                return
            if result.returncode != 0 or len(result.stdout) > 256:
                self.respond(503)
                return
            parsed = json.loads(result.stdout)
            if (
                not isinstance(parsed, dict)
                or set(parsed) != {"sha256", "pages"}
                or parsed["sha256"] != hashlib.sha256(data).hexdigest()
                or type(parsed["pages"]) is not int
                or not 1 <= parsed["pages"] <= 200
                or (page_count is not None and parsed["pages"] != int(page_count))
            ):
                self.respond(503)
                return
            self.respond(200, result.stdout)
        except (ValueError, OSError, subprocess.SubprocessError):
            try:
                self.respond(503)
            except OSError:
                pass


if __name__ == "__main__":
    HTTPServer(("0.0.0.0", 8123), Handler).serve_forever()
