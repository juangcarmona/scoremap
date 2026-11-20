import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
const run = (args, options = {}) =>
  spawnSync("dotnet", args, { encoding: "utf8", ...options });

async function verifyAnalyzerVisibility(solution) {
  const root = dirname(solution);
  const contents = await readFile(solution, "utf8");
  const projects = [...contents.matchAll(/<Project\b[^>]*\bPath\s*=\s*(["'])([^"']+\.csproj)\1/g)];
  if (!projects.length) throw new Error("No projects found in solution.");
  for (const [, , project] of projects) {
    const result = spawnSync(
      "dotnet",
      [
        "msbuild",
        resolve(root, project),
        "-getProperty:AssemblyName",
        "-getItem:CompilerVisibleProperty",
      ],
      { cwd: root, encoding: "utf8" },
    );
    if (result.error) throw result.error;
    if (result.status !== 0)
      throw new Error(
        `Cannot evaluate project policy: ${project}\n${result.stderr}`,
      );
    const evaluated = JSON.parse(result.stdout);
    const assembly = evaluated.Properties.AssemblyName;
    if (
      !assembly.includes(".Modules.") ||
      assembly.endsWith(".Contracts") ||
      assembly.endsWith("Tests")
    )
      continue;
    if (
      !evaluated.Items.CompilerVisibleProperty.some(
        (item) => item.Identity === "LighthouseModule",
      )
    ) {
      throw new Error(
        `Module ${assembly} must expose LighthouseModule to the compiler.`,
      );
    }
  }
}

if (process.argv[2] === "--visibility-only") {
  await verifyAnalyzerVisibility(resolve(process.argv[3]));
  process.exit(0);
}
await verifyAnalyzerVisibility(resolve("ScoreMap.slnx"));
console.log(
  "Every implementation module exposes LighthouseModule to the compiler.",
);
const temporary=await mkdtemp(join(tmpdir(),'scoremap-boundary-'));
const xml=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
try{
 await writeFile(join(temporary,'Probe.csproj'),`<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net10.0</TargetFramework><LighthouseModule>true</LighthouseModule><ImplicitUsings>enable</ImplicitUsings><Nullable>enable</Nullable></PropertyGroup><ItemGroup><CompilerVisibleProperty Include="LighthouseModule"/><FrameworkReference Include="Microsoft.AspNetCore.App"/><ProjectReference Include="${xml(resolve('src/dotnet/Lighthouse.Analyzers/Lighthouse.Analyzers.csproj'))}" OutputItemType="Analyzer" ReferenceOutputAssembly="false"/></ItemGroup></Project>`);
 const cases=[
  ['SM1001','global using Web = Microsoft.AspNetCore.Http.HttpContext; namespace ScoreMap.Domain; internal class Song { private Web? context; }'],
  ['SM1002','namespace ScoreMap.Domain { public class Song {} } namespace ScoreMap.Contracts { public record Payload(System.Collections.Generic.List<ScoreMap.Domain.Song[]> Value); }'],
  ['SM1002','namespace ScoreMap.Domain { public class Song {} } namespace ScoreMap.Contracts { public interface IReader { System.Threading.Tasks.Task<System.Collections.Generic.IReadOnlyList<ScoreMap.Domain.Song[]>> Read(); } }'],
  ['SM1003','namespace ScoreMap.Http; public class Api : Microsoft.AspNetCore.Mvc.ControllerBase {}'],
  ['SM1004','using Microsoft.AspNetCore.Builder; namespace ScoreMap.Infrastructure { public class Store {} } namespace ScoreMap.Http { public static class Routes { public static void Map(Microsoft.AspNetCore.Builder.WebApplication app) { app.MapGet("/", (ScoreMap.Infrastructure.Store store) => store.ToString()); } } }'],
  ['SM1004','using Microsoft.AspNetCore.Builder; namespace ScoreMap.Infrastructure { public class Store {} } namespace ScoreMap.Http { public static class Routes { private static string Read(ScoreMap.Infrastructure.Store store) => store.ToString()!; public static void Map(WebApplication app) { app.MapGet("/", Read); } } }'],
  ['SM1004','using Microsoft.AspNetCore.Builder; namespace ScoreMap.Infrastructure { public class Store {} } namespace ScoreMap.Http { public static class Routes { private static string Read(ScoreMap.Infrastructure.Store store) => store.ToString()!; public static void Map(WebApplication app) { System.Func<ScoreMap.Infrastructure.Store, string> handler = Read; app.MapGet("/", handler); } } }'],
  ['SM1004','using Microsoft.AspNetCore.Builder; namespace ScoreMap.Infrastructure { public class Store {} } namespace ScoreMap.Http { public static class Routes { private static string Read(ScoreMap.Infrastructure.Store store) => store.ToString()!; public static void Map(WebApplication app) { System.Delegate handler = (System.Func<ScoreMap.Infrastructure.Store, string>)Read; app.MapGet("/", handler); } } }'],
 ];
 for(const [diagnostic,source] of cases){
  await writeFile(join(temporary,'Probe.cs'),source);
  const result=run(['build',join(temporary,'Probe.csproj'),'-c','Release']);
  const output=result.stdout+result.stderr;
  if(result.status===0||!output.includes('error '+diagnostic)||/error CS[0-9]+/.test(output)) {process.stderr.write(output);throw new Error(diagnostic+' did not reject the real invalid build.');}
  console.log('Real build refusal passed: '+diagnostic);
 }
}finally{await rm(temporary,{recursive:true,force:true})}
