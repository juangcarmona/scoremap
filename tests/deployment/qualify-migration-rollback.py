"""Prove a synthetic PostgreSQL migration failure rolls back and can be retried."""
from pathlib import Path
import importlib.util
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('scoremap_qualifier', ROOT / 'scripts/qualify-production.py')
q = importlib.util.module_from_spec(spec)
spec.loader.exec_module(q)
settings = json.loads(Path(sys.argv[1]).read_text())
output = Path(sys.argv[2]).resolve()
if output.exists():
    raise RuntimeError('Select a new receipt path; do not overwrite previous evidence')
state = None
database = None
trigger_installed = False
try:
    state = q.setup(settings)
    details = json.loads((state / 'state.private.json').read_text())
    if details['actualOperatorDeployment'] or not details['syntheticOnly'] or not details['project'].startswith('scoremap-qualification-'):
        raise RuntimeError('Migration fault injection requires a disposable synthetic deployment')
    database = q.DisposableDatabase(state)
    q.execute_browser(state, 'migration-seed', 'playwright.migration.config.ts', 'seed:')
    before = database.fingerprints()
    database.pg('psql', '-v', 'ON_ERROR_STOP=1', '-U', 'scoremap', '-d', 'scoremap', '-c', "CREATE FUNCTION scoremap_test_fail_migration() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic migration fault'; END $$; CREATE TRIGGER scoremap_test_fail_migration BEFORE INSERT ON sm_migrations FOR EACH ROW EXECUTE FUNCTION scoremap_test_fail_migration()")
    trigger_installed = True
    q.execute_browser(state, 'migration-fault', 'playwright.migration.config.ts', 'fault:')
    after = database.fingerprints()
    changed = [name for name in before if name != 'sm_sessions' and before[name] != after.get(name)]
    if changed or set(before) != set(after):
        raise RuntimeError('The failed migration changed ScoreMap data other than authentication sessions')
    database.pg('psql', '-v', 'ON_ERROR_STOP=1', '-U', 'scoremap', '-d', 'scoremap', '-c', 'DROP TRIGGER scoremap_test_fail_migration ON sm_migrations; DROP FUNCTION scoremap_test_fail_migration()')
    trigger_installed = False
    q.execute_browser(state, 'migration-retry', 'playwright.migration.config.ts', 'retry:')
    source = details['verificationSource']
    if q.verification_source() != source:
        raise RuntimeError('Verification inputs changed during qualification')
    q.write(output, {'verificationSource': source, 'applicationRevision': settings['ApplicationRevision'], 'applicationImage': settings['ApplicationImage'], 'syntheticOnly': True, 'environment': 'disposable Production HTTPS, Keycloak and PostgreSQL', 'migrationInsertFaulted': True, 'scoremapTablesUnchangedExceptSessions': True, 'sameCommandRetriedOnce': True, 'legacyOriginalAndHistoryReconstructed': True, 'actualOperatorDeployment': False})
    print('Synthetic PostgreSQL migration failure rolled back; original and idempotent retry verified.', flush=True)
finally:
    if trigger_installed and database:
        database.pg('psql', '-v', 'ON_ERROR_STOP=1', '-U', 'scoremap', '-d', 'scoremap', '-c', 'DROP TRIGGER IF EXISTS scoremap_test_fail_migration ON sm_migrations; DROP FUNCTION IF EXISTS scoremap_test_fail_migration()')
    if q.ACTIVE_STATE is not None and (q.ACTIVE_STATE / 'state.private.json').exists():
        q.cleanup(q.ACTIVE_STATE)
