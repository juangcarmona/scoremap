using System;
using System.Collections.Immutable;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace JuanGCarmona.Lighthouse.Analyzers;

[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class ScoreMapBoundaryAnalyzer : DiagnosticAnalyzer
{
  private static readonly string[] EndpointMethods = { "MapGet", "MapPost", "MapPut", "MapDelete", "MapPatch" };
  private static readonly DiagnosticDescriptor Purity = new("SM1001", "Keep domain and application dependencies pure", "'{0}' cannot use '{1}'; depend on a domain type or application port", "ScoreMap.Architecture", DiagnosticSeverity.Error, true);
  private static readonly DiagnosticDescriptor Payload = new("SM1002", "Keep public payloads free of entities", "Contract '{0}' exposes an unsafe nested type '{1}'", "ScoreMap.Architecture", DiagnosticSeverity.Error, true);
  private static readonly DiagnosticDescriptor Controller = new("SM1003", "Use Minimal API composition", "'{0}' inherits an MVC controller; use a typed use case and Minimal API mapping", "ScoreMap.Architecture", DiagnosticSeverity.Error, true);
  private static readonly DiagnosticDescriptor Endpoint = new("SM1004", "Keep persistence behind application ports", "HTTP endpoint uses infrastructure type '{0}'; call an application handler", "ScoreMap.Architecture", DiagnosticSeverity.Error, true);
  public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics => ImmutableArray.Create(Purity, Payload, Controller, Endpoint);
  public override void Initialize(AnalysisContext context)
  {
    context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
    context.EnableConcurrentExecution();
    context.RegisterSyntaxNodeAction(CheckTypeUse, SyntaxKind.IdentifierName, SyntaxKind.GenericName);
    context.RegisterSymbolAction(CheckNamedType, SymbolKind.NamedType);
  }
  private static bool Framework(ITypeSymbol type)
  {
    var name = type.ContainingNamespace?.ToDisplayString() ?? "";
    return name.StartsWith("Microsoft.AspNetCore", StringComparison.Ordinal) || name.StartsWith("Microsoft.EntityFrameworkCore", StringComparison.Ordinal) || name.StartsWith("Npgsql", StringComparison.Ordinal) || name.StartsWith("Aspire", StringComparison.Ordinal);
  }
  private static bool Infrastructure(ITypeSymbol type) => Framework(type) || (type.ContainingNamespace?.ToDisplayString() ?? "").Contains(".Infrastructure");
  private static void CheckTypeUse(SyntaxNodeAnalysisContext context)
  {
    var type = context.SemanticModel.GetTypeInfo(context.Node, context.CancellationToken).Type;
    if (type == null || type.TypeKind == TypeKind.Error) return;
    var scope = context.SemanticModel.GetEnclosingSymbol(context.Node.SpanStart, context.CancellationToken)?.ContainingNamespace?.ToDisplayString() ?? "";
    if ((scope.Contains(".Domain") || scope.Contains(".Application")) && Infrastructure(type))
      context.ReportDiagnostic(Diagnostic.Create(Purity, context.Node.GetLocation(), scope, type.ToDisplayString()));
    var lambda = context.Node.Ancestors().OfType<LambdaExpressionSyntax>().FirstOrDefault();
    var invocation = lambda?.Parent?.Parent?.Parent as InvocationExpressionSyntax;
    var mappedMethod = invocation == null ? null : context.SemanticModel.GetSymbolInfo(invocation, context.CancellationToken).Symbol as IMethodSymbol;
    if (mappedMethod == null || !mappedMethod.ContainingNamespace.ToDisplayString().StartsWith("Microsoft.AspNetCore.Builder", StringComparison.Ordinal)) return;
    if (invocation?.Expression is MemberAccessExpressionSyntax access && EndpointMethods.Contains(access.Name.Identifier.ValueText) &&
        ((type.ContainingNamespace?.ToDisplayString() ?? "").Contains(".Infrastructure") || (type.ContainingNamespace?.ToDisplayString() ?? "").StartsWith("Npgsql", StringComparison.Ordinal) || (type.ContainingNamespace?.ToDisplayString() ?? "").StartsWith("Microsoft.EntityFrameworkCore", StringComparison.Ordinal)))
      context.ReportDiagnostic(Diagnostic.Create(Endpoint, context.Node.GetLocation(), type.ToDisplayString()));
  }
  private static ITypeSymbol? Unsafe(ITypeSymbol type) => Unsafe(type, new HashSet<ITypeSymbol>(SymbolEqualityComparer.Default));
  private static ITypeSymbol? Unsafe(ITypeSymbol type, HashSet<ITypeSymbol> visited)
  {
    if (!visited.Add(type)) return null;
    if (type is IArrayTypeSymbol array) return Unsafe(array.ElementType, visited);
    if (type.Name == "IQueryable" || (type.ContainingNamespace?.ToDisplayString() ?? "").Contains(".Domain") || (type.ContainingNamespace?.ToDisplayString() ?? "").Contains(".Infrastructure") || Framework(type)) return type;
    if (type is INamedTypeSymbol named)
      foreach (var argument in named.TypeArguments) { var invalid = Unsafe(argument, visited); if (invalid != null) return invalid; }
    if ((type.ContainingNamespace?.ToDisplayString() ?? "").EndsWith(".Contracts", StringComparison.Ordinal))
      foreach (var member in type.GetMembers())
      {
        var nested = member is IPropertySymbol property ? property.Type : member is IFieldSymbol field ? field.Type : null;
        if (nested != null && Unsafe(nested, visited) is ITypeSymbol invalid) return invalid;
      }
    return null;
  }
  private static void CheckNamedType(SymbolAnalysisContext context)
  {
    var type = (INamedTypeSymbol)context.Symbol;
    for (var parent = type.BaseType; parent != null; parent = parent.BaseType)
      if (parent.ToDisplayString() == "Microsoft.AspNetCore.Mvc.ControllerBase") context.ReportDiagnostic(Diagnostic.Create(Controller, type.Locations.FirstOrDefault(), type.Name));
    if (type.DeclaredAccessibility != Accessibility.Public || !(type.ContainingNamespace?.ToDisplayString() ?? "").EndsWith(".Contracts", StringComparison.Ordinal)) return;
    foreach (var member in type.GetMembers())
    {
      var payload = member is IPropertySymbol property ? property.Type : member is IFieldSymbol field ? field.Type : null;
      if (payload != null && Unsafe(payload) is ITypeSymbol invalid) context.ReportDiagnostic(Diagnostic.Create(Payload, member.Locations.FirstOrDefault(), type.Name, invalid.ToDisplayString()));
      if (member is IMethodSymbol method)
        foreach (var parameter in method.Parameters)
          if (Unsafe(parameter.Type) is ITypeSymbol invalidParameter) context.ReportDiagnostic(Diagnostic.Create(Payload, parameter.Locations.FirstOrDefault(), type.Name, invalidParameter.ToDisplayString()));
    }
  }
}
