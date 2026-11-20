"""Run validator tests from committed source in an isolated matching image."""
import json
import re
import secrets
import subprocess
import sys
import tarfile
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def run(args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def qualify_service(image, source):
    name = "scoremap-pdf-validator-test-" + secrets.token_hex(6)
    try:
        run([
            "docker", "run", "-d", "--name", name, "--network", "none", "--read-only",
            "--memory", "192m", "--memory-swap", "192m", "--cpus", ".5",
            "--pids-limit", "64", "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
            "--mount", f"type=bind,source={source / 'tests/fixtures/pdf'},target=/fixtures,readonly",
            image,
        ], stdout=subprocess.DEVNULL)
        for _ in range(60):
            probe = subprocess.run(
                ["docker", "exec", name, "python", "-I", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8123/health', timeout=2).read()"],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            )
            if probe.returncode == 0:
                break
            time.sleep(0.5)
        else:
            raise RuntimeError("The isolated synthetic validator did not start")
        # The client runs inside the networkless validator container. No port is
        # published and the only documents are committed synthetic fixtures.
        client = r'''
import hashlib, json, pathlib, urllib.error, urllib.request
def send(name):
    data = pathlib.Path('/fixtures', name).read_bytes()
    request = urllib.request.Request('http://127.0.0.1:8123/validate', data=data, headers={'Content-Type': 'application/pdf'})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return response.status, response.read(), data
    except urllib.error.HTTPError as error:
        return error.code, error.read(), data
status, body, data = send('synthetic-chromium.pdf')
assert status == 200 and json.loads(body) == {'sha256': hashlib.sha256(data).hexdigest(), 'pages': 1}
status, _, _ = send('objectstream-resource-bomb.pdf')
assert status in (422, 503)
status, body, data = send('synthetic-chromium.pdf')
assert status == 200 and json.loads(body) == {'sha256': hashlib.sha256(data).hexdigest(), 'pages': 1}
print('Real isolated service rejected the compressed-resource bomb and accepted a normal PDF afterward.')
'''
        run(["docker", "exec", name, "python", "-I", "-c", client], timeout=90)
    finally:
        subprocess.run(["docker", "rm", "-f", name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)


def main():
    if len(sys.argv) != 2 or not re.fullmatch(r"sha256:[0-9a-f]{64}", sys.argv[1]):
        raise RuntimeError("Select the exact built validator image ID")
    revision = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    metadata = json.loads(subprocess.check_output(["docker", "image", "inspect", sys.argv[1]], text=True))[0]
    if (metadata["Config"].get("Labels") or {}).get("org.opencontainers.image.revision") != revision:
        raise RuntimeError("The validator image must match the committed source revision")
    with tempfile.TemporaryDirectory(prefix="scoremap-pdf-validator-tests-") as directory:
        path = Path(directory)
        path.chmod(0o755)
        archive = path / "source.tar"
        run(["git", "archive", "--format=tar", f"--output={archive}", revision], cwd=ROOT)
        source = path / "source"
        source.mkdir()
        with tarfile.open(archive) as bundle:
            bundle.extractall(source, filter="data")
        run([
            "docker", "run", "--rm", "--network", "none", "--read-only",
            "--memory", "192m", "--memory-swap", "192m", "--cpus", ".5",
            "--pids-limit", "64", "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
            "--mount", f"type=bind,source={source},target=/source,readonly",
            "--workdir", "/source", "--entrypoint", "python", sys.argv[1],
            "-m", "unittest", "discover", "-s", "tests/pdf", "-p", "test_*.py",
        ])
        qualify_service(sys.argv[1], source)
    print(f"Validator unit and protocol tests passed for committed source {revision}; no production service was started.")


if __name__ == "__main__":
    main()
