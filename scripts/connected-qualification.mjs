// The manifest is an explicit review boundary: updating tests requires reviewing its changes too.
export function completeConnectedQualification(report, manifest) {
  if (manifest.length !== 52 || report.stats?.expected !== manifest.length || report.stats?.unexpected || report.stats?.skipped || report.stats?.flaky) return false;
  const expected = new Set(manifest.map(item => JSON.stringify(item)));
  if (expected.size !== manifest.length) return false;
  const seen = new Set();
  function visit(suites) {
    for (const suite of suites ?? []) {
      for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) {
        const key = JSON.stringify([spec.file, spec.title, test.projectName]);
        if (!expected.has(key) || seen.has(key) || test.expectedStatus !== 'passed' || test.status !== 'expected' || !test.results?.length || test.results.some(result => result.status !== 'passed')) return false;
        seen.add(key);
      }
      if (!visit(suite.suites)) return false;
    }
    return true;
  }
  return visit(report.suites) && seen.size === expected.size;
}
