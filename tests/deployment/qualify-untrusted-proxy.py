"""Qualify trusted and spoofed forwarding through isolated Production containers."""
from pathlib import Path
from urllib.parse import urlsplit
import http.client
import importlib.util
import ipaddress
import json
import ssl
import subprocess
import sys
import time
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

def request(origin, headers, ca=None, path='/auth/login'):
    url = urlsplit(origin)
    if url.scheme == 'https':
        context = ssl.create_default_context(cafile=str(ca))
        # The existing synthetic CA predates Python 3.14's strict key-usage default.
        # Keep certificate chain and hostname verification enabled.
        context.verify_flags &= ~ssl.VERIFY_X509_STRICT
        connection = http.client.HTTPSConnection(url.hostname, url.port or 443, context=context, timeout=15)
    else:
        connection = http.client.HTTPConnection(url.hostname, url.port or 80, timeout=15)
    try:
        connection.request('GET', path, headers=headers)
        response = connection.getresponse()
        values = response.getheaders()
        response.read()
        return response.status, values
    finally:
        connection.close()

def values(headers, name):
    return [value for key, value in headers if key.lower() == name.lower()]

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
    if status != 302 or len(values(trusted_headers, 'location')) != 1:
        raise RuntimeError('Trusted TLS ingress did not produce an identity challenge')
    cookies = values(trusted_headers, 'set-cookie')
    correlation = [value.lower() for value in cookies if '.aspnetcore.correlation.' in value.lower() or '.aspnetcore.openidconnect.nonce.' in value.lower()]
    if len(correlation) < 2 or any('secure' not in value or 'httponly' not in value or 'samesite=lax' not in value for value in correlation):
        raise RuntimeError('Trusted authentication cookies lack expected attributes')

    # Model a trusted ingress that passes through an attacker-supplied host header.
    # Keycloak validates the PAR callback before presenting the login form; using
    # a forged ordinary Host as a negative control proves this check is sensitive.
    proxy_config = state / 'nginx.conf'
    proxy_text = proxy_config.read_text()
    expected = 'proxy_set_header X-Forwarded-Host $http_host;'
    if proxy_text.count(expected) != 1:
        raise RuntimeError('Unexpected synthetic trusted proxy configuration')
    proxy_config.write_text(proxy_text.replace(expected, 'proxy_set_header X-Forwarded-Host $http_x_forwarded_host; add_header X-Qualification-Forwarded-Host $http_x_forwarded_host always;'))
    q.call(['docker', 'exec', data['project'] + '-proxy', 'nginx', '-s', 'reload'])

    probe = 'forged-origin.scoremap.test'
    for _ in range(50):
        status, proxy_headers = request(data['origin'], {'X-Forwarded-Host': probe}, state / 'ca.crt', '/health/ready')
        if status == 200 and values(proxy_headers, 'x-qualification-forwarded-host') == [probe]:
            break
        time.sleep(0.1)
    else:
        raise RuntimeError('Synthetic trusted proxy did not forward the test header')

    def accepted_callback(headers):
        status, challenge_headers = request(data['origin'], headers, state / 'ca.crt')
        locations = values(challenge_headers, 'location')
        if status != 302 or len(locations) != 1:
            return False
        destination = urlsplit(locations[0])
        authority = urlsplit(data['authority'])
        if (destination.scheme, destination.netloc) != (authority.scheme, authority.netloc):
            raise RuntimeError('Challenge left the synthetic identity origin')
        result = subprocess.run(['curl', '--noproxy', '*', '--silent', '--show-error', '--max-time', '10', '--cacert', str(state / 'ca.crt'), '--connect-to', f"::127.0.0.1:{authority.port}", '--location', '--max-redirs', '5', '--cookie', '', '--write-out', '\n%{http_code}', locations[0]], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
        if result.returncode:
            return False
        body, separator, code = result.stdout.rpartition(b'\n')
        print('Synthetic provider response:', code.decode(errors='replace'), 'username:', b'id="username"' in body, 'password:', b'id="password"' in body, flush=True)
        return bool(separator and code == b'200' and b'id="username"' in body and b'id="password"' in body)

    if not accepted_callback({}):
        raise RuntimeError('Synthetic provider did not accept the ordinary callback')
    if not accepted_callback({'X-Forwarded-Host': 'forged-origin.scoremap.test'}):
        raise RuntimeError('Forged forwarded host changed the registered callback')
    if accepted_callback({'Host': 'forged-origin.scoremap.test'}):
        raise RuntimeError('Forged ordinary Host unexpectedly passed callback validation')

    # HSTS is emitted by the real production middleware only when the forwarded
    # scheme is HTTPS. Use a non-localhost Host because ASP.NET excludes localhost.
    source_host = 'untrusted-origin.scoremap.test'
    status, headers = request(data['origin'], {'Host': source_host}, state / 'ca.crt', '/health/ready')
    if status != 200 or not values(headers, 'strict-transport-security'):
        raise RuntimeError('Trusted HTTPS control did not emit HSTS')
    def forged(index):
        return {'Host': source_host, 'X-Forwarded-Proto': 'https', 'X-Forwarded-Host': 'forged-origin.scoremap.test', 'X-Forwarded-For': '198.51.100.' + str(index + 1)}
    status, headers = request(address, forged(0), path='/health/ready')
    if status != 200 or values(headers, 'strict-transport-security'):
        raise RuntimeError('Untrusted forwarded scheme was accepted')

    # Challenges can fail at the identity provider because the deliberately
    # untrusted HTTP origin is not a registered callback. Rate limiting must
    # still apply before another challenge regardless of its upstream result.
    baseline = None
    for index in range(30):
        status, _ = request(address, forged(index))
        if baseline is None:
            baseline = status
        if status != baseline or status == 429:
            raise RuntimeError('Unexpected challenge response before rate limit')
    status, rejected_headers = request(address, forged(30))
    retry = values(rejected_headers, 'retry-after')
    if status != 429 or len(retry) != 1 or not retry[0].isdigit() or not 1 <= int(retry[0]) <= 60:
        raise RuntimeError('Forged client addresses bypassed the login rate limit')
    if q.verification_source() != data['verificationSource']:
        raise RuntimeError('Verification inputs changed during qualification')
    q.write(output, {'verificationSource': data['verificationSource'], 'applicationRevision': settings['ApplicationRevision'], 'applicationImage': settings['ApplicationImage'], 'syntheticOnly': True, 'environment': 'disposable Production HTTPS, Keycloak and PostgreSQL', 'trustedProxyProducedIdentityChallenge': True, 'trustedAuthCookiesSecureHttpOnlySameSiteLax': True, 'untrustedPeerIgnoredForwardedProto': True, 'forwardedHostDidNotChangeCallback': True, 'forgedHostNegativeControlRejected': True, 'forgedForwardedForCouldNotBypassLoginRateLimit': True, 'distinctUntrustedContainer': True, 'actualOperatorDeployment': False})
    print('Trusted and spoofed ingress behavior verified in disposable Production.', flush=True)
finally:
    try:
        if attacker:
            subprocess.run(['docker', 'rm', '-f', attacker], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    finally:
        if q.ACTIVE_STATE is not None and (q.ACTIVE_STATE / 'state.private.json').exists():
            q.cleanup(q.ACTIVE_STATE)
