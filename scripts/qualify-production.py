"""Disposable production-artifact qualification; never reads operator music or credentials."""
from pathlib import Path
import base64, datetime, hashlib, json, os, re, secrets, shutil, socket, subprocess, sys, tempfile, time, uuid
ROOT = Path(__file__).resolve().parents[1]
PRIVATE_LOG = None
ACTIVE_STATE = None
os.umask(0o077)

def call(args, *, env=None, input=None, binary=False, timeout=180):
    result = subprocess.run(args, cwd=ROOT, env=env, input=input, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=not binary, timeout=timeout)
    if result.returncode:
        if PRIVATE_LOG is not None:
            PRIVATE_LOG.write_bytes(result.stderr if binary else result.stderr.encode())
            PRIVATE_LOG.chmod(0o600)
        raise RuntimeError(f"{args[0]} {(args[1] if len(args) > 1 else '')} failed; inspect the private qualification logs")
    return result.stdout

def verification_source():
    revision = call(['git', 'rev-parse', 'HEAD']).strip()
    names = call(['git', 'ls-tree', '-r', '--name-only', revision, '--', 'src', 'tests', 'config/development-users.example.json', 'scripts/qualify-production.py', 'playwright.connected.config.ts', 'playwright.deployment.config.ts', 'package.json', 'package-lock.json', 'tsconfig.json']).splitlines()
    digests = {}
    for name in names:
        expected = call(['git', 'show', revision + ':' + name], binary=True)
        if (ROOT / name).read_bytes() != expected:
            raise RuntimeError('Qualification inputs must match committed source: ' + name)
        digests[name] = hashlib.sha256(expected).hexdigest()
    return {'revision': revision, 'filesSha256': digests}


def port():
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        value = listener.getsockname()[1]
        if not value not in (5280, 5380, 5381, 8180, 8280):
            raise RuntimeError('Qualification safety check failed: value not in (5280, 5380, 5381, 8180, 8280)')
        return value

def write(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n' if not isinstance(value, str) else value)
    path.chmod(0o600)

def qualify_offline_configuration(state, image, configuration, operation):
    refused = []
    for index, value in enumerate([-1, 481, "60", None, 1.5]):
        candidate = json.loads(json.dumps(configuration))
        candidate['Application']['PrivateOfflineMinutes'] = value
        path = state / ('invalid-offline-' + str(index) + '.private.json')
        write(path, candidate)
        result = subprocess.run(['docker', 'run', '--rm', '--network', 'none', '--read-only', '--tmpfs', '/tmp', '--user', str(os.getuid()) + ':' + str(os.getgid()), '--label', 'scoremap.qualification=' + operation, '--ulimit', 'core=0', '--env', 'ASPNETCORE_ENVIRONMENT=Production', '--mount', 'type=bind,source=' + str(path) + ',target=/run/scoremap/application.json,readonly', image], cwd=ROOT, capture_output=True, text=True, timeout=30)
        output = result.stdout + result.stderr
        write(state / ('invalid-offline-' + str(index) + '.private.txt'), output)
        if result.returncode == 0 or 'Application.PrivateOfflineMinutes must be an integer from 0 (disabled) through 480' not in output:
            raise RuntimeError('The actual application image did not refuse invalid offline configuration before database admission')
        refused.append({'value': value, 'refusedBeforeDatabaseAdmission': True, 'exitCode': result.returncode})
    write(state / 'offline-configuration-refusals.private.json', refused)

def setup(settings):
    verification = verification_source()
    required = {'SchemaVersion', 'ApplicationImage', 'ApplicationRevision', 'PublicationDirectory'}
    if not required.issubset(settings) or not set(settings).issubset(required | {'IdentityImage', 'ProxyImage'}) or settings['SchemaVersion'] != 1:
        raise RuntimeError('Use the documented synthetic production-qualification settings schema')
    if not re.fullmatch('[0-9a-f]{40}', settings['ApplicationRevision']):
        raise RuntimeError('Select a full qualified application source revision')
    for name in ['IdentityImage', 'ProxyImage']:
        if name in settings and not re.fullmatch('[A-Za-z0-9][A-Za-z0-9._/@:+-]+', settings[name]):
            raise RuntimeError('Select a valid native qualification image reference')
    image = settings['ApplicationImage']
    if not (image.startswith('sha256:') and len(image) == 71):
        raise RuntimeError("Qualification safety check failed: image.startswith('sha256:') and len(image) == 71")
    inspected = json.loads(call(['docker', 'image', 'inspect', image]))[0]
    if not inspected['Config']['Labels']['org.opencontainers.image.revision'] == settings['ApplicationRevision']:
        raise RuntimeError("Qualification safety check failed: inspected['Config']['Labels']['org.opencontainers.image.revision'] == settings['ApplicationRevision']")
    publication = Path(settings['PublicationDirectory']).resolve()
    receipt = json.loads((publication / 'publication-receipt.json').read_text())
    for name, digest in receipt['generatedFilesSha256'].items():
        if not (Path(name).name == name and hashlib.sha256((publication / name).read_bytes()).hexdigest() == digest):
            raise RuntimeError('Qualification safety check failed: Path(name).name == name and hashlib.sha256((publication / name).read_bytes()).hexdigest() == digest')
    template = ROOT / 'config/development-users.example.json'
    if not template.read_bytes() == subprocess.check_output(['git', 'show', 'HEAD:config/development-users.example.json'], cwd=ROOT):
        raise RuntimeError("Qualification safety check failed: template.read_bytes() == subprocess.check_output(['git', 'show', 'HEAD:config/development-users.example.json'], cwd=ROOT)")
    state = Path(tempfile.mkdtemp(prefix='scoremap-production-'))
    state.chmod(0o700)
    global ACTIVE_STATE
    ACTIVE_STATE = state
    global PRIVATE_LOG
    PRIVATE_LOG = state / 'last-command-error.private.txt'
    operation = uuid.uuid4().hex[:12]
    project = 'scoremap-qualification-' + operation
    origin_port, provider_port, http_port = (port(), port(), port())
    if not len({origin_port, provider_port, http_port}) == 3:
        raise RuntimeError('Qualification safety check failed: len({origin_port, provider_port, http_port}) == 3')
    origin = f'https://localhost:{origin_port}'
    realm = 'scoremap-qualification-' + operation
    authority = f'https://identity.scoremap.test:{provider_port}/realms/{realm}'
    database_password, client_secret = (secrets.token_urlsafe(36), secrets.token_urlsafe(36))
    write(state / 'database.password', database_password)
    provider = json.loads(template.read_text())
    old_client = provider['clients'][0]['clientId']
    client_id = 'scoremap-qualification'

    def replace(value):
        if isinstance(value, str):
            return value.replace(old_client, client_id)
        if isinstance(value, list):
            return [replace(item) for item in value]
        if isinstance(value, dict):
            return {key: replace(item) for key, item in value.items()}
        return value
    provider = replace(provider)
    provider['realm'] = realm
    provider['sslRequired'] = 'all'
    client = provider['clients'][0]
    client['secret'] = client_secret
    client['redirectUris'] = [origin + '/signin-oidc', origin + '/signout-callback-oidc']
    client['webOrigins'] = [origin]
    client.setdefault('attributes', {})['post.logout.redirect.uris'] = origin + '/*'
    for user in provider['users']:
        user['id'] = str(uuid.uuid4())
        user['credentials'] = [{'type': 'password', 'value': secrets.token_urlsafe(24), 'temporary': False}]
    write(state / 'users.private.json', provider)
    call(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '2', '-subj', '/CN=ScoreMap disposable qualification CA', '-keyout', str(state / 'ca.key'), '-out', str(state / 'ca.crt')])
    call(['openssl', 'req', '-newkey', 'rsa:2048', '-nodes', '-subj', '/CN=ScoreMap disposable qualification', '-keyout', str(state / 'tls.key'), '-out', str(state / 'tls.csr')])
    write(state / 'extensions.cnf', 'subjectAltName=DNS:localhost,DNS:identity.scoremap.test\nextendedKeyUsage=serverAuth\n')
    call(['openssl', 'x509', '-req', '-in', str(state / 'tls.csr'), '-CA', str(state / 'ca.crt'), '-CAkey', str(state / 'ca.key'), '-CAcreateserial', '-days', '2', '-extfile', str(state / 'extensions.cnf'), '-out', str(state / 'tls.crt')])
    for name in ['ca.key', 'tls.key']:
        (state / name).chmod(0o600)
    write(state / 'application.private.json', {})
    write(state / 'application.mount.json', {})
    (state / 'ca.crt').chmod(0o644)
    write(state / 'qualification.override.json', {'services': {'application': {'environment': {'SSL_CERT_FILE': '/run/scoremap/qualification-ca.crt'}, 'volumes': [{'type': 'bind', 'source': str(state / 'ca.crt'), 'target': '/run/scoremap/qualification-ca.crt', 'read_only': True}]}}})
    env = {**os.environ, 'SCOREMAP_IMAGE': image, 'SCOREMAP_APPLICATION_FILE': str(state / 'application.mount.json'), 'SCOREMAP_DATABASE_PASSWORD_FILE': str(state / 'database.password'), 'SCOREMAP_HTTP_PORT': str(http_port)}
    command = ['docker', 'compose', '-p', project, '-f', str(publication / 'docker-compose.yaml'), '-f', str(state / 'qualification.override.json')]

    def dc(*args):
        return call([*command, *args], env=env)

    def pg(*args, input=None, binary=False):
        return call(['docker', 'exec', '-i', database, 'sh', '-c', 'export PGPASSWORD="$(cat /run/secrets/database_password)"; exec "$@"', '--', *args], input=input, binary=binary)
    write(state / 'state.private.json', {'verificationSource': verification, 'operation': operation, 'project': project, 'image': image, 'applicationRevision': settings['ApplicationRevision'], 'publicationRevision': receipt['sourceRevision'], 'publicationDirectory': str(publication), 'origin': origin, 'providerPort': provider_port, 'httpPort': http_port, 'authority': authority, 'realm': realm, 'phase': 'creating', 'containersDeployed': True, 'actualOperatorDeployment': False, 'syntheticOnly': True})
    print('Disposable qualification state: ' + str(state), flush=True)
    dc('up', '-d', '--wait', '--wait-timeout', '120', 'database')
    database = dc('ps', '-q', 'database').strip()
    if not database:
        raise RuntimeError('Qualification safety check failed: database')
    for attempt in range(120):
        try:
            pg('pg_isready', '-U', 'scoremap', '-d', 'scoremap')
            break
        except RuntimeError:
            time.sleep(0.5)
    else:
        raise RuntimeError('Disposable PostgreSQL did not become ready')
    pg('createdb', '-U', 'scoremap', 'keycloak')
    network = project + '_aspire'
    label = json.loads(call(['docker', 'network', 'inspect', network]))[0]['Labels']
    if not label['com.docker.compose.project'] == project:
        raise RuntimeError("Qualification safety check failed: label['com.docker.compose.project'] == project")
    write(state / 'provider.env', f'KC_DB=postgres\nKC_DB_URL=jdbc:postgresql://database:5432/keycloak\nKC_DB_USERNAME=scoremap\nKC_DB_PASSWORD={database_password}\nKC_HOSTNAME=https://identity.scoremap.test:{provider_port}\nKC_HTTPS_PORT={provider_port}\nKC_HTTP_ENABLED=false\n')
    identity_name = project + '-identity'
    proxy_name = project + '-proxy'
    identity_image = settings.get('IdentityImage', 'quay.io/keycloak/keycloak:26.8.1')
    proxy_image = settings.get('ProxyImage', 'nginx:1.30.6-alpine')

    def readable_copy(source, target, reader_image):
        group = call(['docker', 'run', '--rm', '--label', 'scoremap.qualification=' + operation, '--entrypoint', 'id', reader_image, '-g']).strip()
        if not group.isdigit():
            raise RuntimeError('Qualification safety check failed: group.isdigit()')
        shutil.copyfile(source, target)
        target.chmod(0o600)
        call(['docker', 'run', '--rm', '--label', 'scoremap.qualification=' + operation, '--user', '0', '--entrypoint', '/bin/sh', '--mount', f'type=bind,source={target},target=/input', image, '-c', 'chgrp "$1" /input && chmod 640 /input', '--', group])
    readable_copy(state / 'users.private.json', state / 'users.mount.json', identity_image)
    readable_copy(state / 'tls.key', state / 'tls.mount.key', identity_image)
    call(['docker', 'run', '-d', '--name', identity_name, '--label', 'scoremap.qualification=' + operation, '--network', network, '--network-alias', 'identity.scoremap.test', '--env-file', str(state / 'provider.env'), '--publish', f'127.0.0.1:{provider_port}:{provider_port}', '--ulimit', 'core=0', '--mount', f'type=bind,source={state}/tls.crt,target=/run/qualification/tls.crt,readonly', '--mount', f'type=bind,source={state}/tls.mount.key,target=/run/qualification/tls.key,readonly', '--mount', f'type=bind,source={state}/users.mount.json,target=/opt/keycloak/data/import/{realm}-realm.json,readonly', identity_image, 'start', '--import-realm', '--https-certificate-file=/run/qualification/tls.crt', '--https-certificate-key-file=/run/qualification/tls.key'])
    nginx = 'events {}\nhttp { access_log off; resolver 127.0.0.11 valid=5s; server { listen 443 ssl; ssl_certificate /run/qualification/tls.crt; ssl_certificate_key /run/qualification/tls.key; location / { set $application http://application:8080; proxy_pass $application; proxy_set_header Host $http_host; proxy_set_header X-Forwarded-Proto https; proxy_set_header X-Forwarded-Host $http_host; proxy_set_header X-Forwarded-For $remote_addr; proxy_redirect off; client_max_body_size 64m; } } }\n'
    write(state / 'nginx.conf', nginx)
    call(['docker', 'run', '-d', '--name', proxy_name, '--label', 'scoremap.qualification=' + operation, '--network', network, '--publish', f'127.0.0.1:{origin_port}:443', '--ulimit', 'core=0', '--mount', f'type=bind,source={state}/nginx.conf,target=/etc/nginx/nginx.conf,readonly', '--mount', f'type=bind,source={state}/tls.crt,target=/run/qualification/tls.crt,readonly', '--mount', f'type=bind,source={state}/tls.mount.key,target=/run/qualification/tls.key,readonly', proxy_image])
    proxy = json.loads(call(['docker', 'inspect', proxy_name]))[0]
    trusted = proxy['NetworkSettings']['Networks'][network]['IPAddress']
    if not trusted:
        raise RuntimeError('Qualification safety check failed: trusted')
    configuration = {'SchemaVersion': 1, 'Environment': 'Production', 'InstanceId': 'qualification-' + operation, 'Application': {'PublicOrigin': origin, 'WebRoot': '/app/wwwroot', 'ProductionQualified': True, 'PrivateOfflineMinutes': 1}, 'Identity': {'Authority': authority, 'ClientId': client_id, 'ClientSecret': client_secret, 'DevelopmentFixture': False}, 'Storage': {'ConnectionString': f'Host=database;Port=5432;Database=scoremap;Username=scoremap;Password={database_password}', 'KeysPath': '/var/lib/scoremap/keys'}, 'Ingress': {'TrustedProxy': trusted}}
    write(state / 'application.private.json', configuration)
    qualify_offline_configuration(state, image, configuration, operation)
    readable_copy(state / 'application.private.json', state / 'application.mount.json', image)
    curl = ['curl', '--noproxy', 'localhost,identity.scoremap.test', '--silent', '--show-error', '--fail', '--max-time', '3', '--cacert', str(state / 'ca.crt')]
    for attempt in range(180):
        if call(['docker', 'inspect', identity_name, '--format', '{{.State.Running}}']).strip() != 'true':
            raise RuntimeError('Disposable identity exited; inspect its private container logs')
        try:
            discovery = json.loads(call([*curl, '--resolve', f'identity.scoremap.test:{provider_port}:127.0.0.1', authority + '/.well-known/openid-configuration'], timeout=5))
            if not discovery['issuer'] == authority:
                raise RuntimeError("Qualification safety check failed: discovery['issuer'] == authority")
            break
        except (RuntimeError, subprocess.TimeoutExpired):
            time.sleep(1)
    else:
        raise RuntimeError('Disposable HTTPS identity did not become ready')
    dc('up', '-d', 'application')
    for attempt in range(120):
        try:
            call([*curl, origin + '/health/ready'], timeout=5)
            break
        except (RuntimeError, subprocess.TimeoutExpired):
            time.sleep(0.5)
    else:
        raise RuntimeError('Disposable Production application did not become ready')
    data = json.loads((state / 'state.private.json').read_text())
    data['phase'] = 'ready'
    data['tlsVerifiedByExplicitTestCA'] = True
    data['database'] = database
    data['identity'] = identity_name
    data['proxy'] = proxy_name
    write(state / 'state.private.json', data)
    print('Disposable Production application and native HTTPS identity ready; no operator data used.', flush=True)
    return state

def execute_browser(state, phase, config, grep=None):
    data = json.loads((state / 'state.private.json').read_text())
    report = state / 'runs' / (phase + '-' + uuid.uuid4().hex[:8])
    report.mkdir(parents=True, mode=0o700)
    node = shutil.which('node')
    if not (node and int(call([node, '--version']).strip().lstrip('v').split('.')[0]) >= 24):
        raise RuntimeError("Qualification safety check failed: node and int(call([node, '--version']).strip().lstrip('v').split('.')[0]) >= 24")
    public_key = call(['openssl', 'x509', '-in', str(state / 'tls.crt'), '-pubkey', '-noout'])
    der = call(['openssl', 'pkey', '-pubin', '-outform', 'DER'], input=public_key.encode(), binary=True)
    pin = base64.b64encode(hashlib.sha256(der).digest()).decode()
    env = {**os.environ, 'NODE_EXTRA_CA_CERTS': str(state / 'ca.crt'), 'SCOREMAP_QUALIFICATION_SPKI': pin, 'SCOREMAP_TEST_REPORT_DIRECTORY': str(report), 'SCOREMAP_DEPLOYMENT_STATE': str(state), 'SCOREMAP_DEPLOYMENT_PHASE': phase, 'SCOREMAP_TEST_ORIGIN': data['origin'], 'SCOREMAP_TEST_USERS': str(state / 'users.private.json'), 'SCOREMAP_QUALIFICATION_TLS': '1'}
    args = [node, str(ROOT / 'node_modules/@playwright/test/cli.js'), 'test', '--config=' + config]
    if grep:
        args += ['--grep', grep]
    with (report / 'execution.private.log').open('w') as log:
        result = subprocess.run(args, cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
    write(state / (phase + '-last-run.private.json'), {'directory': str(report), 'exitCode': result.returncode})
    if result.returncode:
        raise RuntimeError('Disposable ' + phase + ' browser qualification failed; inspect its private log')
    completed = json.loads((report / 'results.json').read_text())
    expected = 48 if config == 'playwright.connected.config.ts' and (not grep) else 3 if phase == 'tls-targeted' else 1
    if not (completed['stats']['expected'] == expected and completed['stats']['unexpected'] == 0 and (completed['stats']['skipped'] == 0)):
        raise RuntimeError("Qualification safety check failed: completed['stats']['expected'] == expected and completed['stats']['unexpected'] == 0 and (completed['stats']['skipped'] == 0)")

class DisposableDatabase:

    def __init__(self, state, restore=False):
        global PRIVATE_LOG
        PRIVATE_LOG = state / 'last-command-error.private.txt'
        self.state = state
        self.data = json.loads((state / 'state.private.json').read_text())
        if not (self.data['syntheticOnly'] and self.data['project'].startswith('scoremap-qualification-')):
            raise RuntimeError("Qualification safety check failed: self.data['syntheticOnly'] and self.data['project'].startswith('scoremap-qualification-')")
        self.env = {**os.environ, 'SCOREMAP_IMAGE': self.data['image'], 'SCOREMAP_APPLICATION_FILE': str(state / 'application.mount.json'), 'SCOREMAP_DATABASE_PASSWORD_FILE': str(state / 'database.password'), 'SCOREMAP_HTTP_PORT': str(self.data['httpPort'])}
        self.command = ['docker', 'compose', '-p', self.data['project'], '-f', str(Path(self.data['publicationDirectory']) / 'docker-compose.yaml'), '-f', str(state / 'qualification.override.json')]
        if restore:
            self.command += ['-f', str(state / 'restore.override.json')]

    def dc(self, *args):
        return call([*self.command, *args], env=self.env)

    def pgargs(self, *args):
        database = self.dc('ps', '-q', 'database').strip()
        if not database:
            raise RuntimeError('Qualification safety check failed: database')
        label = call(['docker', 'inspect', database, '--format', '{{index .Config.Labels "com.docker.compose.project"}}']).strip()
        if not label == self.data['project']:
            raise RuntimeError("Qualification safety check failed: label == self.data['project']")
        return ['docker', 'exec', '-i', database, 'sh', '-c', 'export PGPASSWORD="$(cat /run/secrets/database_password)"; exec "$@"', '--', *args]

    def pg(self, *args, input=None):
        return call(self.pgargs(*args), input=input)

    def dump(self, database, path):
        with path.open('wb') as output:
            result = subprocess.run(self.pgargs('pg_dump', '--no-password', '-U', 'scoremap', '-d', database, '-Fc'), stdout=output, stderr=subprocess.PIPE)
        path.chmod(0o600)
        if result.returncode:
            raise RuntimeError('Disposable database backup failed')

    def load(self, database, path):
        with path.open('rb') as source:
            result = subprocess.run(self.pgargs('pg_restore', '--no-owner', '-U', 'scoremap', '-d', database), stdin=source, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode:
            (self.state / 'restore-error.private.txt').write_bytes(result.stderr)
            raise RuntimeError('Disposable database restore failed; inspect its private error')

    def fingerprints(self):
        tables = self.pg('psql', '-U', 'scoremap', '-d', 'scoremap', '-Atc', "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'sm_%' ORDER BY tablename").splitlines()
        result = {}
        for table in tables:
            if not re.fullmatch('sm_[a-z0-9_]+', table):
                raise RuntimeError("Qualification safety check failed: re.fullmatch('sm_[a-z0-9_]+', table)")
            result[table] = self.pg('psql', '-U', 'scoremap', '-d', 'scoremap', '-Atc', f"SELECT md5(COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text)::text,'[]')) FROM {table} t").strip()
        return result

    def ready(self):
        for attempt in range(120):
            try:
                call(['curl', '--noproxy', 'localhost', '--silent', '--show-error', '--fail', '--max-time', '3', '--cacert', str(self.state / 'ca.crt'), self.data['origin'] + '/health/ready'], timeout=5)
                return
            except (RuntimeError, subprocess.TimeoutExpired):
                time.sleep(0.5)
        raise RuntimeError('Disposable application did not become ready')

def identity_ready(state):
    data = json.loads((state / 'state.private.json').read_text())
    args = ['curl', '--noproxy', 'identity.scoremap.test', '--silent', '--show-error', '--fail', '--max-time', '3', '--cacert', str(state / 'ca.crt'), '--resolve', f"identity.scoremap.test:{data['providerPort']}:127.0.0.1", data['authority'] + '/.well-known/openid-configuration']
    for attempt in range(120):
        try:
            discovery = json.loads(call(args, timeout=5))
            if discovery['issuer'] == data['authority']:
                return
        except (RuntimeError, subprocess.TimeoutExpired):
            time.sleep(0.5)
    raise RuntimeError('Restored native identity is not ready; keep application closed')

def restore(state):
    source = DisposableDatabase(state)
    data = source.data
    if not data['phase'] == 'restart-qualified':
        raise RuntimeError("Qualification safety check failed: data['phase'] == 'restart-qualified'")
    source.dc('stop', 'application')
    if not call(['docker', 'inspect', data['identity'], '--format', '{{index .Config.Labels "scoremap.qualification"}}']).strip() == data['operation']:
        raise RuntimeError('Qualification safety check failed: call([\'docker\', \'inspect\', data[\'identity\'], \'--format\', \'{{index .Config.Labels "scoremap.qualification"}}\']).strip() == data[\'operation\']')
    call(['docker', 'stop', data['identity']])
    backup = state / 'backup'
    backup.mkdir(mode=0o700)
    fresh = source.fingerprints()
    write(backup / 'current-fence.private.json', fresh)
    source.dump('scoremap', backup / 'application.dump')
    source.dump('keycloak', backup / 'identity.dump')
    application = source.dc('ps', '-aq', 'application').strip()
    if not application:
        raise RuntimeError('Qualification safety check failed: application')
    call(['docker', 'cp', application + ':/var/lib/scoremap/keys', str(backup / 'keys')])
    keys = list((backup / 'keys').glob('*.xml'))
    if not keys:
        raise RuntimeError('Qualification safety check failed: keys')
    original_key_hashes = {key.name: hashlib.sha256(key.read_bytes()).hexdigest() for key in keys}
    write(state / 'restore.override.json', {'services': {'database': {'volumes': [{'type': 'volume', 'source': 'restore-database', 'target': '/var/lib/postgresql'}]}, 'application': {'volumes': [{'type': 'volume', 'source': 'restore-session-keys', 'target': '/var/lib/scoremap/keys'}]}}, 'volumes': {'restore-database': {}, 'restore-session-keys': {}}})
    data['phase'] = 'restoring'
    data['backupDirectory'] = str(backup)
    write(state / 'state.private.json', data)
    target = DisposableDatabase(state, True)
    target.dc('up', '-d', '--force-recreate', '--wait', '--wait-timeout', '120', 'database')
    target.load('scoremap', state / 'older.application.dump')
    stale = target.fingerprints()
    purged_id = json.loads((state / 'expected.private.json').read_text())['purged']['id']
    count = target.pg('psql', '-U', 'scoremap', '-d', 'scoremap', '-At', '-v', 'song=' + purged_id, input="SELECT count(*) FROM sm_songs WHERE id=:'song' AND NOT deleted AND NOT purged AND content IS NOT NULL;\n").strip()
    if count != '1':
        raise RuntimeError('The actual older backup must contain the now-purged song as active')
    if not stale != fresh:
        raise RuntimeError('Qualification safety check failed: stale != fresh')
    if not json.loads(call(['docker', 'inspect', application]))[0]['State']['Running'] is False:
        raise RuntimeError("Qualification safety check failed: json.loads(call(['docker', 'inspect', application]))[0]['State']['Running'] is False")
    write(state / 'outdated-backup-refusal.private.json', {'applicationStillClosed': True, 'actualOlderSnapshotRejectedAgainstCurrentFence': True, 'olderSnapshotContainedNowPurgedSong': True})
    target.pg('dropdb', '--force', '-U', 'scoremap', 'scoremap')
    target.pg('createdb', '-U', 'scoremap', 'scoremap')
    target.load('scoremap', backup / 'application.dump')
    target.pg('createdb', '-U', 'scoremap', 'keycloak')
    target.load('keycloak', backup / 'identity.dump')
    if not target.fingerprints() == fresh:
        raise RuntimeError('Restored content or current authorization/purge state differs; do not open')
    target.dc('create', 'application')
    application = target.dc('ps', '-aq', 'application').strip()
    if not application:
        raise RuntimeError('Qualification safety check failed: application')
    info = json.loads(call(['docker', 'inspect', application]))[0]
    key_volume = next((mount['Name'] for mount in info['Mounts'] if mount['Destination'] == '/var/lib/scoremap/keys'))
    labels = json.loads(call(['docker', 'volume', 'inspect', key_volume]))[0]['Labels']
    if not labels['com.docker.compose.project'] == data['project']:
        raise RuntimeError("Qualification safety check failed: labels['com.docker.compose.project'] == data['project']")
    group = call(['docker', 'run', '--rm', '--label', 'scoremap.qualification=' + data['operation'], '--entrypoint', 'id', data['image'], '-g']).strip()
    if not group.isdigit():
        raise RuntimeError('Qualification safety check failed: group.isdigit()')
    user = call(['docker', 'run', '--rm', '--label', 'scoremap.qualification=' + data['operation'], '--entrypoint', 'id', data['image'], '-u']).strip()
    if not (user.isdigit() and user != '0'):
        raise RuntimeError("Qualification safety check failed: user.isdigit() and user != '0'")
    call(['docker', 'run', '--rm', '--label', 'scoremap.qualification=' + data['operation'], '--user', '0', '--entrypoint', '/bin/sh', '--mount', f'type=bind,source={backup}/keys,target=/source,readonly', '--mount', f'type=volume,source={key_volume},target=/target', data['image'], '-c', 'cp -a /source/. /target/ && chown -R "$1:$2" /target && chmod 700 /target', '--', user, group])
    restored_keys = state / 'restored-keys'
    call(['docker', 'cp', application + ':/var/lib/scoremap/keys', str(restored_keys)])
    if not {key.name: hashlib.sha256(key.read_bytes()).hexdigest() for key in restored_keys.glob('*.xml')} == original_key_hashes:
        raise RuntimeError("Qualification safety check failed: {key.name: hashlib.sha256(key.read_bytes()).hexdigest() for key in restored_keys.glob('*.xml')} == original_key_hashes")
    call(['docker', 'start', data['identity']])
    identity_ready(state)
    target.dc('up', '-d', 'application')
    target.ready()
    execute_browser(state, 'after-restore', 'playwright.deployment.config.ts', 'after:')
    data['phase'] = 'restore-qualified'
    data['originalAndRestoredAllTableFingerprintsMatchBeforeOpening'] = True
    data['dataProtectionKeyBytesMatch'] = True
    data['actualOlderBackupRefusedBeforeOpening'] = True
    write(state / 'state.private.json', data)
    print('Fresh database/key restore and existing-session complete reconstruction passed; an actual outdated snapshot was refused before opening.', flush=True)

def runtime(state):
    data = json.loads((state / 'state.private.json').read_text())
    if not (data['syntheticOnly'] and data['project'].startswith('scoremap-qualification-') and (data['phase'] == 'ready')):
        raise RuntimeError("Qualification safety check failed: data['syntheticOnly'] and data['project'].startswith('scoremap-qualification-') and (data['phase'] == 'ready')")
    env = {**os.environ, 'SCOREMAP_IMAGE': data['image'], 'SCOREMAP_APPLICATION_FILE': str(state / 'application.mount.json'), 'SCOREMAP_DATABASE_PASSWORD_FILE': str(state / 'database.password'), 'SCOREMAP_HTTP_PORT': str(data['httpPort'])}
    command = ['docker', 'compose', '-p', data['project'], '-f', str(Path(data['publicationDirectory']) / 'docker-compose.yaml'), '-f', str(state / 'qualification.override.json')]

    def dc(*args):
        return call([*command, *args], env=env)
    execute_browser(state, 'connected', 'playwright.connected.config.ts')
    database = DisposableDatabase(state)
    database.dc('stop', 'application')
    database.dump('scoremap', state / 'older.application.dump')
    database.dc('up', '-d', 'application')
    database.ready()
    execute_browser(state, 'before', 'playwright.deployment.config.ts', 'before:')
    dc('restart', 'application')
    for attempt in range(120):
        try:
            call(['curl', '--noproxy', 'localhost', '--silent', '--show-error', '--fail', '--max-time', '3', '--cacert', str(state / 'ca.crt'), data['origin'] + '/health/ready'], timeout=5)
            break
        except (RuntimeError, subprocess.TimeoutExpired):
            time.sleep(0.5)
    else:
        raise RuntimeError('Restarted disposable application did not become ready')
    execute_browser(state, 'after-restart', 'playwright.deployment.config.ts', 'after:')
    data['phase'] = 'restart-qualified'
    write(state / 'state.private.json', data)
    print('Production real-login journeys and complete-content/session/key restart passed; restore qualification remains open.', flush=True)

def smoke(state):
    data = json.loads((state / 'state.private.json').read_text())
    if not (data['phase'] == 'ready' and (state / 'older.application.dump').exists()):
        raise RuntimeError("Qualification safety check failed: data['phase'] == 'ready' and (state / 'older.application.dump').exists()")
    previous = json.loads((state / 'connected-last-run.private.json').read_text())
    if not previous['exitCode'] == 0:
        raise RuntimeError("Qualification safety check failed: previous['exitCode'] == 0")
    report = json.loads((Path(previous['directory']) / 'results.json').read_text())
    if not (report['stats']['expected'] == 48 and report['stats']['unexpected'] == 0):
        raise RuntimeError("Qualification safety check failed: report['stats']['expected'] == 48 and report['stats']['unexpected'] == 0")
    execute_browser(state, 'before', 'playwright.deployment.config.ts', 'before:')
    database = DisposableDatabase(state)
    database.dc('restart', 'application')
    database.ready()
    execute_browser(state, 'after-restart', 'playwright.deployment.config.ts', 'after:')
    data['phase'] = 'restart-qualified'
    write(state / 'state.private.json', data)
    print('Production complete content and real session survived application restart.', flush=True)

def restart_existing(state):
    data = json.loads((state / 'state.private.json').read_text())
    if not data['phase'] == 'ready':
        raise RuntimeError("Qualification safety check failed: data['phase'] == 'ready'")
    completed = json.loads((state / 'before-last-run.private.json').read_text())
    if not completed['exitCode'] == 0:
        raise RuntimeError("Qualification safety check failed: completed['exitCode'] == 0")
    report = json.loads((Path(completed['directory']) / 'results.json').read_text())
    if not (report['stats']['expected'] == 1 and report['stats']['unexpected'] == 0):
        raise RuntimeError("Qualification safety check failed: report['stats']['expected'] == 1 and report['stats']['unexpected'] == 0")
    database = DisposableDatabase(state)
    database.dc('restart', 'application')
    database.ready()
    execute_browser(state, 'after-restart', 'playwright.deployment.config.ts', 'after:')
    data['phase'] = 'restart-qualified'
    write(state / 'state.private.json', data)
    print('Real Production session and complete music/personal resources survived application restart.', flush=True)

def resume_fresh_restore(state):
    target = DisposableDatabase(state, True)
    data = target.data
    if data['phase'] != 'restoring':
        raise RuntimeError('Only the interrupted execution-owned restore can resume')
    backup = Path(data['backupDirectory'])
    if backup != state / 'backup':
        raise RuntimeError('Use the original private backup of this qualification')
    target.dc('stop', 'application')
    if call(['docker', 'inspect', data['identity'], '--format', '{{index .Config.Labels "scoremap.qualification"}}']).strip() != data['operation']:
        raise RuntimeError('Identity ownership mismatch')
    call(['docker', 'stop', data['identity']])
    for database, filename in [('scoremap', 'application.dump'), ('keycloak', 'identity.dump')]:
        target.pg('dropdb', '--force', '-U', 'scoremap', database)
        target.pg('createdb', '-U', 'scoremap', database)
        target.load(database, backup / filename)
    if target.fingerprints() != json.loads((backup / 'current-fence.private.json').read_text()):
        raise RuntimeError('The original trusted backup fence differs; keep application closed')
    call(['docker', 'start', data['identity']])
    identity_ready(state)
    target.dc('up', '-d', 'application')
    target.ready()
    execute_browser(state, 'after-restore', 'playwright.deployment.config.ts', 'after:')
    data['phase'] = 'restore-qualified'
    data['originalAndRestoredAllTableFingerprintsMatchBeforeOpening'] = True
    data['dataProtectionKeyBytesMatch'] = True
    data['actualOlderBackupRefusedBeforeOpening'] = True
    write(state / 'state.private.json', data)
    print('Fresh private database/key restoration and real session reconstruction passed after both identity and application readiness.', flush=True)

def evidence(state):
    data = json.loads((state / 'state.private.json').read_text())
    if data['phase'] != 'restore-qualified':
        raise RuntimeError('Only completed disposable qualification can receive a passing receipt')
    if verification_source() != data['verificationSource']:
        raise RuntimeError('Verification inputs changed during qualification')
    database = DisposableDatabase(state, True)
    application = database.dc('ps', '-q', 'application').strip()
    copy = state / ('verified-keys-' + uuid.uuid4().hex[:8])
    call(['docker', 'cp', application + ':/var/lib/scoremap/keys', str(copy)])
    expected = {key.name: hashlib.sha256(key.read_bytes()).hexdigest() for key in (state / 'backup/keys').glob('*.xml')}
    actual = {key.name: hashlib.sha256(key.read_bytes()).hexdigest() for key in copy.glob('*.xml')}
    if not expected or actual != expected:
        raise RuntimeError('Restored keyring differs; do not attest successful recovery')
    phases = {}
    for phase in ['connected', 'before', 'after-restart', 'after-restore']:
        run = json.loads((state / (phase + '-last-run.private.json')).read_text())
        if run['exitCode'] != 0:
            raise RuntimeError('A required phase failed')
        report = Path(run['directory']) / 'results.json'
        stats = json.loads(report.read_text())['stats']
        if stats['unexpected'] or stats['skipped']:
            raise RuntimeError('A required phase failed or was skipped')
        phases[phase] = {'passed': stats['expected'], 'reportSha256': hashlib.sha256(report.read_bytes()).hexdigest()}
    result = {'verificationSource': data['verificationSource'], 'applicationRevision': data['applicationRevision'], 'applicationImage': data['image'], 'publicationRevision': data['publicationRevision'], 'environment': 'Production', 'syntheticOnly': True, 'offlineConfigurationRefusals': json.loads((state / 'offline-configuration-refusals.private.json').read_text()), 'phases': phases, 'allRestoredTableFieldsAndKeysMatchBeforeOpening': True, 'actualOutdatedBackupRefusedBeforeOpening': True, 'secureHttpOnlySessionSurvivedApplicationRestartAndRestore': True, 'purgedIdentityNotRevived': True, 'browserTestCertificate': 'explicit synthetic leaf SPKI only; Node/curl/BFF trust the test CA', 'securityAndIndependentReview': 'separate required gates', 'actualOperatorDeployment': False, 'physicalDeviceAcceptance': False}
    write(state / 'qualification-receipt.private.json', result)
    print(json.dumps({'environment': 'Production', 'connectedPassed': phases['connected']['passed'], 'restartAndRestorePassed': True, 'outdatedBackupRefused': True, 'actualOperatorDeployment': False}), flush=True)

def cleanup(state):
    data = json.loads((state / 'state.private.json').read_text())
    if not (data['syntheticOnly'] and data['project'].startswith('scoremap-qualification-')):
        raise RuntimeError("Qualification safety check failed: data['syntheticOnly'] and data['project'].startswith('scoremap-qualification-')")
    if not state.stat().st_uid == os.getuid():
        raise RuntimeError('Qualification safety check failed: state.stat().st_uid == os.getuid()')
    for suffix in ['identity', 'proxy']:
        name = data['project'] + '-' + suffix
        found = subprocess.run(['docker', 'inspect', name], capture_output=True, text=True)
        if found.returncode == 0:
            info = json.loads(found.stdout)[0]
            if not info['Config']['Labels']['scoremap.qualification'] == data['operation']:
                raise RuntimeError("Qualification safety check failed: info['Config']['Labels']['scoremap.qualification'] == data['operation']")
            call(['docker', 'rm', '-f', name])
    database = DisposableDatabase(state, (state / 'restore.override.json').exists())
    ids = call(['docker', 'ps', '-aq', '--filter', 'label=com.docker.compose.project=' + data['project']]).split()
    for identifier in ids:
        info = json.loads(call(['docker', 'inspect', identifier]))[0]
        if not info['Config']['Labels']['com.docker.compose.project'] == data['project']:
            raise RuntimeError("Qualification safety check failed: info['Config']['Labels']['com.docker.compose.project'] == data['project']")
    database.dc('down', '--volumes', '--remove-orphans')
    data['resourcesRemoved'] = True
    write(state / 'state.private.json', data)
    print('Execution-owned synthetic resources removed; private evidence retained.', flush=True)
if __name__ == '__main__':
    if sys.argv[1] == '--targeted':
        execute_browser(Path(sys.argv[2]).resolve(), 'tls-targeted', 'playwright.connected.config.ts', 'SB-NAVIGATION|a saved import whose fresh|account notation persists')
    elif sys.argv[1] == '--restart-existing':
        restart_existing(Path(sys.argv[2]).resolve())
    elif sys.argv[1] == '--smoke':
        smoke(Path(sys.argv[2]).resolve())
    elif sys.argv[1] == '--resume-fresh-restore':
        resume_fresh_restore(Path(sys.argv[2]).resolve())
    elif sys.argv[1] == '--evidence':
        evidence(Path(sys.argv[2]).resolve())
    elif sys.argv[1] == '--cleanup':
        cleanup(Path(sys.argv[2]).resolve())
    elif sys.argv[1] == '--restore':
        restore(Path(sys.argv[2]).resolve())
    elif sys.argv[1] == '--continue':
        runtime(Path(sys.argv[2]).resolve())
    else:
        settings = json.loads(Path(sys.argv[1]).read_text())
        try:
            state = setup(settings)
            runtime(state)
            restore(state)
            evidence(state)
        finally:
            if ACTIVE_STATE is not None and (ACTIVE_STATE / 'state.private.json').exists():
                cleanup(ACTIVE_STATE)
