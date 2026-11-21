import test from 'node:test';
import assert from 'node:assert/strict';
import { deferredBehaviour, deferredResult, missingBehaviours, requireWebBehaviours } from '../../scripts/behaviour-evidence.mjs';

const native = ['SB-NATIVE-SONG-CREATE', 'SB-NATIVE-SONG-DELETE', 'SB-NATIVE-SONG-RESTORE', 'SB-NATIVE-COPY-IMPORT'];

test('accepted native backlog remains explicitly unimplemented in the web provider, assigned to the exact epic stages', () => {
  const missing = missingBehaviours(native.map(id => ({ id })), new Set());
  assert.deepEqual(missing.map(artifact => artifact.id), native);
  for (const id of native) assert.deepEqual(deferredBehaviour(id), {
    issue: 79, stage: id === 'SB-NATIVE-COPY-IMPORT' ? 'AND-06' : 'AND-05', platform: 'android',
  });
});

test('unknown uncovered behaviour still fails; no prefix or model status authorizes deferral', () => {
  for (const id of ['SB-UNIMPLEMENTED', 'SB-NATIVE-NEW']) {
    assert.throws(() => missingBehaviours([{ id, status: 'draft' }], new Set()), /Missing executable behaviour coverage/);
  }
});

test('previous PDF deferrals and all executed web coverage keep their existing meaning', () => {
  assert.deepEqual(deferredBehaviour('SB-PDF-ATTACH'), { issue: 13 });
  assert.deepEqual(missingBehaviours([{ id: 'SB-PDF-ATTACH' }, { id: 'SB-SONG-CREATE' }], new Set(['SB-SONG-CREATE'])), [{ id: 'SB-PDF-ATTACH' }]);
  assert.equal(deferredBehaviour('SB-SONG-CREATE'), undefined);
  assert.doesNotThrow(() => requireWebBehaviours(['SB-SONG-CREATE']));
});

test('a Vitest or Playwright title cannot turn a native backlog criterion into executed Android evidence', () => {
  for (const id of native) assert.throws(() => requireWebBehaviours([id]), /Web reports cannot qualify native Android/);
});

test('pending criteria emit inconclusive evidence and undeclared deferrals refuse', () => {
  for (const id of native) {
    const result = deferredResult(id, { artifact: id });
    assert.equal(result.outcome, 'inconclusive');
    assert.match(result['test-id'], /^deferred:issue-79:AND-0[56]:SB-NATIVE-/);
    assert.deepEqual(result.citations, [{ artifact: id }]);
  }
  assert.equal(deferredResult('SB-PDF-ATTACH', {}).outcome, 'inconclusive');
  assert.equal(deferredResult('SB-PDF-ATTACH', {})['test-id'], 'deferred:issue-13:SB-PDF-ATTACH');
  assert.throws(() => deferredResult('SB-NATIVE-NEW', {}), /Undeclared behaviour deferral/);
});
