import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const project = "tests/contract/ScoreMap.Contract.csproj";
const expected = JSON.parse(readFileSync("tests/contract/private-api.openapi.json", "utf8"));
const temporary = mkdtempSync(join(tmpdir(), "scoremap-contract-"));
function run(args) {
  const result = spawnSync("dotnet", args, { encoding: "utf8", env: process.env });
  if (result.status !== 0) throw new Error(`dotnet ${args[0]} failed:\n${result.stderr}\n${result.stdout}`);
}
function generate(name, probe = false) {
  const output = join(temporary, name);
  run(["run", "--project", project, "--configuration", "Release", "--no-restore", "--", output, ...(probe ? ["--probe-route"] : [])]);
  return JSON.parse(readFileSync(output, "utf8"));
}
function matches(actual) { return JSON.stringify(actual) === JSON.stringify(expected); }
try {
  run(["restore", project, "--locked-mode"]);
  const actual = generate("actual.json");
  if (!matches(actual)) throw new Error("Private API contract drifted. Inspect and regenerate tests/contract/private-api.openapi.json.");
  if (!matches(generate("repeat.json"))) throw new Error("Private API contract generation is not deterministic.");
  if (matches(generate("probe.json", true))) throw new Error("A new registered API route did not fail the contract comparison.");
  console.log("Private API contract matches actual registered routes; added-route drift was refused. Auth routes and opaque musical JSON remain outside this contract.");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
