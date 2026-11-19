import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const solution = resolve(process.argv[2] ?? "ScoreMap.slnx");
const root = dirname(solution);
const xml = (s) =>
  s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
const run = (args) => {
  const result = spawnSync("dotnet", args, { cwd: root, encoding: "utf8" });
  if (result.error) throw result.error;
  return result;
};
const contents = await readFile(solution, "utf8");
const projects = [
  ...contents.matchAll(/<Project\b[^>]*\bPath\s*=\s*(["'])([^"']+\.csproj)\1/g),
];
if (!projects.length) throw new Error("No projects found in solution.");
for (const [, , project] of projects) {
  const path = resolve(root, project);
  const evaluated = run(["msbuild", path, "-getProperty:AssemblyName"]);
  if (evaluated.status !== 0)
    throw new Error(`Cannot evaluate ${project}: ${evaluated.stderr}`);
  const assembly = evaluated.stdout.trim();
  if (
    !assembly.includes(".Modules.") ||
    assembly.endsWith(".Contracts") ||
    assembly.endsWith("Tests")
  )
    continue;
  const obj = dirname(path);
  await mkdir(obj, { recursive: true });
  const tmp = await mkdtemp(join(obj, ".scoremap-severity-probe-"));
  try {
    const sibling = `${assembly.split(".Modules.")[0]}.Modules.ScoreMapSeverityProbe`;
    const siblingProject = join(tmp, "Sibling.csproj");
    await writeFile(
      siblingProject,
      `<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net10.0</TargetFramework><AssemblyName>${xml(sibling)}</AssemblyName></PropertyGroup></Project>`,
    );
    await writeFile(
      join(tmp, "Sibling.cs"),
      "namespace ScoreMapSeverityProbe; public sealed class SeverityProbe {}\n",
    );
    const built = run(["build", siblingProject, "-c", "Release", "--nologo"]);
    if (built.status !== 0)
      throw new Error(
        `Cannot build sibling probe:\n${built.stdout}${built.stderr}`,
      );
    const source = join(tmp, "ExposedProbe.cs");
    await writeFile(
      source,
      `using JuanGCarmona.Lighthouse.Cqrs;\npublic class ExposedProbe : ICommandHandler<string, string> { public Task<string> Handle(string command, CancellationToken cancellationToken) => Task.FromResult(command); }\n`,
    );
    const targets = join(tmp, "Probe.targets");
    const dll = join(tmp, "bin", "Release", "net10.0", `${sibling}.dll`);
    await writeFile(
      targets,
      `<Project><ItemGroup Condition="'$(MSBuildProjectFullPath)' == '${xml(path)}'"><Compile Include="${xml(source)}" /><Reference Include="${xml(sibling)}"><HintPath>${xml(dll)}</HintPath></Reference></ItemGroup></Project>`,
    );
    const result = run([
      "build",
      path,
      "--no-restore",
      "-c",
      "Release",
      "--nologo",
      `-p:CustomAfterMicrosoftCommonTargets=${targets}`,
      "-p:TreatWarningsAsErrors=false",
      "-p:CodeAnalysisTreatWarningsAsErrors=false",
      "-p:WarningsAsErrors=",
    ]);
    const output = result.stdout + result.stderr;
    for (const id of ["LH1001", "LH1002"]) {
      if (result.status === 0 || !new RegExp(`error ${id}\\b`).test(output)) {
        throw new Error(
          `Module ${assembly} must reject ${id} as an error with warnings-as-errors disabled.\n${output}`,
        );
      }
    }
    console.log(`${assembly}: LH1001 and LH1002 rejected as errors.`);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}
