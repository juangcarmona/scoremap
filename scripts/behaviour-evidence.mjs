// This provider consumes web reports. Native execution has its own source-bound Android gates.
const pending = new Map([
  ['SB-NATIVE-SONG-CREATE', { issue: 79, stage: 'AND-05', platform: 'android' }],
  ['SB-NATIVE-SONG-DELETE', { issue: 79, stage: 'AND-05', platform: 'android' }],
  ['SB-NATIVE-SONG-RESTORE', { issue: 79, stage: 'AND-05', platform: 'android' }],
  ['SB-NATIVE-COPY-IMPORT', { issue: 79, stage: 'AND-06', platform: 'android' }],
  ['SB-PDF-ATTACH', { issue: 13 }],
  ['SB-PDF-NAVIGATE', { issue: 13 }],
  ['SB-PDF-REJECT', { issue: 13 }],
]);

export function deferredBehaviour(id) {
  return pending.get(id);
}

export function missingBehaviours(artifacts, covered) {
  const missing = artifacts.filter(artifact => !covered.has(artifact.id));
  const undeclared = missing.filter(artifact => !pending.has(artifact.id));
  if (undeclared.length) throw new Error('Missing executable behaviour coverage: ' + undeclared.map(artifact => artifact.id).join(', '));
  return missing;
}

export function requireWebBehaviours(ids) {
  for (const id of ids) {
    if (pending.get(id)?.platform === 'android') throw new Error('Web reports cannot qualify native Android behaviour: ' + id);
  }
}

export function deferredResult(id, citation) {
  const metadata = pending.get(id);
  if (!metadata) throw new Error('Undeclared behaviour deferral: ' + id);
  return {
    'test-id': 'deferred:issue-' + metadata.issue + ':' + (metadata.stage ? metadata.stage + ':' : '') + id,
    level: 'end-to-end', outcome: 'inconclusive', citations: [citation],
  };
}
