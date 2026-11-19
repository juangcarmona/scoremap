import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = resolve('scripts/dev-private.mjs');
const exampleConfig = JSON.parse(await readFile('config/application.example.json', 'utf8'));
const exampleUsers = JSON.parse(await readFile('config/development-users.example.json', 'utf8'));
const absent = async path => { try { await access(path); return false; } catch { return true; } };

async function exercise(mutate, accepted = false, corrupt = false, existing = false) {
 const directory = await mkdtemp(join(tmpdir(), 'scoremap-fixture-'));
 try {
  const config = structuredClone(exampleConfig), users = structuredClone(exampleUsers);
  mutate(config, users);
  const configFile = join(directory, 'application.json'), usersFile = join(directory, 'users.json');
  await writeFile(configFile, JSON.stringify(config)); await writeFile(usersFile, corrupt ? '{\"password\":\"synthetic-development-client-only\"' : JSON.stringify(users));
  const bin = join(directory, 'bin'), marker = join(directory, 'dotnet-called');
  const prior = join(directory, '.runtime', config.InstanceId, 'existing-synthetic-state');
  if (existing) { await mkdir(join(directory, '.runtime', config.InstanceId), {recursive: true}); await writeFile(prior, 'keep exactly'); }
  await mkdir(bin); await writeFile(join(bin, 'dotnet'), '#!/bin/sh\ntouch "$SCOREMAP_TEST_MARKER"\nexit 1\n', {mode: 0o755});
  const result = spawnSync(process.execPath, [script, configFile, usersFile], {
   cwd: directory, encoding: 'utf8', env: {...process.env, PATH: `${bin}:${process.env.PATH}`, SCOREMAP_TEST_MARKER: marker},
  });
  assert.notEqual(result.status, 0);
  assert.equal(await absent(marker), !accepted, 'dotnet starts only after fixture validation');
  if (existing) assert.equal(await readFile(prior, 'utf8'), 'keep exactly');
  else assert.equal(await absent(join(directory, '.runtime')), !accepted, 'invalid fixture must not create runtime state');
  assert.doesNotMatch(result.stdout + result.stderr, /Trial-owner-a-only-2026!|synthetic-development-client-only|private-value/u);
 } finally { await rm(directory, { recursive: true, force: true }); }
}

test('synthetic example is admitted before starting the isolated provider graph', async () => {
 await exercise(() => {}, true);
});
test('invalid fixture leaves an existing runtime untouched', async () => { await exercise((_c, u) => { u.users[1].id = u.users[0].id; }, false, false, true); });
test('malformed JSON is rejected without disclosing its contents', async () => { await exercise(() => {}, false, true); });
test('explicitly declared native roles are accepted', async () => {
 await exercise((_c, u) => { u.roles = { realm: [{name: 'musician'}], client: {'scoremap-web': [{name: 'member'}]} }; u.users[0].realmRoles = ['musician']; u.users[0].clientRoles = {'scoremap-web': ['member']}; }, true);
});
for (const [name, mutate] of [
 ['duplicate case-insensitive username', (_c, u) => { u.users[1].username = u.users[0].username.toUpperCase(); }],
 ['duplicate stable identity', (_c, u) => { u.users[1].id = u.users[0].id; }],
 ['missing user password', (_c, u) => { u.users[0].credentials = []; }],
 ['invalid user enabled flag', (_c, u) => { u.users[0].enabled = 'true'; }],
 ['unknown realm role', (_c, u) => { u.users[0].realmRoles = ['unknown-role']; }],
 ['unknown client role', (_c, u) => { u.users[0].clientRoles = { 'scoremap-web': ['unknown-role'] }; }],
 ['duplicate provider client', (_c, u) => { u.clients.push(structuredClone(u.clients[0])); }],
 ['missing client secret', c => { c.Identity.ClientSecret = ''; }],
 ['invalid database port', c => { c.Development.DatabasePort = -1; }],
 ['duplicate service ports', c => { c.Development.DatabasePort = c.Development.IdentityPort; }],
 ['identity URL containing credentials', c => { c.Identity.Authority = 'http://user:private-value@localhost:8180/realms/scoremap-development'; }],
 ['padded username', (_c, u) => { u.users[0].username = ' owner-a'; }],
 ['realm path traversal', (c, u) => { u.realm = '../escape'; c.Identity.Authority = 'http://localhost:8180/realms/../escape'; }],
 ['wrong authority realm', c => { c.Identity.Authority = 'http://localhost:8180/realms/wrong'; }],
]) test(`refuses ${name} before runtime or provider side effects`, async () => { await exercise(mutate); });
