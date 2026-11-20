"""Qualify trusted and spoofed forwarding through isolated Production containers."""
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
import http.client
import importlib.util
import ipaddress
import json
import ssl
import subprocess
import sys
import uuid

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('scoremap_qualifier', ROOT / 'scripts/qualify-production.py')
q = importlib.util.module_from_spec(spec)
spec.loader.exec_module(q)
settings = json.loads(Path(sys.argv[1]).read_text())
output = Path(sys.argv[2]).resolve()
if output.exists():
    raise RuntimeError('Select a new receipt path; do not overwrite previous evidence')
state = None
attacker = None

def request(origin, headers, ca=None):
    url = urlsplit(origin)
    if url.scheme == 'https':
        connection = http.client.HTTPSConnection(url.hostname, url.port or 443, context=ssl.create_default_context(cafile=str(ca)), timeout=15)
    else:
        connection = http.client.HTTPConnection(url.hostname, url.port or 80, timeout=15)
    try:
        connection.request('GET', '/auth/login', headers=headers)
        response = connection.getresponse()
        values = response.getheaders()
        response.read()
        return response.status, values
    finally:
        connection.close()

def values(headers, name):
    return [value for key, value in headers if key.lower() == name.lower()]

def callback(headers):
    locations = values(headers, 'location')
    if len(locations) != 1:
        raise RuntimeError('Sign-in did not return one redirect')
    candidates = parse_qs(urlsplit(locations[0]).query).get('redirect_uri', [])
    if len(candidates) != 1:
        raise RuntimeError('The identity challenge did not contain one callback')
    return urlsplit(candidates[0])

try:
    state = q.setup(settings)
    data = json.loads((state / 'state.private.json').read_text())
    if data['actualOperatorDeployment'] or not data['syntheticOnly'] or not data['project'].startswith('scoremap-qualification-'):
        raise RuntimeError('Proxy qualification requires a disposable synthetic deployment')
    db = q.DisposableDatabase(state)
    application = db.dc('ps', '-q', 'application').strip()
    app_info = json.loads(q.call(['docker', 'inspect', application]))[0]
    networks = list(app_info['NetworkSettings']['Networks'])
    if len(networks) != 1:
        raise RuntimeError('Expected one isolated application network')
    config = json.loads((state / 'application.private.json').read_text())
    trusted_ip = ipaddress.ip_address(config['Ingress']['TrustedProxy'])
    nginx = state / 'untrusted-proxy.conf'
    nginx.write_text('events {}\nhttp { access_log off; server { listen 8080; location / { proxy_pass http://application:8080; proxy_set_header Host $http_host; proxy_set_header X-Forwarded-For $http_x_forwarded_for; proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto; proxy_set_header X-Forwarded-Host $http_x_forwarded_host; } } }\n')
    nginx.chmod(0o644)
    attacker = data['project'] + '-untrusted-' + uuid.uuid4().hex[:8]
    q.call(['docker', 'run', '-d', '--name', attacker, '--network', networks[0], '--label', 'scoremap.qualification=' + data['operation'], '-p', '127.0.0.1::8080', '-v', str(nginx) + ':/etc/nginx/nginx.conf:ro', 'nginx:1.30.6-alpine'])
    details = json.loads(q.call(['docker', 'inspect', attacker]))[0]
    actual_ip = ipaddress.ip_address(details['NetworkSettings']['Networks'][networks[0]]['IPAddress'])
    if actual_ip == trusted_ip or actual_ip.is_loopback:
        raise RuntimeError('The synthetic attacker is not a distinct untrusted peer')
    binding = details['NetworkSettings']['Ports']['8080/tcp']
    if len(binding) != 1 or binding[0]['HostIp'] != '127.0.0.1':
        raise RuntimeError('The synthetic attacker is not bound to loopback only')
    address = 'http://127.0.0.1:' + binding[0]['HostPort']

    status, trusted_headers = request(data['origin'], {}, state / 'ca.crt')
    expected = urlsplit(data['origin'])
    trusted_callback = callback(trusted_headers)
    if status != 302 or (trusted_callback.scheme, trusted_callback.netloc, trusted_callback.path) != ('https', expected.netloc, '/signin-oidc'):
        raise RuntimeError('Trusted TLS ingress did not produce the expected HTTPS callback')
    cookies = values(trusted_headers, 'set-cookie')
    correlation = [value.lower() for value in cookies if '.aspnetcore.correlation.' in value.lower() or '.aspnetcore.openidconnect.nonce.' in value.lower()]
    if len(correlation) < 2 or any('secure' not in value or 'httponly' not in value or 'samesite=lax' not in value for value in correlation):
        raise RuntimeError('Trusted authentication cookies lack expected attributes')

    source_host = 'untrusted-origin.scoremap.test'
    def forged(index):
        return {'Host': source_host, 'X-Forwarded-Proto': 'https', 'X-Forwarded-Host': 'forged-origin.scoremap.test', 'X-Forwarded-For': '198.51.100.' + str(index + 1)}
    status, untrusted_headers = request(address, forged(0))
    untrusted_callback = callback(untrusted_headers)
    if status != 302 or (untrusted_callback.scheme, untrusted_callback.netloc, untrusted_callback.path) != ('http', source_host, '/signin-oidc'):
        raise RuntimeError('Untrusted forwarding influenced the challenge origin')
    for index in range(1, 30):
        status, _ = request(address, forged(index))
        if status != 302:
            raise RuntimeError('The synthetic source was limited before the expected boundary')
    status, rejected_headers = request(address, forged(30))
    retry = values(rejected_headers, 'retry-after')
    if status != 429 or len(retry) != 1 or not retry[0].isdigit() or not 1 <= int(retry[0]) <= 60:
        raise RuntimeError('Forged client addresses bypassed the login rate limit')
    if q.verification_source() != data['verificationSource']:
        raise RuntimeError('Verification inputs changed during qualification')
    q.write(output, {'verificationSource': data['verificationSource'], 'applicationRevision': settings['ApplicationRevision'], 'applicationImage': settings['ApplicationImage'], 'syntheticOnly': True, 'environment': 'disposable Production HTTPS, Keycloak and PostgreSQL', 'trustedProxyProducedHttpsCallback': True, 'trustedAuthCookiesSecureHttpOnlySameSiteLax': True, 'untrustedPeerIgnoredForwardedProtoAndHost': True, 'forgedForwardedForCouldNotBypassLoginRateLimit': True, 'distinctUntrustedContainer': True, 'actualOperatorDeployment': False})
    print('Trusted and spoofed ingress behavior verified in disposable Production.', flush=True)
finally:
    try:
        if attacker:
            subprocess.run(['docker', 'rm', '-f', attacker], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    finally:
        if q.ACTIVE_STATE is not None and (q.ACTIVE_STATE / 'state.private.json').exists():
            q.cleanup(q.ACTIVE_STATE)
