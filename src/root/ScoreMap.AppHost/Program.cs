using System.Text.Json;

var builder = DistributedApplication.CreateBuilder(args);
var file = Environment.GetEnvironmentVariable("SCOREMAP_APPLICATION_FILE") ?? throw new InvalidOperationException("Run npm run dev:private -- <application-file> <users-file> first.");
using var input = JsonDocument.Parse(File.ReadAllText(file));
var config = input.RootElement;
if (!string.Equals(config.GetProperty("Environment").GetString(), "Development", StringComparison.Ordinal)) throw new InvalidOperationException("This AppHost is Development only. Use deployment/compose.yaml for Production artifacts.");
var runtime = Path.GetDirectoryName(file)!;
var databasePassword = builder.AddParameter("database-password", config.GetProperty("Development").GetProperty("DatabasePassword").GetString()!, secret: true);
var postgres = builder.AddPostgres("postgres", password: databasePassword).WithImageTag("18.3").WithDataVolume("scoremap-" + config.GetProperty("InstanceId").GetString() + "-postgres").WithEndpoint("tcp", endpoint => endpoint.Port = config.GetProperty("Development").GetProperty("DatabasePort").GetInt32());
var database = postgres.AddDatabase("scoremap");
var identity = builder.AddContainer("identity", "quay.io/keycloak/keycloak", "26.8.1")
    .WithArgs("start-dev", "--import-realm")
    .WithEnvironment("KC_HTTP_ENABLED", "true")
    .WithBindMount(Path.Combine(runtime, "realm", config.GetProperty("Identity").GetProperty("Authority").GetString()!.Split('/').Last() + "-realm.json"), "/opt/keycloak/data/import/" + config.GetProperty("Identity").GetProperty("Authority").GetString()!.Split('/').Last() + "-realm.json", isReadOnly: true)
    .WithVolume("scoremap-" + config.GetProperty("InstanceId").GetString() + "-identity", "/opt/keycloak/data")
    .WithHttpEndpoint(port: config.GetProperty("Development").GetProperty("IdentityPort").GetInt32(), targetPort: 8080, name: "http", isProxied: false)
    .WithHttpHealthCheck("/realms/" + config.GetProperty("Identity").GetProperty("Authority").GetString()!.Split('/').Last() + "/.well-known/openid-configuration");
builder.AddProject<Projects.ScoreMap_Api>("api")
    .WithEnvironment("ASPNETCORE_ENVIRONMENT", "Development")
    .WithEnvironment("SCOREMAP_APPLICATION_FILE", file)
    .WithHttpEndpoint(port: new Uri(config.GetProperty("Application").GetProperty("PublicOrigin").GetString()!).Port, targetPort: new Uri(config.GetProperty("Application").GetProperty("PublicOrigin").GetString()!).Port, name: "http", isProxied: false)
    .WithReference(database).WaitFor(database).WaitFor(identity);
await builder.Build().RunAsync();
