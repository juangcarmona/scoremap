import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  openRepository,
  validateBaseline,
  contentDigestBytes,
  parseCitations,
  verifyCitations,
} from "@prodshape/core";
import {
  validatePublicRecords,
  verifyPublicArtifacts,
  validateTrace,
  readContained,
  verifyTraceManifest,
  verifyTraceSources,
  verifyCurrentCitations,
  verifyTraceability,
} from "../../scripts/verify-traceability.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const traceRoot = "docs/evidence/android/planning/epic-92/current-trace";
const json = async (file) =>
  JSON.parse(await fs.readFile(path.join(root, file), "utf8"));
const decision = await json("docs/evidence/android/product-decision.json");
const apply = await json("docs/evidence/android/product-apply.json");
const trace = await json(traceRoot + "/trace.json");
const binding = await json(traceRoot + "/source-binding.json");
const assertions = await json(traceRoot + "/source-assertions.json");
const baseline = await validateBaseline(await openRepository(root, "v1alpha2"));
assert.equal(
  baseline.diagnostics.filter((d) => d.severity === "error").length,
  0,
);
const artifacts = baseline.artifacts;
const clone = structuredClone;

test("AND00 public27 canonical/proposed bindings agree without private-blob or Android claims", async () => {
  const result = await verifyPublicArtifacts(root, artifacts, decision, apply);
  assert.equal(result.artifacts, 27);
  assert.deepEqual(result.operations, { added: 4, modified: 23, removed: 0 });
  assert.equal(
    result.privateBlobRehash,
    "unavailable: original review/provider receipt bytes are not public",
  );
  assert.equal(result.nativeExecution, "not established");
});

test("AND00 refuses wrong repository, candidate, change and owning provider independently", () => {
  for (const [target, key, value] of [
    ["decision", "repositoryId", 1],
    ["decision", "repository", "elsewhere/repo"],
    ["apply", "approvedCandidateSha256", "0".repeat(64)],
    ["apply", "changeId", "CHG-OTHER"],
    ["decision", "decision", "rejected"],
    ["apply", "provider", "@prodshape/core"],
    ["apply", "providerVersion", "0.0.0"],
  ]) {
    const d = clone(decision);
    const a = clone(apply);
    (target === "decision" ? d : a)[key] = value;
    assert.throws(
      () => validatePublicRecords(d, a, artifacts),
      /identity|candidate|provider|change|repository/i,
    );
  }
});

test("AND00 rejects missing, duplicate and wrong-kind operations even with plausible totals", () => {
  const missing = clone(apply);
  missing.diff.modified.pop();
  assert.throws(
    () => validatePublicRecords(decision, missing, artifacts),
    /inventory/i,
  );
  const duplicate = clone(apply);
  duplicate.diff.added[1] = clone(duplicate.diff.added[0]);
  assert.throws(
    () => validatePublicRecords(decision, duplicate, artifacts),
    /duplicate|inventory/i,
  );
  const kind = clone(apply);
  kind.diff.added[0].kind = "modified";
  assert.throws(
    () => validatePublicRecords(decision, kind, artifacts),
    /kind/i,
  );
  const extra = clone(apply);
  extra.diff.extra = [{ ...extra.diff.modified[0], kind: "extra" }];
  assert.throws(
    () => validatePublicRecords(decision, extra, artifacts),
    /operation.*kind|inventory/i,
  );
  const unknown = clone(apply);
  unknown.diff.other = [];
  assert.throws(
    () => validatePublicRecords(decision, unknown, artifacts),
    /operation.*kind|inventory/i,
  );
  const both = clone(decision);
  const also = clone(apply);
  both.proposedArtifacts.pop();
  also.diff.modified.pop();
  assert.throws(
    () => validatePublicRecords(both, also, artifacts),
    /inventory/i,
  );
});

test("AND00 preserves historical false phase flags and rejects phase inflation", () => {
  for (const [target, key] of [
    ["decision", "nativeProducerRunSucceeded"],
    ["decision", "implementationOrDeviceAcceptance"],
    ["apply", "nativeProducerRunSucceeded"],
    ["apply", "sourceIntegration"],
    ["apply", "implementationOrDeviceAcceptance"],
  ]) {
    const d = clone(decision);
    const a = clone(apply);
    (target === "decision" ? d : a)[key] = true;
    assert.throws(() => validatePublicRecords(d, a, artifacts), /phase/i);
  }
});

test("AND00 provider digest uses actual LF normalization, rejects wrong content and malformed digest", async (t) => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "scoremap-and00-"));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  for (const row of [...apply.diff.added, ...apply.diff.modified]) {
    const proposed = decision.proposedArtifacts.find((a) => a.id === row.id);
    for (const file of [row.file, proposed.file]) {
      await fs.mkdir(path.dirname(path.join(temp, file)), { recursive: true });
      const bytes = await fs.readFile(path.join(root, file));
      await fs.writeFile(
        path.join(temp, file),
        bytes.toString("utf8").replace(/\n/g, "\r\n"),
      );
      assert.equal(
        contentDigestBytes(bytes),
        contentDigestBytes(await fs.readFile(path.join(temp, file))),
      );
    }
  }
  // A later foundation directory is allowed; it supplies no native execution.
  await fs.mkdir(path.join(temp, "src/android"), { recursive: true });
  assert.equal(
    (await verifyPublicArtifacts(temp, artifacts, decision, apply)).artifacts,
    27,
  );
  assert.equal(validateTrace(trace, artifacts, binding).nativeExecuted, 0);
  await fs.appendFile(
    path.join(temp, apply.diff.added[0].file),
    "\nChanged payload.\n",
  );
  await assert.rejects(
    verifyPublicArtifacts(temp, artifacts, decision, apply),
    /digest.*SB-NATIVE-COPY-IMPORT/i,
  );
  const malformed = clone(decision);
  malformed.proposedArtifacts[0].digest = "not-a-digest";
  assert.throws(
    () => validatePublicRecords(malformed, apply, artifacts),
    /digest/i,
  );
});

test("AND00 rejects traversal, symlink escape, missing files and noncanonical binding", async (t) => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "scoremap-and00-path-"));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  await fs.symlink(path.join(root, "package.json"), path.join(temp, "escape"));
  for (const name of [
    "../package.json",
    "/etc/passwd",
    "a/../package.json",
    "escape",
    "missing",
  ]) {
    await assert.rejects(
      readContained(temp, name),
      /path|escape|missing|ENOENT/i,
    );
  }
  const d = clone(decision);
  d.proposedArtifacts[0].file = "../outside.md";
  assert.throws(() => validatePublicRecords(d, apply, artifacts), /path/i);
  const a = clone(apply);
  a.diff.added[0].file = "docs/product/model/business-rules/br-access.md";
  assert.throws(
    () => validatePublicRecords(decision, a, artifacts),
    /path|binding/i,
  );
});

test("AND00 manifest verifies real retained member bytes and rejects tampering", async (t) => {
  assert.equal((await verifyTraceManifest(root)).members, 8);
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "scoremap-and00-pack-"));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  await fs.cp(path.join(root, traceRoot), path.join(temp, traceRoot), {
    recursive: true,
  });
  await fs.appendFile(
    path.join(temp, traceRoot, "source-assertions.json"),
    " ",
  );
  await assert.rejects(
    verifyTraceManifest(temp),
    /manifest.*source-assertions/i,
  );
  await fs.cp(path.join(root, traceRoot), path.join(temp, traceRoot), {
    recursive: true,
  });
  const manifestFile = path.join(temp, traceRoot, "public-manifest.json");
  const alteredOrigin = JSON.parse(await fs.readFile(manifestFile, "utf8"));
  alteredOrigin.actualCiRun = 1;
  await fs.writeFile(manifestFile, JSON.stringify(alteredOrigin));
  await assert.rejects(verifyTraceManifest(temp), /manifest.*origin/i);
});

test("AND00 complete63 SB16 LC mapping retains102 historical witnesses and seven inconclusive rows", () => {
  const result = validateTrace(trace, artifacts, binding);
  assert.deepEqual(result, {
    behaviours: 63,
    lifecycleEdges: 16,
    historicalWitnesses: 102,
    nativePending: 4,
    pdfDeferred: 3,
    nativeExecuted: 0,
  });
});

test("AND00 rejects missing preserved musical SB, missing edge and wrong native lifecycle mapping", () => {
  const sb = clone(trace);
  sb.behaviours = sb.behaviours.filter((b) => b.id !== "SB-CHORD-ASSIGN");
  assert.throws(
    () => validateTrace(sb, artifacts, binding),
    /behaviour inventory/i,
  );
  const lc = clone(trace);
  lc.lifecycleEdges = lc.lifecycleEdges.filter(
    (e) => e.transition !== "DELETE-LAST",
  );
  assert.throws(
    () => validateTrace(lc, artifacts, binding),
    /lifecycle inventory/i,
  );
  const mapped = clone(trace);
  mapped.behaviours.find(
    (b) => b.id === "SB-NATIVE-SONG-RESTORE",
  ).coversTransition.lifecycle = "LC-SONG-RETENTION";
  assert.throws(
    () => validateTrace(mapped, artifacts, binding),
    /transition.*SB-NATIVE-SONG-RESTORE/i,
  );
});

test("AND00 refuses native/PDF execution inflation and unknown missing web witness", () => {
  for (const id of [
    "SB-NATIVE-SONG-CREATE",
    "SB-PDF-ATTACH",
    "SB-CHORD-ASSIGN",
  ]) {
    const changed = clone(trace);
    const row = changed.behaviours.find((b) => b.id === id);
    row.actualPassedTestIds =
      id === "SB-CHORD-ASSIGN" ? [] : [Object.keys(trace.actualTests)[0]];
    row.providerCoverageStatus = row.actualPassedTestIds.length
      ? "executed-passed"
      : "deferred-unimplemented";
    assert.throws(
      () => validateTrace(changed, artifacts, binding),
      /witness|inconclusive|native|undeclared/i,
    );
  }
  const changed = clone(trace);
  const witness = Object.values(changed.actualTests)[0];
  witness.citations.push({
    id: "SB-NATIVE-SONG-CREATE",
    digest: decision.proposedArtifacts.find(
      (a) => a.id === "SB-NATIVE-SONG-CREATE",
    ).digest,
  });
  assert.throws(() => validateTrace(changed, artifacts, binding), /native/i);
});

test("AND00 checks actual assertion text and marks changed inputs stale without requalifying runtime", async () => {
  const result = await verifyTraceSources(root, trace, assertions, binding);
  assert.equal(result.historicalWitnesses, 102);
  assert.equal(result.currentRuntimeQualified, false);
  assert.ok(result.changedHistoricalInputs.includes("package.json"));
  const changed = clone(assertions);
  changed[0].assertions[0].text = "expect(INVENTED).toEqual(true);";
  await assert.rejects(
    verifyTraceSources(root, trace, changed, binding),
    /assertion/i,
  );
});

test("AND00 owning citation verifier rejects an actual stale fixture citation", async (t) => {
  const target = artifacts.find((a) => a.id === "SB-NATIVE-SONG-CREATE");
  const text =
    '<!-- pdac:cite id="SB-NATIVE-SONG-CREATE" digest="sha256:' +
    "0".repeat(64) +
    '" -->';
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "scoremap-and00-citation-"),
  );
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  await fs.writeFile(path.join(temp, "fixture.md"), text);
  const { records } = await parseCitations(path.join(temp, "fixture.md"), temp);
  assert.equal(verifyCitations(records, artifacts)[0].status, "stale");
  const reports = await verifyCurrentCitations(root);
  assert.ok(reports.openspec.current > 0);
  assert.ok(reports.architecture.current > 0);
  assert.ok(target);
});

test("AND00 CLI is import-safe, fails malformed root and reports no native acceptance", async () => {
  const imported = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      'await import("./scripts/verify-traceability.mjs")',
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(imported.status, 0);
  assert.equal(imported.stdout, "");
  const failed = spawnSync(
    process.execPath,
    [
      path.join(root, "scripts/verify-traceability.mjs"),
      "--root",
      path.join(os.tmpdir(), "absent-scoremap-and00-root"),
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.notEqual(failed.status, 0);
  const summary = await verifyTraceability(root);
  assert.equal(summary.status, "public-prerequisites-verified");
  assert.equal(summary.nativeExecution, "not established");
  assert.equal(summary.currentRuntimeQualified, false);
  assert.equal(summary.historicalCandidateRecomputed, false);
});

test("AND00 package wiring adds checks without removing any frozen baseline hook", async () => {
  const current = await json("package.json");
  // Literal baseline: portable in shallow native checkouts without historical Git objects.
  const old = {
    scripts: {
      "verify:product": "prodshape --serialization-version v1alpha2 validate",
      "verify:citations":
        "prodshape citations verify --provider openspec --format json && prodshape citations verify docs/architecture --format json",
      "verify:architecture":
        "arcshape validate --docs docs/architecture --links --citations",
      "verify:baseline":
        "lighthouse verify && node scripts/lighthouse-guard.mjs verify",
      "verify:specs": "openspec validate --all --strict --no-interactive",
      verify:
        "npm run verify:product && npm run verify:citations && npm run verify:architecture && npm run verify:baseline && npm run verify:specs && npm run verify:development-fixture && npm run verify:music-catalogue && npm run verify:backend && npm run verify:private-api-contract && npm run verify:private-api-types && npm run verify:private-api-client && npm run verify:deployment && npm run verify:security && npm run verify:frontend-boundaries && npm run verify:app",
      dev: "vite --host 0.0.0.0",
      build: "tsc --noEmit && vite build",
      preview: "vite preview",
      typecheck: "tsc --noEmit",
      lint: "eslint src tests",
      "format:check":
        'prettier --check "src/**/*.{ts,tsx,css}" "tests/**/*.{ts,tsx}" "*.config.{ts,js}"',
      format:
        'prettier --write "src/**/*.{ts,tsx,css}" "tests/**/*.{ts,tsx}" "*.config.{ts,js}"',
      test: "vitest run",
      "test:e2e": "playwright install chromium && playwright test",
      "verify:app":
        "npm run typecheck && npm run lint && npm run format:check && npm test && npm run build",
      "evidence:record":
        "node scripts/record-verification.mjs && prodshape evidence verify docs/evidence/mvp/verification-evidence.json --format json",
      "verify:delivery": "node scripts/verify-delivery.mjs",
      "build:private": "VITE_SCOREMAP_PRIVATE=1 npm run build",
      "dev:private": "node scripts/dev-private.mjs",
      "verify:backend": "npm run verify:dotnet",
      "test:connected":
        "playwright test --config=playwright.connected.config.ts",
      "verify:security":
        "node --test tests/security/*.test.mjs && node scripts/verify-security.mjs",
      "verify:dotnet":
        "node node_modules/@juangcarmona/lighthouse/src/verify-dotnet.mjs && node scripts/verify-backend-boundaries.mjs && node --test tests/architecture/analyzer-visibility.test.mjs && node tests/architecture/verify-module-analyzer-severity.mjs && node --test tests/architecture/analyzer-severity.test.mjs && node --test tests/architecture/lighthouse-handler-contracts.test.mjs",
      "verify:frontend-boundaries":
        "node scripts/verify-frontend-boundaries.mjs && node --test tests/architecture/frontend-boundaries.test.mjs",
      "build:container": "node scripts/build-container.mjs",
      "verify:development-fixture":
        "node --test tests/deployment/development-fixture.test.mjs tests/deployment/connected-qualification.test.mjs tests/deployment/connected-report.test.mjs tests/deployment/behaviour-evidence.test.mjs tests/deployment/native-implementation-policy.test.mjs",
      "report:connected": "node scripts/connected-report.mjs",
      "verify:music-catalogue": "node scripts/harmony-catalogue.mjs",
      "verify:deployment": "node scripts/publish-production.mjs --verify",
      "publish:production": "node scripts/publish-production.mjs",
      "test:deployment": "python3 scripts/qualify-production.py",
      "test:session-vault": "python3 scripts/qualify-session-vault.py",
      "verify:connected": "node scripts/verify-connected.mjs",
      "test:deployment-schema":
        "python3 tests/deployment/qualify-future-schema.py",
      "verify:private-api-contract":
        "node scripts/verify-private-api-contract.mjs",
      "test:deployment-migration":
        "python3 tests/deployment/qualify-migration-rollback.py",
      "test:deployment-proxy":
        "python3 tests/deployment/qualify-untrusted-proxy.py",
      "build:pdf-validator": "node scripts/build-pdf-validator.mjs",
      "test:pdf-validator": "python3 tests/pdf/qualify-validator.py",
      "generate:private-api-types":
        "node scripts/generate-private-api-types.mjs",
      "verify:private-api-types":
        "node scripts/generate-private-api-types.mjs --check",
      "generate:private-api-client":
        "node scripts/generate-private-api-client.mjs",
      "verify:private-api-client":
        "node scripts/generate-private-api-client.mjs --check && node --test tests/contract/generated-client-drift.test.mjs",
    },
    devDependencies: {
      "@arcshape/cli": "0.4.0",
      "@axe-core/playwright": "4.14.0",
      "@eslint/js": "10.0.1",
      "@fission-ai/openspec": "1.15.0",
      "@hey-api/openapi-ts": "0.97.3",
      "@juangcarmona/lighthouse": "0.13.27",
      "@juangcarmona/lighthouse-sdlc": "0.30.1",
      "@playwright/test": "1.65.1",
      "@prodshape/cli": "0.26.1",
      "@testing-library/jest-dom": "7.0.1",
      "@testing-library/react": "16.3.3",
      "@testing-library/user-event": "14.6.10",
      "@types/node": "26.6.6",
      "@types/react": "19.3.0",
      "@types/react-dom": "19.3.0",
      "@vitejs/plugin-react": "6.3.0",
      eslint: "10.15.0",
      "eslint-plugin-react-hooks": "7.1.1",
      "eslint-plugin-react-refresh": "0.5.8",
      "fake-indexeddb": "6.2.8",
      jsdom: "31.0.1",
      "markdownlint-cli2": "0.24.1",
      "playwright-core": "1.65.1",
      prettier: "3.10.1",
      typescript: "6.0.3",
      "typescript-eslint": "8.73.0",
      vite: "8.3.8",
      "vite-plugin-pwa": "2.0.0",
      vitest: "5.1.0",
      yaml: "2.9.1",
    },
  };
  for (const [key, value] of Object.entries(old.scripts))
    assert.ok(current.scripts[key].includes(value), key);
  assert.equal(
    current.scripts["verify:traceability"],
    "node scripts/verify-traceability.mjs",
  );
  assert.ok(current.scripts.verify.includes("npm run verify:traceability"));
  assert.ok(
    current.scripts["verify:development-fixture"].includes(
      "tests/deployment/native-product-traceability.test.mjs",
    ),
  );
  assert.deepEqual(current.devDependencies, old.devDependencies);
});
