#!/usr/bin/env node
// AND-00: verifies the integrated native Android product baseline.
// It reads the published decision/apply receipts and the canonical model; it never
// replays Product Change apply and never treats a receipt as native acceptance.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const CHANGE_ID = "CHG-ANDROID-NATIVE-LOCAL";
export const CHANGE_NAME = "issue-79-product-change";
export const REPOSITORY = "juangcarmona/scoremap";
export const REPOSITORY_ID = 1458674261;
export const EXPECTED_BINDINGS = 27;

// Native structured behaviours and the LC-LIBRARY transition each one covers.
export const NATIVE_BEHAVIOURS = Object.freeze({
  "SB-NATIVE-SONG-CREATE": {
    file: "sb-native-song-create.md",
    transition: "CREATE-FIRST",
  },
  "SB-NATIVE-SONG-DELETE": {
    file: "sb-native-song-delete.md",
    transition: "DELETE-LAST",
  },
  "SB-NATIVE-SONG-RESTORE": {
    file: "sb-native-song-restore.md",
    transition: "RESTORE",
  },
  "SB-NATIVE-COPY-IMPORT": {
    file: "sb-native-copy-import.md",
    transition: "IMPORT-POPULATED",
  },
});

// Musical acceptance carried forward for AND-04 TDD. Each rule must stay in the model.
export const MUSICAL_TRACEABILITY = Object.freeze({
  "BR-EDIT-GUARD": "every content mutation passes the edit-mode guard",
  "BR-IDENTITY":
    "stable identities; import always yields fresh owned identities",
  "BR-STRUCTURE": "section identity, order and repeats",
  "BR-CHORDS": "spelled harmony and exact pitches stay separate",
  "BR-BACKUP": "complete portable transfer with atomic import",
  "BR-DURABILITY": "acknowledged atomic commit preserving durable data",
  "LC-LIBRARY": "active song presence lifecycle",
  "LC-STRUCTURE": "section structure lifecycle",
});

// Outcomes the receipts must never claim: they belong to later stages.
export const PENDING_NATIVE_FLAGS = Object.freeze([
  "nativeProducerRunSucceeded",
  "sourceIntegration",
  "implementationOrDeviceAcceptance",
]);

const digest = (bytes) =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const field = (text, name) =>
  new RegExp(`^${name}:\\s*(.+?)\\s*$`, "mu")
    .exec(text)?.[1]
    ?.replace(/^"|"$/gu, "");

async function readText(root, path, diagnostics) {
  try {
    return await readFile(resolve(root, path), "utf8");
  } catch {
    diagnostics.push(`missing file: ${path}`);
    return null;
  }
}

async function readJson(root, path, diagnostics) {
  const text = await readText(root, path, diagnostics);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    diagnostics.push(`invalid JSON: ${path}`);
    return null;
  }
}

function verifyDecision(decision, apply, diagnostics) {
  if (
    decision.repository !== REPOSITORY ||
    decision.repositoryId !== REPOSITORY_ID
  ) {
    diagnostics.push(
      `decision targets ${decision.repository}/${decision.repositoryId}, not ${REPOSITORY}/${REPOSITORY_ID}`,
    );
  }
  if (decision.changeId !== CHANGE_ID || decision.changeName !== CHANGE_NAME) {
    diagnostics.push("decision does not identify the native product change");
  }
  if (decision.candidateSha256 !== apply.approvedCandidateSha256) {
    diagnostics.push(
      "apply receipt candidate differs from the recorded operator decision",
    );
  }
  if (decision.baselineRevision !== apply.baselineRevision) {
    diagnostics.push(
      "decision and apply receipt disagree on the baseline revision",
    );
  }
}

function verifyApply(apply, diagnostics) {
  if (apply.changeId !== CHANGE_ID || apply.changeName !== CHANGE_NAME) {
    diagnostics.push(
      "apply receipt does not identify the native product change",
    );
  }
  if (apply.outcome !== "applied")
    diagnostics.push(`apply outcome is ${apply.outcome}, not applied`);
  if (apply.dryRunOutcome !== "dry-run")
    diagnostics.push("apply receipt lacks a dry-run outcome");
  if (apply.canonicalWritesPerformedBy !== "applyOpenSpecProductChange") {
    diagnostics.push(
      "canonical writes were not performed by the provider apply route",
    );
  }
  if (apply.resultingModelDiagnosticCount !== 0)
    diagnostics.push("applied model reported diagnostics");
  for (const flag of PENDING_NATIVE_FLAGS) {
    if (apply[flag] !== false)
      diagnostics.push(
        `receipt must keep ${flag} false: native execution is not accepted by apply`,
      );
  }
  const entries = [
    ...(apply.diff?.added ?? []),
    ...(apply.diff?.modified ?? []),
  ];
  if (entries.length !== EXPECTED_BINDINGS) {
    diagnostics.push(
      `expected ${EXPECTED_BINDINGS} canonical bindings, found ${entries.length}`,
    );
  }
  return entries;
}

async function verifyBindings(root, entries, diagnostics) {
  const seen = new Set();
  for (const entry of entries) {
    if (seen.has(entry.id)) diagnostics.push(`duplicate binding ${entry.id}`);
    seen.add(entry.id);
    const text = await readFile(resolve(root, entry.file)).catch(() => null);
    if (text === null) {
      diagnostics.push(`binding ${entry.id} points at missing ${entry.file}`);
      continue;
    }
    if (digest(text) !== entry.digest)
      diagnostics.push(`binding ${entry.id} digest differs from ${entry.file}`);
    if (field(text.toString("utf8"), "id") !== entry.id)
      diagnostics.push(`${entry.file} does not declare id ${entry.id}`);
  }
  return seen;
}

async function verifyNativeBehaviours(root, bound, diagnostics) {
  const lifecycle = await readText(
    root,
    "docs/product/model/domain/lifecycles/lc-library.md",
    diagnostics,
  );
  for (const [id, { file, transition }] of Object.entries(NATIVE_BEHAVIOURS)) {
    if (!bound.has(id))
      diagnostics.push(`${id} is not bound by the apply receipt`);
    const text = await readText(
      root,
      `docs/product/model/behaviours/${file}`,
      diagnostics,
    );
    if (text === null) continue;
    if (field(text, "id") !== id)
      diagnostics.push(`${file} does not declare ${id}`);
    const covers =
      /covers-transition:\s*\n\s+lifecycle:\s*(\S+)\s*\n\s+transition:\s*(\S+)/u.exec(
        text,
      );
    if (covers?.[1] !== "LC-LIBRARY" || covers?.[2] !== transition) {
      diagnostics.push(`${id} must cover LC-LIBRARY ${transition}`);
    }
    if (
      lifecycle !== null &&
      !new RegExp(`- id: ${transition}\\b`, "u").test(lifecycle)
    ) {
      diagnostics.push(
        `LC-LIBRARY lacks transition ${transition} required by ${id}`,
      );
    }
  }
}

async function verifyMusicalTraceability(root, diagnostics) {
  const found = new Map();
  const dirs = [
    "business-rules",
    "domain/lifecycles",
    "domain/terms",
    "domain",
  ];
  for (const id of Object.keys(MUSICAL_TRACEABILITY)) {
    let hit = false;
    for (const dir of dirs) {
      const slug = id.toLowerCase();
      const text = await readFile(
        resolve(root, `docs/product/model/${dir}/${slug}.md`),
        "utf8",
      ).catch(() => null);
      if (text !== null && field(text, "id") === id) hit = true;
    }
    found.set(id, hit);
    if (!hit)
      diagnostics.push(
        `musical traceability lost ${id}: ${MUSICAL_TRACEABILITY[id]}`,
      );
  }
}

export async function verifyTraceability({ root = process.cwd() } = {}) {
  const diagnostics = [];
  const decision = await readJson(
    root,
    "docs/evidence/android/product-decision.json",
    diagnostics,
  );
  const apply = await readJson(
    root,
    "docs/evidence/android/product-apply.json",
    diagnostics,
  );
  if (decision && apply) {
    verifyDecision(decision, apply, diagnostics);
    const entries = verifyApply(apply, diagnostics);
    const bound = await verifyBindings(root, entries, diagnostics);
    await verifyNativeBehaviours(root, bound, diagnostics);
  }
  await verifyMusicalTraceability(root, diagnostics);
  return {
    status: diagnostics.length === 0 ? "passed" : "failed",
    diagnostics,
    // Honest outcome ledger: only product alignment is verified here.
    outcomes: {
      productAlignment: diagnostics.length === 0 ? "verified" : "failed",
      privateBlobRehash: "unavailable",
      nativeExecution: "pending",
      deviceAcceptance: "pending",
    },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await verifyTraceability();
  for (const line of result.diagnostics) console.error(`traceability: ${line}`);
  console.log(JSON.stringify(result.outcomes));
  process.exit(result.status === "passed" ? 0 : 1);
}
