using Microsoft.Extensions.Diagnostics.HealthChecks;
using Npgsql;
namespace JuanGCarmona.ScoreMap.Modules.Library.Infrastructure;

internal sealed class DatabaseHealth(NpgsqlDataSource dataSource) : IHealthCheck
{
  public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
  {
    var command = dataSource.CreateCommand("SELECT 1");
    await using var disposal = command.ConfigureAwait(false);
    try { await command.ExecuteScalarAsync(cancellationToken).ConfigureAwait(false); return HealthCheckResult.Healthy(); }
    catch (NpgsqlException) { return HealthCheckResult.Unhealthy("Durable storage is unavailable."); }
  }
}
