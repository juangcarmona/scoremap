import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { renderConnectedReport } from '../../scripts/connected-report.mjs';

const revision = 'a'.repeat(40);
const manifest = Array.from({ length: 52 }, (_, i) => ['journey.spec.ts', `Journey ${i}`, 'connected-chromium']);
function example() {
  const report = { stats: { expected: 52, skipped: 0, unexpected: 0, flaky: 0 }, suites: [{ specs: manifest.map(([file, title, projectName]) => ({ file, title, tests: [{ projectName, expectedStatus: 'passed', status: 'expected', results: [{ status: 'passed', stdout: ['secret-session-token'] }] }] })) }] };
  const bytes = Buffer.from(JSON.stringify(report));
  return { report, bytes, receipt: { source: { revision }, passed: true, reportSha256: createHash('sha256').update(bytes).digest('hex') } };
}
test('renders committed journeys while excluding raw private output', () => {
  const { receipt, bytes } = example();
  const html = renderConnectedReport(manifest, receipt, bytes, revision);
  assert.match(html, /Overall: <strong>passed/);
  assert.match(html, /Journey 0/);
  assert.doesNotMatch(html, /secret-session-token/);
});
test('never reports success for changed, missing or failed evidence', () => {
  const { receipt, bytes, report } = example();
  assert.match(renderConnectedReport(manifest, receipt, Buffer.from('{}'), revision), /unverified/);
  assert.match(renderConnectedReport(manifest, null, Buffer.alloc(0), revision), /incomplete or failed/);
  report.suites[0].specs[0].tests[0].results[0].status = 'failed';
  report.stats.expected--;
  report.stats.unexpected++;
  const failed = Buffer.from(JSON.stringify(report));
  receipt.reportSha256 = createHash('sha256').update(failed).digest('hex');
  receipt.passed = false;
  const html = renderConnectedReport(manifest, receipt, failed, revision);
  assert.match(html, /incomplete or failed/);
  assert.match(html, /<td>failed<\/td>/);
  assert.doesNotMatch(html, /secret-session-token/);
});
test('a structurally malformed report is inconclusive even if its digest matches', () => {
  const bytes = Buffer.from(JSON.stringify({ suites: [{ specs: {} }], stats: { expected: 52 } }));
  const receipt = { source: { revision }, passed: true, reportSha256: createHash('sha256').update(bytes).digest('hex') };
  const html = renderConnectedReport(manifest, receipt, bytes, revision);
  assert.match(html, /incomplete or failed/);
  assert.match(html, /unverified/);
});
test('escapes committed labels', () => {
  const html = renderConnectedReport([['<script>', '<unsafe>', 'browser']], null, Buffer.alloc(0), revision);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});
for (const custom of [false, true]) test(`an aborted rerun preserves prior results and cannot reuse the receipt (${custom ? 'custom' : 'default'} directory)`, () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'scoremap-qualification-'));
  try {
    mkdirSync(path.join(dir, 'scripts'));
    mkdirSync(path.join(dir, 'test-results/connected'), { recursive: true });
    mkdirSync(path.join(dir, 'bin'));
    for (const name of ['verify-connected.mjs', 'verification-inputs.mjs', 'connected-qualification.mjs']) copyFileSync(path.join('scripts', name), path.join(dir, 'scripts', name));
    writeFileSync(path.join(dir, 'bin/npm'), '#!/bin/sh\nprintf %s "$SCOREMAP_TEST_REPORT_DIRECTORY" > "$PWD/bin/actual-directory"\nexit 1\n', { mode: 0o755 });
    execFileSync('git', ['init', '-q'], { cwd: dir });
    execFileSync('git', ['add', 'scripts'], { cwd: dir });
    execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture'], { cwd: dir });
    const receipt = path.join(dir, 'test-results/connected/source-receipt.json');
    const reportDir = custom ? path.join(dir, 'custom-reports') : path.join(dir, 'test-results/connected');
    mkdirSync(reportDir, { recursive: true });
    const results = path.join(reportDir, 'results.json');
    writeFileSync(receipt, '{"passed":true}');
    writeFileSync(results, 'previous report, must not change');
    const result = spawnSync(process.execPath, ['scripts/verify-connected.mjs'], { cwd: dir, env: { ...process.env, PATH: `${dir}/bin:${process.env.PATH}`, ...(custom ? { SCOREMAP_TEST_REPORT_DIRECTORY: reportDir } : { SCOREMAP_TEST_REPORT_DIRECTORY: '' }) } });
    assert.notEqual(result.status, 0);
    assert.equal(existsSync(receipt), false);
    assert.equal(readFileSync(results, 'utf8'), 'previous report, must not change');
    const actualDir = readFileSync(path.join(dir, 'bin/actual-directory'), 'utf8');
    assert.equal(path.dirname(actualDir), reportDir);
    assert.match(path.basename(actualDir), /^run-/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('a successful run records its own result without replacing a custom directory file', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'scoremap-qualification-success-'));
  try {
    mkdirSync(path.join(dir, 'scripts'));
    mkdirSync(path.join(dir, 'tests/connected'), { recursive: true });
    mkdirSync(path.join(dir, 'bin'));
    const reportDir = path.join(dir, 'custom-reports');
    mkdirSync(reportDir);
    for (const name of ['verify-connected.mjs', 'verification-inputs.mjs', 'connected-qualification.mjs']) copyFileSync(path.join('scripts', name), path.join(dir, 'scripts', name));
    writeFileSync(path.join(dir, 'tests/connected/qualification-manifest.json'), JSON.stringify(manifest));
    writeFileSync(path.join(dir, 'bin/report.json'), example().bytes);
    writeFileSync(path.join(dir, 'bin/npm'), '#!/bin/sh\ncp "$PWD/bin/report.json" "$SCOREMAP_TEST_REPORT_DIRECTORY/results.json"\n', { mode: 0o755 });
    execFileSync('git', ['init', '-q'], { cwd: dir });
    execFileSync('git', ['add', 'scripts', 'tests'], { cwd: dir });
    execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture'], { cwd: dir });
    const oldReport = path.join(reportDir, 'results.json');
    writeFileSync(oldReport, 'other user report');
    const result = spawnSync(process.execPath, ['scripts/verify-connected.mjs'], { cwd: dir, env: { ...process.env, PATH: `${dir}/bin:${process.env.PATH}`, SCOREMAP_TEST_REPORT_DIRECTORY: reportDir } });
    assert.equal(result.status, 0, result.stderr.toString());
    const receipt = JSON.parse(readFileSync(path.join(dir, 'test-results/connected/source-receipt.json'), 'utf8'));
    assert.equal(receipt.passed, true);
    assert.equal(path.dirname(path.dirname(receipt.reportPath)), reportDir);
    assert.equal(readFileSync(receipt.reportPath, 'utf8'), example().bytes.toString());
    assert.equal(readFileSync(oldReport, 'utf8'), 'other user report');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
