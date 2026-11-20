"""Run validator tests from committed source in an isolated matching image."""
import json
import re
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def run(args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


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
    print(f"Validator unit and protocol tests passed for committed source {revision}; no production service was started.")


if __name__ == "__main__":
    main()
