import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  EXPECTED_BINDINGS,
  NATIVE_BEHAVIOURS,
  verifyTraceability,
} from "../../scripts/verify-traceability.mjs";

const model = "docs/product/model";
const evidence = "docs/evidence/android";

async function workspace() {
  const root = await mkdtemp(join(tmpdir(), "scoremap-traceability-"));
  await cp(model, join(root, model), { recursive: true });
  await cp(evidence, join(root, evidence), { recursive: true });
  return root;
}

async function withWorkspace(mutate) {
  const root = await workspace();
  try {
    await mutate(root);
    return await verifyTraceability({ root });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

const editJson = (root, path, change) =>
  readFile(join(root, path), "utf8").then((text) => {
    const value = JSON.parse(text);
    change(value);
    return writeFile(join(root, path), JSON.stringify(value));
  });

test("the integrated baseline verifies and keeps native execution pending", async () => {
  const result = await verifyTraceability();
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.status, "passed");
  assert.equal(result.outcomes.productAlignment, "verified");
  assert.equal(result.outcomes.privateBlobRehash, "unavailable");
  assert.equal(result.outcomes.nativeExecution, "pending");
  assert.equal(result.outcomes.deviceAcceptance, "pending");
});

test("exactly the four native behaviours and 27 bindings are retained", () => {
  assert.equal(Object.keys(NATIVE_BEHAVIOURS).length, 4);
  assert.equal(EXPECTED_BINDINGS, 27);
});

test("a receipt claiming native or device acceptance is rejected", async () => {
  const result = await withWorkspace((root) =>
    editJson(root, `${evidence}/product-apply.json`, (apply) => {
      apply.implementationOrDeviceAcceptance = true;
    }),
  );
  assert.equal(result.status, "failed");
  assert.match(
    result.diagnostics.join("\n"),
    /implementationOrDeviceAcceptance/u,
  );
});

test("a canonical artifact changed after apply is rejected by digest", async () => {
  const result = await withWorkspace(async (root) => {
    const path = join(root, model, "behaviours/sb-native-copy-import.md");
    await writeFile(path, `${await readFile(path, "utf8")}\nunreviewed edit\n`);
  });
  assert.equal(result.status, "failed");
  assert.match(
    result.diagnostics.join("\n"),
    /SB-NATIVE-COPY-IMPORT digest differs/u,
  );
});

test("a dropped binding is rejected", async () => {
  const result = await withWorkspace((root) =>
    editJson(root, `${evidence}/product-apply.json`, (apply) => {
      apply.diff.modified.pop();
    }),
  );
  assert.equal(result.status, "failed");
  assert.match(
    result.diagnostics.join("\n"),
    /expected 27 canonical bindings, found 26/u,
  );
});

test("a decision for another repository or candidate is rejected", async () => {
  const result = await withWorkspace((root) =>
    editJson(root, `${evidence}/product-decision.json`, (decision) => {
      decision.repositoryId = 1;
      decision.candidateSha256 = "0".repeat(64);
    }),
  );
  const text = result.diagnostics.join("\n");
  assert.match(text, /not juangcarmona\/scoremap\/1458674261/u);
  assert.match(text, /candidate differs from the recorded operator decision/u);
});

test("a failed apply outcome or non-provider writer is rejected", async () => {
  const result = await withWorkspace((root) =>
    editJson(root, `${evidence}/product-apply.json`, (apply) => {
      apply.outcome = "failed";
      apply.canonicalWritesPerformedBy = "manual edit";
    }),
  );
  const text = result.diagnostics.join("\n");
  assert.match(text, /apply outcome is failed/u);
  assert.match(text, /not performed by the provider apply route/u);
});

test("a native behaviour that stops covering its lifecycle transition is rejected", async () => {
  const result = await withWorkspace(async (root) => {
    const path = join(root, model, "behaviours/sb-native-song-restore.md");
    const text = await readFile(path, "utf8");
    await writeFile(
      path,
      text.replace("transition: RESTORE", "transition: CREATE-FIRST"),
    );
  });
  assert.match(
    result.diagnostics.join("\n"),
    /SB-NATIVE-SONG-RESTORE must cover LC-LIBRARY RESTORE/u,
  );
});

test("missing receipts or lost musical rules are reported, never treated as passing", async () => {
  const result = await withWorkspace(async (root) => {
    await rm(join(root, evidence, "product-apply.json"));
    await rm(join(root, model, "business-rules/br-structure.md"));
  });
  assert.equal(result.status, "failed");
  const text = result.diagnostics.join("\n");
  assert.match(
    text,
    /missing file: docs\/evidence\/android\/product-apply\.json/u,
  );
  assert.match(text, /musical traceability lost BR-STRUCTURE/u);
});
