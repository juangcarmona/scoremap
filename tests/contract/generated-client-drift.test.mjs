import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("a renamed registered HTTP route fails the generated client drift check", () => {
  const directory = mkdtempSync(join(tmpdir(), "scoremap-client-drift-"));
  try {
    const schema = JSON.parse(readFileSync("tests/contract/private-api.openapi.json", "utf8"));
    schema.paths["/api/renamed-preferences"] = schema.paths["/api/preferences/notation"];
    delete schema.paths["/api/preferences/notation"];
    const input = join(directory, "incompatible.json");
    writeFileSync(input, JSON.stringify(schema));
    const result = spawnSync(process.execPath, ["scripts/generate-private-api-client.mjs", "--check", `--schema=${input}`], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Generated private API client drifted/u);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
