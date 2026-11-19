using JuanGCarmona.ScoreMap.Modules.Library;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.AspNetCore.Routing;
using Microsoft.OpenApi;

if (args.Length is < 1 or > 2 || (args.Length == 2 && args[1] != "--probe-route")) throw new ArgumentException("Provide the output path and optional drift probe.");
var builder = WebApplication.CreateBuilder(new WebApplicationOptions { Args = [] });
builder.Services.AddOpenApi();
builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(_ => { });
// These registrations describe handler parameters; no listener, database or identity provider is started.
builder.Services.AddPrivateLibrary("Host=localhost;Database=unused;Username=unused;Password=unused");
var sources = new List<EndpointDataSource>();
builder.Services.AddSingleton<EndpointDataSource>(_ => new CompositeEndpointDataSource(sources));
await using var app = builder.Build();
app.MapPrivateLibrary();
if (args.Length == 2) app.MapGet("/api/__contract_drift_probe", () => Results.NoContent());
sources.AddRange(((IEndpointRouteBuilder)app).DataSources);
var provider = app.Services.GetRequiredKeyedService<IOpenApiDocumentProvider>("v1");
var document = await provider.GetOpenApiDocumentAsync(CancellationToken.None);
document.Info.Description = "Partial development contract for registered private-library routes. Musical JSON is opaque; host authentication and error responses are not covered.";
await File.WriteAllTextAsync(args[0], await document.SerializeAsJsonAsync(OpenApiSpecVersion.OpenApi3_1));
