import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { completeConnectedQualification } from './connected-qualification.mjs';
import { verificationInputs } from './verification-inputs.mjs';

const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const key = item => JSON.stringify(item);

// Only committed test names and fixed outcome words enter this portable report.
export function renderConnectedReport(manifest, receipt, bytes, revision) {
  let report;
  let verified = false;
  try {
    report = JSON.parse(bytes);
    verified = !!report && typeof report === 'object' && Array.isArray(report.suites) && /^[a-f0-9]{40}$/.test(revision) && receipt?.source?.revision === revision &&
      receipt.reportSha256 === createHash('sha256').update(bytes).digest('hex');
  } catch { /* Missing or malformed input is inconclusive. */ }
  const outcomes = new Map();
  function visit(suites) {
    for (const suite of suites ?? []) {
      for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) {
        const id = key([spec.file, spec.title, test.projectName]);
        const results = test.results ?? [];
        let status = 'not run';
        if (results.some(item => item.status === 'failed' || item.status === 'timedOut' || item.status === 'interrupted')) status = 'failed';
        else if (results.some(item => item.status === 'skipped')) status = 'skipped';
        else if (results.length && results.every(item => item.status === 'passed') && test.expectedStatus === 'passed' && test.status === 'expected') status = 'passed';
        outcomes.set(id, outcomes.has(id) ? 'duplicate' : status);
      }
      visit(suite.suites);
    }
  }
  if (verified) visit(report.suites);
  const passed = verified && receipt.passed === true && completeConnectedQualification(report, manifest);
  const modelFiles = Object.entries(receipt?.source?.filesSha256 ?? {}).filter(([name]) => name.startsWith('docs/product/model/')).sort(([a], [b]) => a.localeCompare(b));
  const modelDigest = verified && modelFiles.length ? createHash('sha256').update(JSON.stringify(modelFiles)).digest('hex') : 'unavailable';
  const run = verified && receipt?.run?.kind === 'github-actions' && /^\d+$/.test(receipt.run.id) && /^\d+$/.test(receipt.run.attempt) ? `GitHub Actions ${receipt.run.id}, attempt ${receipt.run.attempt}` : 'local or unavailable';
  const rows = manifest.map(item => `<tr><td>${escape(item[0])}</td><td>${escape(item[1])}</td><td>${escape(item[2])}</td><td>${escape(verified ? outcomes.get(key(item)) ?? 'not run' : 'unverified')}</td></tr>`).join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ScoreMap connected journeys</title><style>body{font:1rem/1.5 system-ui,sans-serif;margin:2rem auto;padding:0 1rem;max-width:80rem;color:var(--lh-text,CanvasText);background:var(--lh-canvas,Canvas)}.table-scroll{max-width:100%;overflow-x:auto}table{border-collapse:collapse;width:100%}th,td{padding:.6rem;border:1px solid var(--lh-border,CanvasText);text-align:left;vertical-align:top}th{background:var(--lh-surface-raised,Canvas)}code{overflow-wrap:anywhere}</style></head><body><main><h1>Connected journeys</h1><p>Overall: <strong>${passed ? 'passed' : 'incomplete or failed'}</strong></p><p>Source revision: <code>${escape(/^[a-f0-9]{40}$/.test(revision) ? revision : 'unavailable')}</code>. Product model file-set SHA-256: <code>${escape(modelDigest)}</code>. Run: ${escape(run)}. Command: <code>npm run verify:connected</code>.</p><p>This report lists the committed selection and statuses only. It does not establish the identity of the target, independent review, deployment, physical-device use or human acceptance. Screenshots, video, raw errors and traces are omitted because they may contain private data.</p><div class="table-scroll" role="region" aria-label="Connected journey outcomes" tabindex="0"><table><caption>Connected journey outcomes</caption><thead><tr><th scope="col">File</th><th scope="col">Journey</th><th scope="col">Project</th><th scope="col">Outcome</th></tr></thead><tbody>${rows}</tbody></table></div></main></body></html>\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const manifest = JSON.parse(await readFile('tests/connected/qualification-manifest.json'));
  const receipt = await readFile('test-results/connected/source-receipt.json').then(JSON.parse).catch(() => null);
  const bytes = receipt?.reportPath ? await readFile(receipt.reportPath).catch(() => Buffer.alloc(0)) : Buffer.alloc(0);
  const source = await verificationInputs().catch(() => null);
  const revision = source && JSON.stringify(source) === JSON.stringify(receipt?.source) ? source.revision : '';
  await mkdir('test-results/connected', { recursive: true });
  await writeFile('test-results/connected/summary.html', renderConnectedReport(manifest, receipt, bytes, revision));
  console.log('Connected journey summary: test-results/connected/summary.html');
}
