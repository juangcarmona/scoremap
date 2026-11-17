"""Exercise the real ticket store against an execution-owned disposable PostgreSQL database."""
from pathlib import Path
import hashlib, json, os, secrets, subprocess, tempfile, time, uuid
ROOT = Path(__file__).resolve().parents[1]
os.umask(0o077)
state = Path(tempfile.mkdtemp(prefix='scoremap-session-probe-'))
operation = uuid.uuid4().hex
name = 'scoremap-session-qualification-' + operation[:12]
project = 'tests/runtime/ScoreMap.SessionProbe/ScoreMap.SessionProbe.csproj'
inputs = ['scripts/qualify-session-vault.py', 'tests/runtime/ScoreMap.SessionProbe/Program.cs', project, 'tests/runtime/ScoreMap.SessionProbe/packages.lock.json', 'src/modules/ScoreMap.Modules.Library/Infrastructure/SessionVault.cs']
started = False

def call(args, *, env=None, timeout=180):
    result = subprocess.run(args, cwd=ROOT, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=timeout)
    if result.returncode:
        (state / 'failure.private.log').write_text(result.stdout + result.stderr)
        raise RuntimeError('Session qualification failed; inspect private evidence at ' + str(state))
    return result.stdout

try:
    hashes = {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in inputs}
    password = secrets.token_hex(32)
    (state / 'database.env').write_text('POSTGRES_PASSWORD=' + password + '\nPOSTGRES_DB=scoremap_session_qualification\n')
    call(['docker', 'run', '-d', '--rm', '--name', name, '--label', 'scoremap.sessionQualification=' + operation, '--env-file', str(state / 'database.env'), '--tmpfs', '/var/lib/postgresql', '--publish', '127.0.0.1::5432', 'postgres:18.3'])
    started = True
    address = call(['docker', 'port', name, '5432/tcp']).strip()
    if not address.startswith('127.0.0.1:'):
        raise RuntimeError('Disposable database is not loopback-only')
    selected_port = int(address.rsplit(':', 1)[1])
    for attempt in range(150):
        ready = subprocess.run(['docker', 'exec', name, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres', '-d', 'scoremap_session_qualification'], capture_output=True, timeout=5)
        if ready.returncode == 0:
            break
        time.sleep(0.2)
    else:
        raise RuntimeError('Disposable PostgreSQL did not become ready')
    call(['dotnet', 'restore', project, '--locked-mode'])
    env = {**os.environ, 'SCOREMAP_SESSION_PROBE_DATABASE': f'Host=127.0.0.1;Port={selected_port};Database=scoremap_session_qualification;Username=postgres;Password={password}'}
    output = call(['dotnet', 'run', '--project', project, '-c', 'Release', '--no-restore'], env=env)
    result = json.loads(output.splitlines()[-1])
    if not all(result[key] is True for key in ['storedSessionReconstructed', 'liveRenewalReconstructed', 'delayedRenewalCannotReviveLogout', 'expiredSessionCannotRenew', 'freshSessionIndependent', 'realDatabase']):
        raise RuntimeError('A required session-storage boundary failed')
    if hashes != {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in inputs}:
        raise RuntimeError('Session qualification inputs changed')
    (state / 'receipt.json').write_text(json.dumps({'inputsSha256': hashes, 'sourceState': 'checked working inputs; independent of browser identity and release acceptance', **result}, indent=2) + '\n')
    print(json.dumps(result))
finally:
    if started:
        info = json.loads(call(['docker', 'inspect', name]))[0]
        if info['Config']['Labels'].get('scoremap.sessionQualification') != operation:
            raise RuntimeError('Refusing cleanup of an unrelated database')
        call(['docker', 'rm', '-f', name])
