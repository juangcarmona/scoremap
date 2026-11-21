import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';

// Adopter qualification only: the published SDK does not export this guard.
// Keep this sibling-source coupling version bounded and requalify on upgrade.
const sdkSource = dirname(createRequire(import.meta.url).resolve('@juangcarmona/lighthouse-sdlc'));
const sdkPackage = JSON.parse(await readFile(resolve(sdkSource, '../package.json'), 'utf8'));
assert.equal(sdkPackage.version, '0.30.1');
const { verificationIntegrity, sourceDigest } = await import(pathToFileURL(resolve(sdkSource, 'verification-integrity.mjs')));
const { validateImplementationPolicy, withinScope, sourceFiles } = await import(pathToFileURL(resolve(sdkSource, 'implementation.mjs')));
const { defaults: policy } = JSON.parse(await readFile('.lighthouse/implement.json', 'utf8'));
const required = ['vitest.config.ts', 'playwright.config.ts', 'package.json', 'package-lock.json', 'scripts/verify-security.mjs'];
const legacy = 'tests/library/domain.test.ts';
const admitted = 'src/android/music/src/test/kotlin/scoremap/music/MusicContractTest.kt';
const file = content => ({ mode: '100644', content: Buffer.from(content) });
const baseline = new Map(await Promise.all([...required, legacy].map(async path => [path, file(await readFile(path))])));
const changed = (path, content = 'independently authored synthetic test input') => new Map([...baseline, [path, file(content)]]);
const run = after => verificationIntegrity(baseline, after, policy, 1000);

test('an unchanged pre-Android source passes without phantom native files', () => {
  const result = run(baseline);
  assert.equal(result.status, 'passed');
  assert.equal(result.baseline, result.candidate);
  assert.deepEqual(result.corrections, []);
});

for (const path of [admitted, 'tests/deployment/native-product-traceability.test.mjs']) {
  test(`a newly admitted test produces a creation receipt: ${path}`, () => {
    const result = run(changed(path));
    assert.equal(result.status, 'passed');
    assert.equal(result.corrections.length, 1);
    assert.equal(result.corrections[0].path, path);
    assert.equal(result.corrections[0].reason, policy.verification.corrections[path]);
    assert.equal(result.corrections[0].before, null);
    assert.match(result.corrections[0].after, /^[a-f0-9]{64}$/u);
    assert.notEqual(result.baseline, result.candidate);
  });
}

for (const path of [legacy, 'tests/deployment/unadmitted.test.mjs', 'src/android/music/src/test/kotlin/scoremap/music/UnadmittedTest.kt', 'src/android/quality/undeclared-policy.json', 'scripts/android-ci-toolchain.mjs']) {
  test(`an unadmitted verification change is rejected: ${path}`, () => {
    assert.throws(() => run(changed(path)), error => error.message.includes('Verification inputs changed without an admitted correction reason:') && error.message.includes(path));
  });
}

test('required input deletion still fails despite an exact correction reason', () => {
  const after = new Map(baseline);
  after.delete('package.json');
  assert.throws(() => run(after), /Required verification input is absent: package\.json/u);
});

test('file modes are protected as well as bytes', () => {
  const after = new Map(baseline);
  after.set(legacy, { ...after.get(legacy), mode: '100755' });
  assert.throws(() => run(after), /Verification inputs changed without an admitted correction reason/u);
});

test('the finite authoring policy preserves checks, required inputs and independent review', () => {
  assert.equal(validateImplementationPolicy(policy, 1000), policy);
  assert.equal(policy.reviewRequired, true);
  assert.deepEqual(policy.checks, [['npm', 'ci', '--ignore-scripts'], ['npm', 'run', 'verify'], ['npm', 'run', 'test:e2e']]);
  assert.deepEqual(policy.verification.paths.filter(path => !path.endsWith('/')), required);
  assert(policy.verification.paths.includes('tests/'));
  assert(policy.verification.paths.includes('scripts/'));
  assert(policy.verification.paths.includes('src/android/scripts/'));
  assert.equal(policy.verification.corrections['package-lock.json'], undefined);
  assert.equal(policy.verification.corrections[legacy], undefined);
  assert.equal(policy.verification.corrections['tests/deployment/native-implementation-policy.test.mjs'], undefined);
  const corrections = Object.entries(policy.verification.corrections);
  assert(corrections.length > 0 && corrections.length <= 40);
  for (const [path, reason] of corrections) {
    assert.doesNotMatch(path, /[?*\[\]{}]|\/$/u);
    assert(reason.trim().length > 0);
    assert(withinScope(path, policy), `${path} must also be in implementation scope`);
  }
});

test('the owning validator refuses wildcard verification inventories and excess corrections', () => {
  const wildcard = structuredClone(policy);
  wildcard.verification.paths.push('src/android/**');
  assert.throws(() => validateImplementationPolicy(wildcard, 1000), /Verification needs explicit input paths/u);
  const excess = structuredClone(policy);
  excess.verification.corrections = Object.fromEntries(Array.from({ length: 41 }, (_, index) => [`tests/synthetic-${index}.mjs`, 'bounded synthetic correction']));
  assert.throws(() => validateImplementationPolicy(excess, 1000), /Verification needs explicit input paths/u);
});

test('browser verification provisions the locked Playwright browser in a fresh candidate', async () => {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  assert.equal(pkg.scripts['test:e2e'], 'playwright install chromium && playwright test');
});

test('browser captures use disposable result paths without overwriting retained evidence', async () => {
  for (const spec of ['acceptance', 'android']) {
    const source = await readFile(`tests/e2e/${spec}.spec.ts`, 'utf8');
    assert.doesNotMatch(source, /docs\/evidence\/screenshots\//u);
    assert.match(source, /test-results\/browser\//u);
  }
});

test('the actual SDK inventory ignores browser cache and captures while preserving tracked evidence', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'scoremap-browser-inventory-'));
  try {
    await writeFile(resolve(root, '.gitignore'), await readFile('.gitignore'));
    await mkdir(resolve(root, 'docs/evidence/screenshots'), { recursive: true });
    await writeFile(resolve(root, 'docs/evidence/screenshots/retained.png'), 'retained synthetic evidence');
    const before = await sourceFiles(root);
    for (const path of ['.cache/ms-playwright/synthetic-browser', 'test-results/browser/synthetic-capture.png']) {
      await mkdir(dirname(resolve(root, path)), { recursive: true });
      await writeFile(resolve(root, path), 'synthetic runtime output');
    }
    const after = await sourceFiles(root, before);
    assert.deepEqual([...after.keys()].sort(), [...before.keys()].sort());
    assert.equal(sourceDigest(before), sourceDigest(after));
    assert(after.has('docs/evidence/screenshots/retained.png'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
