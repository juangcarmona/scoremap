import test from 'node:test';
import assert from 'node:assert/strict';
import { completeConnectedQualification } from '../../scripts/connected-qualification.mjs';

const manifest = Array.from({ length: 52 }, (_, index) => ['private.spec.ts', `case ${index}`, 'connected-chromium']);
function report() {
  return { stats: { expected: 52, unexpected: 0, skipped: 0, flaky: 0 }, suites: [{ specs: manifest.map(([file, title, projectName]) => ({ file, title, tests: [{ projectName, expectedStatus: 'passed', status: 'expected', results: [{ status: 'passed' }] }] })) }] };
}
test('accepts only the complete, actually passed connected selection', () => {
  assert.equal(completeConnectedQualification(report(), manifest), true);
  assert.equal(completeConnectedQualification(report(), manifest.slice(1)), false);
  for (const mutate of [
    r => { r.suites[0].specs[0].title = 'different test'; },
    r => { r.suites[0].specs[0] = structuredClone(r.suites[0].specs[1]); },
    r => { r.suites[0].specs.pop(); },
    r => { r.suites[0].specs[0].tests[0].results = []; },
    r => { r.suites[0].specs[0].tests[0].results[0].status = 'failed'; },
    r => { r.suites[0].specs[0].tests[0].expectedStatus = 'failed'; },
    r => { r.stats.skipped = 1; },
  ]) {
    const candidate = report();
    mutate(candidate);
    assert.equal(completeConnectedQualification(candidate, manifest), false);
  }
});
