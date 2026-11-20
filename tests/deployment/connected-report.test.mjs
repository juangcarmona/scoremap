import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, existsSync, rmSync } from 'node:fs';
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
test('escapes committed labels', () => {
  const html = renderConnectedReport([['<script>', '<unsafe>', 'browser']], null, Buffer.alloc(0), revision);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});
test('an aborted rerun cannot reuse the previous success receipt', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'scoremap-qualification-'));
  try {
    mkdirSync(path.join(dir, 'scripts'));
    mkdirSync(path.join(dir, 'test-results/connected'), { recursive: true });
    mkdirSync(path.join(dir, 'bin'));
    for (const name of ['verify-connected.mjs', 'verification-inputs.mjs', 'connected-qualification.mjs']) copyFileSync(path.join('scripts', name), path.join(dir, 'scripts', name));
    writeFileSync(path.join(dir, 'bin/npm'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
    execFileSync('git', ['init', '-q'], { cwd: dir });
    execFileSync('git', ['add', 'scripts'], { cwd: dir });
    execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture'], { cwd: dir });
    const receipt = path.join(dir, 'test-results/connected/source-receipt.json');
    const results = path.join(dir, 'test-results/connected/results.json');
    writeFileSync(receipt, '{"passed":true}');
    writeFileSync(results, '{}');
    const result = spawnSync(process.execPath, ['scripts/verify-connected.mjs'], { cwd: dir, env: { ...process.env, PATH: `${dir}/bin:${process.env.PATH}` } });
    assert.notEqual(result.status, 0);
    assert.equal(existsSync(receipt), false);
    assert.equal(existsSync(results), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
