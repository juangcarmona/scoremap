using Aspire.Hosting.Docker.Resources.ComposeNodes;
using Aspire.Hosting.Docker.Resources.ServiceNodes;

var builder = DistributedApplication.CreateBuilder(args);
if (!builder.ExecutionContext.IsPublishMode)
{
  Console.Error.WriteLine("Publish the production composition with aspire publish; use the separate Development AppHost for local execution.");
  Environment.ExitCode = 1;
  return;
}
builder.AddDockerComposeEnvironment("production")
  .WithDashboard(false)
  .ConfigureComposeFile(compose =>
  {
    compose.Name = "scoremap";
    compose.Secrets["database_password"] = new Secret { File = "${SCOREMAP_DATABASE_PASSWORD_FILE:?Select private database-password file}" };
  });
var database = builder.AddContainer("database", "postgres", "18.3")
  .WithEnvironment("POSTGRES_USER", "scoremap")
  .WithEnvironment("POSTGRES_DB", "scoremap")
  .WithEnvironment("POSTGRES_PASSWORD_FILE", "/run/secrets/database_password")
  .WithVolume("scoremap-database", "/var/lib/postgresql")
  .PublishAsDockerComposeService((_, service) =>
  {
    service.Restart = "unless-stopped";
    service.Ports.Clear();
    service.Secrets.Add(new SecretReference { Source = "database_password" });
    service.Healthcheck = new Healthcheck { Test = ["CMD-SHELL", "pg_isready -U scoremap -d scoremap"], Interval = "10s", Timeout = "5s", Retries = 10, StartPeriod = "5s" };
  });
builder.AddContainer("application", "scoremap", "operator-artifact")
  .WithEnvironment("ASPNETCORE_ENVIRONMENT", "Production")
  .WithEnvironment("SCOREMAP_APPLICATION_FILE", "/run/scoremap/application.json")
  .WithVolume("scoremap-session-keys", "/var/lib/scoremap/keys")
  .WaitFor(database)
  .PublishAsDockerComposeService((_, service) =>
  {
    service.Image = "${SCOREMAP_IMAGE:?Select a built reviewed ScoreMap image by digest}";
    service.Restart = "unless-stopped";
    service.Ports.Clear();
    service.Ports.Add("127.0.0.1:${SCOREMAP_HTTP_PORT:-5280}:8080");
    service.AddVolume(new Volume { Name = "application-config", Source = "${SCOREMAP_APPLICATION_FILE:?Select private Production configuration}", Target = "/run/scoremap/application.json", Type = "bind", ReadOnly = true });
    service.DependsOn["database"] = new ServiceDependency { Condition = "service_healthy" };
    service.ReadOnly = true;
    service.Tmpfs.Add("/tmp");
    service.SecurityOpt.Add("no-new-privileges:true");
  });
await builder.Build().RunAsync();
