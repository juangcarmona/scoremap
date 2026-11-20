import hashlib
import http.client
import importlib.util
import json
import socket
import time
import subprocess
import threading
import unittest
from http.server import HTTPServer
from pathlib import Path
from unittest.mock import patch

path = Path(__file__).resolve().parents[2] / "src/pdf-validator/server.py"
spec = importlib.util.spec_from_file_location("scoremap_pdf_server", path)
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)
PDF = (
    Path(__file__).resolve().parents[1] / "fixtures/pdf/synthetic-chromium.pdf"
).read_bytes()


class Protocol(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.http = HTTPServer(("127.0.0.1", 0), server.Handler)
        cls.thread = threading.Thread(target=cls.http.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown()
        cls.thread.join()
        cls.http.server_close()

    def request(self, data, **headers):
        connection = http.client.HTTPConnection(
            "127.0.0.1", self.http.server_port, timeout=10
        )
        connection.request(
            "POST", "/validate", data, {"Content-Type": "application/pdf", **headers}
        )
        response = connection.getresponse()
        result = response.status, response.read()
        connection.close()
        return result

    def test_success_binds_exact_bytes_and_failure_recovers(self):
        status, body = self.request(PDF, **{"X-ScoreMap-Pages": "1"})
        self.assertEqual(status, 200)
        self.assertEqual(
            json.loads(body), {"sha256": hashlib.sha256(PDF).hexdigest(), "pages": 1}
        )
        self.assertEqual(self.request(PDF, **{"X-ScoreMap-Pages": "2"}), (422, b""))
        self.assertEqual(self.request(b"not a PDF"), (422, b""))
        self.assertEqual(self.request(PDF)[0], 200)

    def test_slow_headers_and_body_do_not_hold_the_server_indefinitely(self):
        with patch.object(server, "HEADER_SECONDS", 0.3):
            client = socket.create_connection(("127.0.0.1", self.http.server_port))
            client.sendall(b"POST /validate HTTP/1.1\r\nHost: localhost\r\n")
            time.sleep(0.6)
            client.close()
            self.assertEqual(self.request(PDF)[0], 200)
        with patch.object(server, "BODY_SECONDS", 0.3):
            client = socket.create_connection(("127.0.0.1", self.http.server_port))
            client.sendall(
                b"POST /validate HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/pdf\r\nContent-Length: 100\r\n\r\nx"
            )
            time.sleep(0.15)
            client.sendall(b"y")
            time.sleep(0.35)
            client.close()
            self.assertEqual(self.request(PDF)[0], 200)

    def test_timeout_and_process_failure_do_not_succeed(self):
        with patch.object(
            server.subprocess, "run", side_effect=subprocess.TimeoutExpired("worker", 1)
        ):
            self.assertEqual(self.request(PDF), (503, b""))
        with patch.object(
            server.subprocess,
            "run",
            return_value=subprocess.CompletedProcess([], 137, b""),
        ):
            self.assertEqual(self.request(PDF), (503, b""))
        with patch.object(
            server.subprocess,
            "run",
            return_value=subprocess.CompletedProcess(
                [], 0, b'{"sha256":"wrong","pages":1}'
            ),
        ):
            self.assertEqual(self.request(PDF), (503, b""))
        self.assertEqual(self.request(PDF)[0], 200)


if __name__ == "__main__":
    unittest.main()
