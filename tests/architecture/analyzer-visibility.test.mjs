import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const verifier = resolve("scripts/verify-backend-boundaries.mjs");
function verify(solution) {
  return spawnSync(
    process.execPath,
    [verifier, "--visibility-only", solution],
    { encoding: "utf8" },
  );
}

test("actual MSBuild evaluation rejects removed compiler visibility, including a new module", async () => {
  const root = await mkdtemp(join(tmpdir(), "scoremap-analyzer-visibility-"));
  const solution = join(root, "Fixture.slnx");
  const project = (name, properties) =>
    `<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net10.0</TargetFramework><AssemblyName>${name}</AssemblyName><LighthouseModule>true</LighthouseModule></PropertyGroup>${properties}</Project>`;
  const visible =
    '<ItemGroup><CompilerVisibleProperty Include="LighthouseModule" /></ItemGroup>';
  try {
    await mkdir(join(root, "Existing"));
    await mkdir(join(root, "New"));
    await writeFile(
      join(root, "Existing", "Existing.csproj"),
      project("Example.Modules.Existing", visible),
    );
    await writeFile(
      solution,
      '<Solution><Project Path="Existing/Existing.csproj" /></Solution>',
    );
    assert.equal(verify(solution).status, 0);
    await writeFile(
      join(root, "Existing", "Existing.csproj"),
      project(
        "Example.Modules.Existing",
        visible +
          '<ItemGroup><CompilerVisibleProperty Remove="LighthouseModule" /></ItemGroup>',
      ),
    );
    const removed = verify(solution);
    assert.notEqual(removed.status, 0);
    assert.match(removed.stderr, /Existing must expose LighthouseModule/);
    await writeFile(
      join(root, "Existing", "Existing.csproj"),
      project("Example.Modules.Existing", visible),
    );
    await writeFile(
      join(root, "New", "New.csproj"),
      project("Example.Modules.New", ""),
    );
    await writeFile(
      solution,
      `<Solution><Project Path="Existing/Existing.csproj" /><Project Path='New/New.csproj' /></Solution>`,
    );
    const added = verify(solution);
    assert.notEqual(added.status, 0);
    assert.match(added.stderr, /New must expose LighthouseModule/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
