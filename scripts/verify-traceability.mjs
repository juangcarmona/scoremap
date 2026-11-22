// Public prerequisite agreement is not producer authentication or native acceptance.
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  openRepository,
  validateBaseline,
  contentDigestBytes,
} from "@prodshape/core";
import {
  deferredBehaviour,
  requireWebBehaviours,
} from "./behaviour-evidence.mjs";

const TRACE = "docs/evidence/android/planning/epic-92/current-trace";
const PROPOSED =
  "openspec/changes/issue-79-product-change/product-change/proposed/";
const MODEL = "docs/product/model/";
const CANDIDATE =
  "43a786461f318efdb95c9dafcba0c53adf90c9e4e454e11b4d53494e8a2bedc6";
const BASELINE = "30d4d7d88f27e6d390ffbc2d80ac27a5e8fc5a8e";
const NATIVE = [
  "SB-NATIVE-COPY-IMPORT",
  "SB-NATIVE-SONG-CREATE",
  "SB-NATIVE-SONG-DELETE",
  "SB-NATIVE-SONG-RESTORE",
];
const CHANGED = [
  ...NATIVE,
  "BR-ACCESS",
  "BR-BACKUP",
  "BR-DURABILITY",
  "BR-IDENTITY",
  "BR-SESSION",
  "BC-RECOVERY",
  "LC-LIBRARY",
  "TERM-BACKUP",
  "TERM-LIBRARY",
  "JRN-PREPARE-PERFORM",
  "CON-LOCAL-FIRST",
  "CON-PLATFORM",
  "CON-SCOPE",
  "FR-BACKUP",
  "FR-PERSIST",
  "FR-REPERTOIRES",
  "FR-SONGS",
  "QR-INTEGRITY",
  "QR-READABILITY",
  "UC-BACKUP",
  "UC-PERSIST",
  "UC-REPERTOIRES",
  "UC-SONGS",
];
const MEMBERS = [
  "issue-comment.md",
  "trace.json",
  "source-binding.json",
  "provider-model.json",
  "openspec-citations.json",
  "architecture-citations.json",
  "source-assertions.json",
  "artifact-provenance.json",
];
const hex = (value) =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const digest = (value) =>
  typeof value === "string" && /^sha256:[a-f0-9]{64}$/.test(value);
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function exactSet(actual, expected, name) {
  check(
    Array.isArray(actual) && new Set(actual).size === actual.length,
    name + " duplicate inventory",
  );
  check(
    same([...actual].sort(), [...expected].sort()),
    name + " inventory mismatch",
  );
}
function relativeFile(value) {
  check(
    typeof value === "string" &&
      value.length > 0 &&
      !path.isAbsolute(value) &&
      !value.includes("\\") &&
      !value.includes("\0") &&
      value.split("/").every((p) => p && p !== "." && p !== ".."),
    "Unsafe repository path: " + value,
  );
  return value;
}
export async function readContained(root, relative) {
  relativeFile(relative);
  const realRoot = await fs.realpath(root);
  const realFile = await fs.realpath(path.join(realRoot, relative));
  check(
    realFile.startsWith(realRoot + path.sep),
    "Repository path escape: " + relative,
  );
  check(
    (await fs.stat(realFile)).isFile(),
    "Not a regular file path: " + relative,
  );
  return fs.readFile(realFile);
}
const readJson = async (root, file) =>
  JSON.parse(await readContained(root, file));

export function validatePublicRecords(decision, apply, artifacts) {
  check(
    decision.schemaVersion === 1 && apply.schemaVersion === 1,
    "Unsupported receipt schema",
  );
  check(
    decision.repository === "juangcarmona/scoremap" &&
      decision.repositoryId === 1458674261,
    "Wrong repository identity",
  );
  for (const receipt of [decision, apply]) {
    check(
      receipt.changeId === "CHG-ANDROID-NATIVE-LOCAL" &&
        receipt.changeName === "issue-79-product-change",
      "Wrong change identity",
    );
    check(receipt.baselineRevision === BASELINE, "Wrong baseline identity");
    check(
      receipt.nativeProducerRunSucceeded === false &&
        receipt.implementationOrDeviceAcceptance === false,
      "Historical phase flags must not imply native producer or implementation acceptance",
    );
  }
  check(
    apply.sourceIntegration === false,
    "Historical apply phase sourceIntegration must remain false",
  );
  check(
    decision.candidateSha256 === CANDIDATE &&
      apply.approvedCandidateSha256 === CANDIDATE,
    "Approved candidate mismatch",
  );
  check(
    apply.provider === "@prodshape/integration-openspec" &&
      apply.providerVersion === "0.6.6",
    "Wrong owning provider",
  );
  check(
    apply.outcome === "applied" &&
      apply.dryRunOutcome === "dry-run" &&
      apply.resultingModelDiagnosticCount === 0 &&
      apply.canonicalWritesPerformedBy === "applyOpenSpecProductChange",
    "Unsuccessful owning provider apply",
  );
  check(
    decision.actor === "Codex operator under existing owner delegation" &&
      typeof decision.authority === "string" &&
      decision.authority.length > 0 &&
      decision.decision ===
        "approve this exact validated Product Change after participating review and coordinator cross-review for explicit owning-provider dry-run and apply" &&
      Number.isFinite(Date.parse(decision.decidedAt)) &&
      Number.isFinite(Date.parse(apply.appliedAt)),
    "Missing delegated decision/apply identity",
  );
  exactSet(
    decision.decisionSources,
    [
      "https://github.com/juangcarmona/scoremap/issues/79#issuecomment-7063466116",
      "https://github.com/juangcarmona/scoremap/issues/79#issuecomment-7064948674",
    ],
    "decision sources",
  );
  check(
    hex(decision.reviewSha256) && hex(apply.providerReceiptSha256),
    "Malformed private blob reference digest",
  );
  const proposed = decision.proposedArtifacts;
  check(Array.isArray(proposed), "Missing proposed inventory");
  exactSet(
    proposed.map((a) => a.id),
    CHANGED,
    "proposed",
  );
  const operations = apply.diff;
  check(
    operations &&
      Array.isArray(operations.added) &&
      Array.isArray(operations.modified) &&
      Array.isArray(operations.removed),
    "Missing operation inventory",
  );
  exactSet(
    Object.keys(operations),
    ["added", "modified", "removed"],
    "operation kind",
  );
  exactSet(
    operations.added.map((a) => a.id),
    NATIVE,
    "added",
  );
  exactSet(
    operations.modified.map((a) => a.id),
    CHANGED.filter((id) => !NATIVE.includes(id)),
    "modified",
  );
  exactSet(
    operations.removed.map((a) => a.id),
    [],
    "removed",
  );
  const index = new Map(artifacts.map((a) => [a.id, a]));
  for (const [kind, rows] of Object.entries(operations))
    for (const row of rows) {
      check(row.kind === kind, "Operation kind mismatch: " + row.id);
      const proposal = proposed.find((a) => a.id === row.id);
      const canonical = index.get(row.id);
      check(
        digest(row.digest) &&
          digest(proposal.digest) &&
          row.digest === proposal.digest,
        "Receipt digest mismatch: " + row.id,
      );
      relativeFile(row.file);
      relativeFile(proposal.file);
      check(
        canonical &&
          row.file === canonical.file &&
          row.file.startsWith(MODEL) &&
          proposal.file === PROPOSED + row.file.slice(MODEL.length),
        "Canonical/proposed path binding mismatch: " + row.id,
      );
      check(
        canonical.digest === row.digest,
        "Current provider digest mismatch: " + row.id,
      );
    }
  return {
    artifacts: CHANGED.length,
    operations: { added: 4, modified: 23, removed: 0 },
    privateBlobRehash:
      "unavailable: original review/provider receipt bytes are not public",
    nativeExecution: "not established",
  };
}

export async function verifyPublicArtifacts(root, artifacts, decision, apply) {
  decision ??= await readJson(
    root,
    "docs/evidence/android/product-decision.json",
  );
  apply ??= await readJson(root, "docs/evidence/android/product-apply.json");
  const summary = validatePublicRecords(decision, apply, artifacts);
  for (const row of [...apply.diff.added, ...apply.diff.modified]) {
    const proposal = decision.proposedArtifacts.find((a) => a.id === row.id);
    for (const file of [row.file, proposal.file]) {
      check(
        contentDigestBytes(await readContained(root, file)) === row.digest,
        "Artifact digest mismatch: " + row.id + " at " + file,
      );
    }
  }
  return summary;
}

export async function verifyTraceManifest(root) {
  const manifest = await readJson(root, TRACE + "/public-manifest.json");
  check(
    manifest.schemaVersion === 1 &&
      manifest.repository === "juangcarmona/scoremap" &&
      manifest.repositoryId === 1458674261 &&
      manifest.kind === "current-source-planning-trace-not-native-acceptance",
    "Wrong trace manifest identity",
  );
  exactSet(
    manifest.files.map((f) => f.path),
    MEMBERS,
    "manifest members",
  );
  for (const member of manifest.files) {
    relativeFile(member.path);
    const bytes = await readContained(root, TRACE + "/" + member.path);
    check(
      hex(member.sha256) &&
        member.bytes === bytes.length &&
        member.sha256 === sha(bytes),
      "Trace manifest byte mismatch: " + member.path,
    );
  }
  const { proof } = await readJson(root, TRACE + "/trace.json");
  check(
    manifest.parent === 92 &&
      manifest.sourceRevision === proof.currentSource &&
      manifest.sourceTree === proof.currentTree &&
      manifest.actualCiRun === proof.actualCiRun &&
      manifest.actualCiCheckout === proof.actualReportCheckout &&
      proof.actualCiUrl ===
        "https://github.com/juangcarmona/scoremap/actions/runs/" +
          manifest.actualCiRun,
    "Trace manifest historical origin mismatch",
  );
  return { members: manifest.files.length };
}

export function validateTrace(trace, artifacts, binding) {
  const index = new Map(artifacts.map((a) => [a.id, a]));
  const behaviours = artifacts.filter((a) => a.type === "structured-behaviour");
  exactSet(
    trace.behaviours.map((b) => b.id),
    behaviours.map((b) => b.id),
    "behaviour",
  );
  check(
    trace.proof.repository === "juangcarmona/scoremap" &&
      trace.proof.repositoryId === 1458674261 &&
      trace.proof.nativeExecuted === 0 &&
      trace.proof.testsReexecuted === false,
    "Trace native execution/identity inflation",
  );
  const witnessIds = Object.keys(trace.actualTests);
  for (const [id, witness] of Object.entries(trace.actualTests)) {
    check(
      witness.testId === id &&
        witness.outcome === "passed" &&
        witness.title &&
        id.endsWith(witness.title),
      "Invalid historical witness identity: " + id,
    );
    check(
      [
        "Vitest JS/domain/component",
        "anonymous web browser",
        "real connected private-service/browser fixture",
      ].includes(witness.provider),
      "Unsupported historical witness provider",
    );
    relativeFile(witness.file);
    relativeFile(witness.report);
    check(
      hex(witness.sourceSha256) &&
        binding.filesSha256[witness.file] === witness.sourceSha256,
      "Historical witness source binding mismatch: " + id,
    );
    check(
      hex(
        binding.reportFilesSha256[witness.report] ??
          (witness.report.startsWith("test-results/connected/")
            ? binding.connectedReportSha256
            : null),
      ),
      "Missing historical report binding: " + id,
    );
    check(
      witness.citations.length > 0 && witness.assertionLines.length > 0,
      "Missing historical witness assertions: " + id,
    );
    requireWebBehaviours(witness.citations.map((c) => c.id));
    for (const citation of witness.citations) {
      check(
        index.get(citation.id)?.digest === citation.digest,
        "Historical witness citation mismatch: " + citation.id,
      );
    }
  }
  for (const row of trace.behaviours) {
    const artifact = index.get(row.id);
    const fm = artifact.frontmatter;
    check(
      row.source === artifact.file && row.providerDigest === artifact.digest,
      "Trace current provider binding mismatch: " + row.id,
    );
    check(
      same(row.scenario, { given: fm.given, when: fm.when, then: fm.then }),
      "Trace scenario mismatch: " + row.id,
    );
    exactSet(row.illustrates, fm.illustrates, "illustrates " + row.id);
    check(
      same(row.coversTransition, fm["covers-transition"] ?? null),
      "Trace transition mismatch: " + row.id,
    );
    const requirements = artifacts
      .filter((a) =>
        a.frontmatter.verification?.some((v) => v["scenario-ref"] === row.id),
      )
      .map((a) => a.id);
    exactSet(
      row.requirements,
      requirements,
      "requirement references " + row.id,
    );
    const expectedWitnesses = witnessIds.filter((id) =>
      trace.actualTests[id].citations.some((c) => c.id === row.id),
    );
    exactSet(row.actualPassedTestIds, expectedWitnesses, "witnesses " + row.id);
    const deferred = deferredBehaviour(row.id);
    if (deferred) {
      check(
        !row.actualPassedTestIds.length &&
          row.inconclusiveRecords.length > 0 &&
          row.inconclusiveRecords.every(
            (r) =>
              r.outcome === "inconclusive" &&
              r.citations.some(
                (c) => c.id === row.id && c.digest === artifact.digest,
              ),
          ),
        "Expected inconclusive pending witness: " + row.id,
      );
      check(
        row.providerCoverageStatus ===
          (deferred.platform === "android"
            ? "pending-native-qualification"
            : "deferred-unimplemented"),
        "Pending status inflation: " + row.id,
      );
    } else {
      check(
        row.actualPassedTestIds.length > 0 &&
          row.providerCoverageStatus === "executed-passed",
        "Undeclared missing historical witness: " + row.id,
      );
    }
    check(
      row.plannedNative &&
        row.plannedNative.status ===
          "planned only, not authored/executed native tests",
      "Native plan inflation: " + row.id,
    );
  }
  const edges = artifacts
    .filter((a) => a.type === "domain-lifecycle")
    .flatMap((a) => a.frontmatter.transitions.map((t) => ({ a, t })));
  exactSet(
    trace.lifecycleEdges.map((e) => e.lifecycle + ":" + e.transition),
    edges.map(({ a, t }) => a.id + ":" + t.id),
    "lifecycle",
  );
  for (const edge of trace.lifecycleEdges) {
    const artifact = index.get(edge.lifecycle);
    const transition = artifact.frontmatter.transitions.find(
      (t) => t.id === edge.transition,
    );
    check(
      edge.source === artifact.file &&
        edge.providerDigest === artifact.digest &&
        same(edge.from, transition.from) &&
        edge.to === transition.to &&
        edge.trigger === transition.trigger,
      "Lifecycle transition mismatch: " +
        edge.lifecycle +
        ":" +
        edge.transition,
    );
    exactSet(edge.governedBy, transition["governed-by"], "lifecycle rules");
    const covered = trace.behaviours.filter(
      (b) =>
        b.coversTransition?.lifecycle === edge.lifecycle &&
        b.coversTransition.transition === edge.transition,
    );
    exactSet(
      edge.behaviours.map((b) => b.id),
      covered.map((b) => b.id),
      "lifecycle behaviours",
    );
    for (const row of edge.behaviours)
      exactSet(
        row.actualPassedTestIds,
        covered.find((b) => b.id === row.id).actualPassedTestIds,
        "lifecycle witnesses",
      );
    check(
      edge.nativeExecution === "none",
      "Lifecycle native execution inflation",
    );
  }
  const requirements = artifacts.filter((a) =>
    ["functional-requirement", "quality-requirement"].includes(a.type),
  );
  exactSet(
    trace.requirements.map((r) => r.id),
    requirements.map((a) => a.id),
    "requirements",
  );
  for (const row of trace.requirements) {
    const artifact = index.get(row.id);
    check(
      row.source === artifact.file && row.digest === artifact.digest,
      "Requirement binding mismatch: " + row.id,
    );
    exactSet(
      row.scenarioReferences,
      artifact.frontmatter.verification
        .filter((v) => v["scenario-ref"])
        .map((v) => v["scenario-ref"]),
      "requirement scenarios",
    );
  }
  return {
    behaviours: behaviours.length,
    lifecycleEdges: edges.length,
    historicalWitnesses: witnessIds.length,
    nativePending: NATIVE.length,
    pdfDeferred: trace.behaviours.filter(
      (b) => deferredBehaviour(b.id)?.issue === 13,
    ).length,
    nativeExecuted: 0,
  };
}

export async function verifyTraceSources(root, trace, assertions, binding) {
  const changedHistoricalInputs = [];
  for (const [file, expected] of Object.entries(binding.filesSha256)) {
    relativeFile(file);
    check(hex(expected), "Malformed historical source hash: " + file);
    let bytes;
    try {
      bytes = await readContained(root, file);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (!bytes || sha(bytes) !== expected) changedHistoricalInputs.push(file);
  }
  for (const witness of Object.values(trace.actualTests)) {
    const declaration = assertions.find(
      (a) => a.file === witness.file && a.line === witness.sourceLine,
    );
    check(
      declaration &&
        declaration.assertions.length > 0 &&
        witness.assertionLines.every((line) =>
          declaration.assertions.some((a) => a.line === line),
        ),
      "Missing assertion mapping: " + witness.testId,
    );
    if (changedHistoricalInputs.includes(witness.file)) continue;
    const text = (await readContained(root, witness.file)).toString("utf8");
    for (const assertion of declaration.assertions)
      check(
        text.includes(assertion.text),
        "Historical assertion text mismatch: " +
          witness.file +
          ":" +
          assertion.line,
      );
  }
  return {
    historicalWitnesses: Object.keys(trace.actualTests).length,
    changedHistoricalInputs,
    historicalResultsOnly: true,
    currentRuntimeQualified: false,
  };
}

export async function verifyCurrentCitations(root) {
  const cli = path.join(root, "node_modules/@prodshape/cli/dist/bin.js");
  const reports = {};
  const scratch = await fs.mkdtemp(
    path.join(os.tmpdir(), "scoremap-citations-"),
  );
  try {
    for (const [name, args] of [
      ["openspec", ["--provider", "openspec"]],
      ["architecture", ["docs/architecture"]],
    ]) {
      // The owning CLI exits synchronously; a pipe can truncate its large JSON.
      // A regular file preserves its exact output; malformed output still refuses.
      const output = path.join(scratch, name + ".json");
      const handle = await fs.open(output, "wx", 0o600);
      try {
        execFileSync(
          process.execPath,
          [cli, "citations", "verify", ...args, "--format", "json"],
          {
            cwd: root,
            stdio: ["ignore", handle.fd, "pipe"],
            maxBuffer: 1024 * 1024,
          },
        );
      } finally {
        await handle.close();
      }
      const report = JSON.parse(await fs.readFile(output, "utf8"));
      check(
        !report.diagnostics.some((d) => d.severity === "error") &&
          report.citations.every((c) => c.status === "current") &&
          !(
            report.summary.errors ||
            report.summary.stale ||
            report.summary.tampered ||
            report.summary.unresolved ||
            report.summary.unclassified
          ),
        "Current owning citation validation failed: " + name,
      );
      reports[name] = report.summary;
    }
    return reports;
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}

export async function verifyTraceability(root = process.cwd()) {
  const baseline = await validateBaseline(
    await openRepository(root, "v1alpha2"),
  );
  check(
    !baseline.diagnostics.some((d) => d.severity === "error"),
    "Current canonical provider model is invalid",
  );
  const product = await verifyPublicArtifacts(root, baseline.artifacts);
  const manifest = await verifyTraceManifest(root);
  const trace = await readJson(root, TRACE + "/trace.json");
  const binding = await readJson(root, TRACE + "/source-binding.json");
  const retainedModel = await readJson(root, TRACE + "/provider-model.json");
  exactSet(
    retainedModel.artifacts.map((a) => a.id),
    baseline.artifacts.map((a) => a.id),
    "retained provider artifacts",
  );
  for (const artifact of retainedModel.artifacts)
    check(
      baseline.artifacts.some(
        (a) =>
          a.id === artifact.id &&
          a.digest === artifact.digest &&
          a.file === artifact.file &&
          a.type === artifact.type,
      ),
      "Retained provider artifact differs: " + artifact.id,
    );
  const mapping = validateTrace(trace, baseline.artifacts, binding);
  const sources = await verifyTraceSources(
    root,
    trace,
    await readJson(root, TRACE + "/source-assertions.json"),
    binding,
  );
  const citations = await verifyCurrentCitations(root);
  return {
    status: "public-prerequisites-verified",
    product,
    manifest,
    mapping,
    citations,
    ...sources,
    historicalExecutionOrigin: {
      revision: trace.proof.currentSource,
      tree: trace.proof.currentTree,
      url: trace.proof.actualCiUrl,
    },
    nativeExecution: "not established",
    nativeAcceptance: "not established",
    historicalCandidateRecomputed: false,
    limits: [
      "Public receipt agreement does not authenticate unavailable original private blobs or a new native producer.",
      "Historical web/private witnesses do not qualify the current runtime, complete SB/LC invariants or Android.",
      "Later native implementation and source-bound host/device/release/musician acceptance remain separate gates.",
    ],
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const args = process.argv.slice(2);
    check(
      args.length === 0 || (args.length === 2 && args[0] === "--root"),
      "Usage: verify-traceability.mjs [--root repository]",
    );
    console.log(
      JSON.stringify(
        await verifyTraceability(args[1] ?? process.cwd()),
        null,
        2,
      ),
    );
  } catch (error) {
    console.error("Native traceability verification failed: " + error.message);
    process.exitCode = 1;
  }
}
