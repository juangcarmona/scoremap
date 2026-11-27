import assert from 'node:assert/strict';
import { sign } from 'node:crypto';

// OAuth uses the service-account key directly; no extra Cloud IAM roles are needed.
let credentials;
try {
  credentials = JSON.parse(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON);
} catch {
  throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is missing or is not valid JSON.');
}
assert.equal(credentials.type, 'service_account', 'Expected a service-account JSON key.');
const packageName = process.env.SCOREMAP_APPLICATION_ID;
assert.match(packageName, /^[a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)+$/);
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const payload = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
  iss: credentials.client_email,
  scope: 'https://www.googleapis.com/auth/androidpublisher',
  aud: 'https://oauth2.googleapis.com/token',
  iat: now,
  exp: now + 3600,
})}`;
const signature = sign('RSA-SHA256', Buffer.from(payload), credentials.private_key).toString('base64url');
const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${payload}.${signature}` }),
});
assert.ok(tokenResponse.ok, `Google authentication failed (HTTP ${tokenResponse.status}); check the JSON secret and whether its key is enabled.`);
const token = await tokenResponse.json();
assert.ok(token.access_token, 'Google returned no access token.');
console.log('Google service-account authentication succeeded.');
const endpoint = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/edits`;
const headers = { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' };
const editResponse = await fetch(endpoint, { method: 'POST', headers, body: '{}' });
if (editResponse.status === 404) {
  console.log('::warning::Google Play has no API-visible app for this package yet. Confirm the package and complete the first Console upload.');
} else {
  assert.ok(editResponse.ok, `Google Play access failed (HTTP ${editResponse.status}); check Android Publisher API enablement and app-specific Play permissions.`);
  const edit = await editResponse.json();
  assert.match(edit.id, /^[\w-]+$/);
  const cleanup = await fetch(`${endpoint}/${edit.id}`, { method: 'DELETE', headers });
  assert.ok(cleanup.ok, `Could not remove the uncommitted Play edit (HTTP ${cleanup.status}).`);
  console.log('Google Play app access succeeded; temporary edit deleted without committing changes.');
}
