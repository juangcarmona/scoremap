import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as prettier from "prettier";
import ts from "typescript";

const contract = "tests/contract/private-api.openapi.json";
const output = "src/shared/api/private-api.gen.ts";
const temp = mkdtempSync(join(tmpdir(), "scoremap-api-types-"));
const check = process.argv.includes("--check");
async function generate(input, destination) {
  const run = spawnSync(process.execPath, ["node_modules/@hey-api/openapi-ts/bin/run.js", "-i", input, "-o", destination, "-p", "@hey-api/typescript", "--no-log-file", "--silent"], { encoding: "utf8" });
  if (run.status !== 0) throw new Error(`OpenAPI type generation failed: ${run.stderr}`);
  return prettier.format(readFileSync(join(destination, "types.gen.ts"), "utf8"), { ...(await prettier.resolveConfig(output)), parser: "typescript" });
}
function fixtureDiagnostics(generated, folder) {
  const typesPath = join(folder, "types.ts");
  const fixture = join(folder, "consumer.ts");
  writeFileSync(typesPath, generated);
  writeFileSync(fixture, 'import type { NotationRequest } from "./types";\nconst request = { expectedRevision: 0, commandId: "synthetic", mode: "anglo", primary: "anglo" } satisfies NotationRequest;\nvoid request;\n');
  const program = ts.createProgram([fixture], { noEmit: true, strict: true, skipLibCheck: true, types: [], target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler });
  return ts.getPreEmitDiagnostics(program);
}
try {
  const generated = await generate(contract, join(temp, "actual"));
  if (!check) writeFileSync(output, generated);
  else {
    if (readFileSync(output, "utf8") !== generated) throw new Error("Generated private API types drifted; run npm run generate:private-api-types.");
    if (fixtureDiagnostics(generated, temp).length) throw new Error("Valid generated contract consumer did not compile.");
    const changed = JSON.parse(readFileSync(contract, "utf8"));
    changed.components.schemas.NotationRequest.required.push("newRequiredField");
    changed.components.schemas.NotationRequest.properties.newRequiredField = { type: "string" };
    const fixtureContract = join(temp, "incompatible.json");
    writeFileSync(fixtureContract, JSON.stringify(changed));
    const incompatible = await generate(fixtureContract, join(temp, "incompatible"));
    if (!fixtureDiagnostics(incompatible, temp).some((diagnostic) => diagnostic.code === 1360)) throw new Error("Incompatible request schema did not reject the typed consumer.");
    console.log("Generated private API types match; incompatible request schema rejected by TypeScript.");
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
