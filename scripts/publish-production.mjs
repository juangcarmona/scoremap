import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import YAML from 'yaml';

const root = process.cwd();
const verify = process.argv[2] === '--verify';
if (process.argv[2]?.startsWith('--') && !verify) throw new Error('Use --verify or select an empty output directory.');
const destination = verify ? null : path.resolve(root, process.argv[2] ?? 'deployment/output');
if (destination) {
  await fs.mkdir(destination, { recursive: true });
  if ((await fs.readdir(destination)).length) throw new Error('Select an empty publication directory; existing operator artifacts are kept.');
}
const state = await fs.mkdtemp(path.join(os.tmpdir(), 'scoremap-publication-'));
const project = 'src/root/ScoreMap.Deployment/ScoreMap.Deployment.csproj';
function run(command, args, cwd = state, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 300000 });
  if (result.error || result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed:\n${result.stdout ?? ''}\n${result.stderr ?? ''}`, { cause: result.error });
  return result.stdout;
}
async function inspect(output, source) {
  const compose = YAML.parse(await fs.readFile(path.join(output, 'docker-compose.yaml'), 'utf8'));
  assert.deepEqual(Object.keys(compose.services).sort(), ['application', 'database'], 'Production composition must contain only the application and its private database.');
  const { application, database } = compose.services;
  assert.equal(application.environment.ASPNETCORE_ENVIRONMENT, 'Production');
  assert.equal(application.environment.SCOREMAP_APPLICATION_FILE, '/run/scoremap/application.json');
  assert.match(application.image, /\$\{SCOREMAP_IMAGE:\?/u);
  assert.deepEqual(application.ports, ['127.0.0.1:${SCOREMAP_HTTP_PORT:-5280}:8080']);
  assert.equal(application.read_only, true);
  assert(application.security_opt.includes('no-new-privileges:true'));
  assert(application.tmpfs.includes('/tmp'));
  assert(application.volumes.some(volume => volume.target === '/run/scoremap/application.json' && volume.type === 'bind' && volume.read_only));
  assert(application.volumes.some(volume => volume.target === '/var/lib/scoremap/keys' && volume.type === 'volume'));
  assert.equal(application.depends_on.database.condition, 'service_healthy');
  assert(!database.ports?.length, 'The database has no host ingress.');
  assert(database.volumes.some(volume => volume.target === '/var/lib/postgresql' && volume.type === 'volume'));
  assert.equal(database.environment.POSTGRES_PASSWORD_FILE, '/run/secrets/database_password');
  assert.match(compose.secrets.database_password.file, /\$\{SCOREMAP_DATABASE_PASSWORD_FILE:\?/u);
  assert.deepEqual(compose, YAML.parse(await fs.readFile(path.join(source, 'deployment/compose.yaml'), 'utf8')), 'The checked-in portable Compose snapshot drifted from the production AppHost.');
  const configuration = path.join(state, 'configuration-placeholder.json');
  const password = path.join(state, 'password-placeholder.txt');
  await fs.writeFile(configuration, '{}', { mode: 0o600 });
  await fs.writeFile(password, 'synthetic-publication-validation-only', { mode: 0o600 });
  run('docker', ['compose', '-f', path.join(output, 'docker-compose.yaml'), 'config', '--quiet'], state, { ...process.env, SCOREMAP_IMAGE: `sha256:${'0'.repeat(64)}`, SCOREMAP_APPLICATION_FILE: configuration, SCOREMAP_DATABASE_PASSWORD_FILE: password });
}
try {
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  let source = root;
  if (!verify) {
    source = path.join(state, 'source');
    await fs.mkdir(source);
    const archive = path.join(state, 'source.tar');
    execFileSync('git', ['archive', '--format=tar', `--output=${archive}`, revision], { cwd: root });
    run('tar', ['-xf', archive, '-C', source]);
    await fs.access(path.join(source, project)).catch(() => { throw new Error('Commit the production AppHost before publishing an immutable artifact.'); });
    assert((await fs.readFile(fileURLToPath(import.meta.url))).equals(await fs.readFile(path.join(source, 'scripts/publish-production.mjs'))), 'Commit the publication driver before retaining immutable publication evidence.');
  }
  await fs.mkdir(path.join(state, '.config'));
  await fs.copyFile(path.join(source, '.config/dotnet-tools.json'), path.join(state, '.config/dotnet-tools.json'));
  run('dotnet', ['tool', 'restore']);
  assert.match(run('dotnet', ['aspire', '--version']), /^13\.6\.5(?:\+|\s|$)/u);
  const output = path.join(state, 'output');
  run('dotnet', ['restore', path.join(source, project), '--locked-mode']);
  run('dotnet', ['build', path.join(source, project), '-c', 'Debug', '--no-restore']);
  run('dotnet', ['aspire', 'publish', '--no-build', '--apphost', path.join(source, project), '--output-path', output, '--non-interactive', '--nologo']);
  await inspect(output, source);
  const dll = path.join(source, 'src/root/ScoreMap.Deployment/bin/Debug/net10.0/ScoreMap.Deployment.dll');
  const refused = spawnSync('dotnet', [dll], { cwd: state, encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024 });
  assert.equal(refused.status, 1, 'The production publisher must refuse direct execution.');
  assert.match(refused.stderr, /Publish the production composition with aspire publish/u);
  if (verify) {
    const occupied = path.join(state, 'existing-operator-artifacts');
    await fs.mkdir(occupied);
    await fs.writeFile(path.join(occupied, 'keep.txt'), 'synthetic-preserved-artifact');
    const preserved = spawnSync(process.execPath, [fileURLToPath(import.meta.url), occupied], { cwd: root, encoding: 'utf8', timeout: 30000 });
    assert.equal(preserved.status, 1);
    assert.match(preserved.stderr, /existing operator artifacts are kept/u);
    assert.deepEqual(await fs.readdir(occupied), ['keep.txt']);
    assert.equal(await fs.readFile(path.join(occupied, 'keep.txt'), 'utf8'), 'synthetic-preserved-artifact');
    console.log('Production AppHost publishes matching protected Compose artifacts, renders synthetic file inputs and refuses direct execution/nonempty destinations; no containers deployed.');
  } else {
    if ((await fs.readdir(destination)).length) throw new Error('Select an empty publication directory; existing operator artifacts are kept.');
    const files = await fs.readdir(output);
    const digests = {};
    for (const file of files) {
      const content = await fs.readFile(path.join(output, file));
      digests[file] = createHash('sha256').update(content).digest('hex');
      await fs.writeFile(path.join(destination, file), content, { flag: 'wx' });
    }
    await fs.writeFile(path.join(destination, 'publication-receipt.json'), JSON.stringify({ sourceRevision: revision, aspireVersion: '13.6.5', committedSourceArchive: true, generatedFilesSha256: digests, containersDeployed: false, applicationImageSelected: false, identityOrOperatorSecretsIncluded: false }, null, 2) + '\n', { flag: 'wx' });
    console.log(`Published committed production composition ${revision} to ${destination}; select a qualified image and private operator files separately.`);
  }
} finally {
  await fs.rm(state, { recursive: true, force: true });
}
