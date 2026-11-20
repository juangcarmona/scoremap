import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

const xml = (s) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

test("actual module builds accept contracts and reject aliased or inherited exposed handlers", async () => {
  const root = await mkdtemp(join(tmpdir(), "scoremap-handler-contracts-"));
  const module = join(root, "Module", "Module.csproj");
  const code = join(root, "Module", "Module.cs");
  const build = () => spawnSync("dotnet", ["build", module, "-c", "Release", "--no-restore"], { cwd: root, encoding: "utf8" });
  const body = 'public System.Threading.Tasks.Task<string> Handle(string value, System.Threading.CancellationToken cancellationToken) => System.Threading.Tasks.Task.FromResult(value);';
  const alias = 'using Alias = JuanGCarmona.Lighthouse.Cqrs.ICommandHandler<string, string>;';
  try {
    await mkdir(join(root, "Module"));
    await mkdir(join(root, "Contracts"));
    await writeFile(join(root, "Contracts", "Contracts.csproj"), '<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net10.0</TargetFramework><AssemblyName>Example.Modules.Other.Contracts</AssemblyName></PropertyGroup></Project>');
    await writeFile(join(root, "Contracts", "Contract.cs"), 'namespace Example.Contracts; public record Message(string Text);');
    await writeFile(module, `<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net10.0</TargetFramework><AssemblyName>Example.Modules.Library</AssemblyName><LighthouseModule>true</LighthouseModule><ImplicitUsings>enable</ImplicitUsings></PropertyGroup><ItemGroup><CompilerVisibleProperty Include="LighthouseModule"/><ProjectReference Include="../Contracts/Contracts.csproj"/><ProjectReference Include="${xml(resolve("src/dotnet/Lighthouse.Cqrs/Lighthouse.Cqrs.csproj"))}"/><ProjectReference Include="${xml(resolve("src/dotnet/Lighthouse.Analyzers/Lighthouse.Analyzers.csproj"))}" OutputItemType="Analyzer" ReferenceOutputAssembly="false"/></ItemGroup></Project>`);
    const restore = spawnSync("dotnet", ["restore", module], { cwd: root, encoding: "utf8" });
    assert.equal(restore.status, 0, restore.stdout + restore.stderr);
    await writeFile(code, `${alias} namespace Other { public interface ICommandHandler<T, U> {} public class Unrelated : ICommandHandler<string, string> {} } namespace Example.Modules.Library { internal interface IExtended : Alias {} internal sealed class Handler : IExtended { ${body} } internal class Consumer { public Example.Contracts.Message Value = new(\"ok\"); } }`);
    const accepted = build();
    assert.equal(accepted.status, 0, accepted.stdout + accepted.stderr);
    for (const source of [
      `${alias} namespace Example.Modules.Library { public class Handler : Alias { ${body} } }`,
      `${alias} namespace Example.Modules.Library { internal interface IExtended : Alias {} internal class Handler : IExtended { ${body} } }`,
    ]) {
      await writeFile(code, source);
      const rejected = build();
      assert.notEqual(rejected.status, 0, "Invalid handler compiled successfully");
      assert.match(rejected.stdout + rejected.stderr, /error LH1001\b/u);
      assert.doesNotMatch(rejected.stdout + rejected.stderr, /error CS\d+/u);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
