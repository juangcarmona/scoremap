import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const verifier = resolve(
  "tests/architecture/verify-module-analyzer-severity.mjs",
);
const xml = (s) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

test("module builds reject downgraded or disabled diagnostics", async () => {
  const root = await mkdtemp(join(tmpdir(), "scoremap-analyzer-severity-"));
  const solution = join(root, "Fixture.slnx");
  const project = join(root, "Module", "Module.csproj");
  const run = (cmd, args) =>
    spawnSync(cmd, args, { cwd: root, encoding: "utf8" });
  try {
    await mkdir(join(root, "Module"));
    await writeFile(
      join(root, "Module", "Module.cs"),
      "namespace Example; internal class Module {}\n",
    );
    await writeFile(join(root, ".editorconfig"), "root = true\n[*.cs]\n");
    await writeFile(
      solution,
      '<Solution><Project Path="Module/Module.csproj" /></Solution>',
    );
    await writeFile(
      project,
      `<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net10.0</TargetFramework><AssemblyName>Example.Modules.Library</AssemblyName><LighthouseModule>true</LighthouseModule><ImplicitUsings>enable</ImplicitUsings></PropertyGroup><ItemGroup><CompilerVisibleProperty Include="LighthouseModule"/><ProjectReference Include="${xml(resolve("src/dotnet/Lighthouse.Cqrs/Lighthouse.Cqrs.csproj"))}"/><ProjectReference Include="${xml(resolve("src/dotnet/Lighthouse.Analyzers/Lighthouse.Analyzers.csproj"))}" OutputItemType="Analyzer" ReferenceOutputAssembly="false"/></ItemGroup></Project>`,
    );
    const restored = run("dotnet", ["restore", solution]);
    assert.equal(restored.status, 0, restored.stdout + restored.stderr);
    const verify = () => run(process.execPath, [verifier, solution]);
    const baseline = verify();
    assert.equal(baseline.status, 0, baseline.stdout + baseline.stderr);
    for (const [id, severity] of [
      ["LH1001", "warning"],
      ["LH1002", "none"],
    ]) {
      await writeFile(
        join(root, "Module", ".globalconfig"),
        `is_global = true\ndotnet_diagnostic.${id}.severity = ${severity}\n`,
      );
      const result = verify();
      assert.notEqual(result.status, 0, `${id} ${severity} was accepted`);
      assert.match(result.stderr, new RegExp(`must reject ${id} as an error`));
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
