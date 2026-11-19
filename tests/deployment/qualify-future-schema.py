"""Exercise refusal of an unsupported PostgreSQL schema on synthetic data only."""
from pathlib import Path
import importlib.util
import json
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('scoremap_qualifier', ROOT / 'scripts/qualify-production.py')
q = importlib.util.module_from_spec(spec)
spec.loader.exec_module(q)
settings = json.loads(Path(sys.argv[1]).read_text())
output = Path(sys.argv[2]).resolve()
if output.exists():
    raise RuntimeError('Select a new receipt path; do not overwrite prior evidence')
state = None
try:
    state = q.setup(settings)
    database = q.DisposableDatabase(state)
    q.execute_browser(state, 'role-seed', 'playwright.connected.config.ts', 'song-scoped editor/viewer grants, revocation, versions and retry receipts')
    q.execute_browser(state, 'before', 'playwright.deployment.config.ts', 'before:')
    application = database.dc('ps', '-q', 'application').strip()
    if not application:
        raise RuntimeError('Disposable application was not found')
    original = database.fingerprints()
    version = database.pg('psql', '-U', 'scoremap', '-d', 'scoremap', '-Atc', 'SELECT version FROM sm_schema WHERE id=1').strip()
    if version not in ('1', '2'):
        raise RuntimeError('Fixture did not start with a supported schema')
    q.call(['docker', 'update', '--restart=no', application])
    q.call(['docker', 'stop', '-t', '20', application])
    database.pg('psql', '-v', 'ON_ERROR_STOP=1', '-U', 'scoremap', '-d', 'scoremap', '-c', 'UPDATE sm_schema SET version=999 WHERE id=1')
    unknown = database.fingerprints()
    if any(original[name] != unknown.get(name) for name in original if name != 'sm_schema'):
        raise RuntimeError('The fixture changed data other than the schema version')
    q.call(['docker', 'start', application])
    for _ in range(60):
        running = q.call(['docker', 'inspect', application, '--format', '{{.State.Running}}']).strip()
        if running == 'false':
            break
        time.sleep(0.5)
    else:
        raise RuntimeError('Application did not refuse the future schema')
    logs = subprocess.run(['docker', 'logs', application], capture_output=True, text=True, check=True)
    if 'Unsupported ScoreMap storage schema' not in logs.stdout + logs.stderr:
        raise RuntimeError('Application exited without the expected schema refusal')
    if database.fingerprints() != unknown:
        raise RuntimeError('Refusal modified the future-schema database')
    database.pg('psql', '-v', 'ON_ERROR_STOP=1', '-U', 'scoremap', '-d', 'scoremap', '-c', f'UPDATE sm_schema SET version={version} WHERE id=1')
    if database.fingerprints() != original:
        raise RuntimeError('Restoring the schema marker changed other stored data')
    q.call(['docker', 'start', application])
    database.ready()
    q.execute_browser(state, 'after-recovery', 'playwright.deployment.config.ts', 'after:')
    source = json.loads((state / 'state.private.json').read_text())['verificationSource']
    if q.verification_source() != source:
        raise RuntimeError('Verification inputs changed during qualification')
    receipt = {
        'verificationSource': source,
        'applicationRevision': settings['ApplicationRevision'],
        'applicationImage': settings['ApplicationImage'],
        'syntheticOnly': True,
        'environment': 'disposable Production HTTPS with real identity and PostgreSQL',
        'unsupportedSchemaRefused': True,
        'allTableFingerprintsUnchangedOnRefusal': True,
        'schemaMarkerRestoredWithoutOtherChanges': True,
        'authenticatedSyntheticDataReconstructed': True,
        'actualOperatorDeployment': False,
    }
    q.write(output, receipt)
    print('Future schema refused; table fingerprints and authenticated reconstruction verified.', flush=True)
finally:
    if q.ACTIVE_STATE is not None and (q.ACTIVE_STATE / 'state.private.json').exists():
        q.cleanup(q.ACTIVE_STATE)
