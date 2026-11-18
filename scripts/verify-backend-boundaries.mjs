import {spawnSync} from 'node:child_process';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const run=(args,options={})=>spawnSync('dotnet',args,{encoding:'utf8',...options});
const temporary=await mkdtemp(join(tmpdir(),'scoremap-boundary-'));
const xml=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
try{
 await writeFile(join(temporary,'Probe.csproj'),`<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net10.0</TargetFramework><LighthouseModule>true</LighthouseModule><ImplicitUsings>enable</ImplicitUsings><Nullable>enable</Nullable></PropertyGroup><ItemGroup><CompilerVisibleProperty Include="LighthouseModule"/><FrameworkReference Include="Microsoft.AspNetCore.App"/><ProjectReference Include="${xml(resolve('src/dotnet/Lighthouse.Analyzers/Lighthouse.Analyzers.csproj'))}" OutputItemType="Analyzer" ReferenceOutputAssembly="false"/></ItemGroup></Project>`);
 const cases=[
  ['SM1001','global using Web = Microsoft.AspNetCore.Http.HttpContext; namespace ScoreMap.Domain; internal class Song { private Web? context; }'],
  ['SM1002','namespace ScoreMap.Domain { public class Song {} } namespace ScoreMap.Contracts { public record Payload(System.Collections.Generic.List<ScoreMap.Domain.Song[]> Value); }'],
  ['SM1003','namespace ScoreMap.Http; public class Api : Microsoft.AspNetCore.Mvc.ControllerBase {}'],
  ['SM1004','using Microsoft.AspNetCore.Builder; namespace ScoreMap.Infrastructure { public class Store {} } namespace ScoreMap.Http { public static class Routes { public static void Map(Microsoft.AspNetCore.Builder.WebApplication app) { app.MapGet("/", (ScoreMap.Infrastructure.Store store) => store.ToString()); } } }'],
 ];
 for(const [diagnostic,source] of cases){
  await writeFile(join(temporary,'Probe.cs'),source);
  const result=run(['build',join(temporary,'Probe.csproj'),'-c','Release']);
  const output=result.stdout+result.stderr;
  if(result.status===0||!output.includes('error '+diagnostic)||/error CS[0-9]+/.test(output)) {process.stderr.write(output);throw new Error(diagnostic+' did not reject the real invalid build.');}
  console.log('Real build refusal passed: '+diagnostic);
 }
}finally{await rm(temporary,{recursive:true,force:true})}
