using System.Collections.Immutable;
using JuanGCarmona.Lighthouse.Analyzers;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Diagnostics;
using Xunit;

namespace JuanGCarmona.ScoreMap.Tests;

public sealed class CompilerBoundaryTests
{
  [Theory]
  [InlineData("global using Storage = Npgsql.Connection; namespace Npgsql { public class Connection {} } namespace ScoreMap.Domain { internal class Song { private Storage field = new(); } }", "SM1001")]
  [InlineData("namespace ScoreMap.Infrastructure { public class Store {} } namespace ScoreMap.Application { internal class Handler { private global::ScoreMap.Infrastructure.Store store = new(); } }", "SM1001")]
  [InlineData("namespace ScoreMap.Domain { public class Song {} } namespace ScoreMap.Contracts { public record Payload(System.Collections.Generic.List<ScoreMap.Domain.Song[]> Value); }", "SM1002")]
  [InlineData("namespace ScoreMap.Contracts { public record Payload(System.Linq.IQueryable<string> Value); }", "SM1002")]
  [InlineData("namespace Microsoft.AspNetCore.Mvc { public class ControllerBase {} } namespace ScoreMap.Http { public class Parent : Microsoft.AspNetCore.Mvc.ControllerBase {} public class Api : Parent {} }", "SM1003")]
  [InlineData("namespace ScoreMap.Domain { public class Song {} } namespace ScoreMap.Contracts { public record Wrapped(ScoreMap.Domain.Song Song); public record Payload(System.Collections.Generic.IReadOnlyList<Wrapped> Values); }", "SM1002")]
  [InlineData("using Microsoft.AspNetCore.Builder; namespace ScoreMap.Infrastructure { public class Store {} } namespace ScoreMap.Http { public static class Routes { public static void Map(WebApplication app) { app.MapGet(\"/\", (ScoreMap.Infrastructure.Store store) => store.ToString()); } } }", "SM1004")]
  public async Task SemanticRulesRejectAliasesGlobalTypesNestedPayloadsAndInheritance(string source, string expected)
  {
    var diagnostics = await Analyze(source);
    Assert.Contains(diagnostics, diagnostic => string.Equals(diagnostic.Id, expected, StringComparison.Ordinal));
  }
  [Fact]
  public async Task PureDomainAndPortableDtosPass()
  {
    var diagnostics = await Analyze("namespace ScoreMap.Domain { internal record Note(int Pitch); } namespace ScoreMap.Contracts { public record Payload(System.Collections.Generic.IReadOnlyList<string> Names); }");
    Assert.Empty(diagnostics);
  }
  private static async Task<ImmutableArray<Diagnostic>> Analyze(string source)
  {
    var paths = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator);
    var references = paths.Select(path => MetadataReference.CreateFromFile(path));
    var compilation = CSharpCompilation.Create("SemanticProbe", [CSharpSyntaxTree.ParseText(source)], references, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
    Assert.DoesNotContain(compilation.GetDiagnostics(), diagnostic => diagnostic.Severity == DiagnosticSeverity.Error);
    return await compilation.WithAnalyzers(ImmutableArray.Create<DiagnosticAnalyzer>(new ScoreMapBoundaryAnalyzer())).GetAnalyzerDiagnosticsAsync();
  }
}
