using System.Security.Claims;
using System.Text.Json;
using JuanGCarmona.ScoreMap.Modules.Library;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Npgsql;

var selected = new NpgsqlConnectionStringBuilder(Environment.GetEnvironmentVariable("SCOREMAP_SESSION_PROBE_DATABASE") ?? throw new InvalidOperationException("Use the isolated session qualification driver."));
if (!string.Equals(selected.Host, "127.0.0.1", StringComparison.Ordinal) || !string.Equals(selected.Database, "scoremap_session_qualification", StringComparison.Ordinal)) throw new InvalidOperationException("Use only the execution-owned disposable session database.");
await using var database = NpgsqlDataSource.Create(selected.ConnectionString);
await using (var schema = database.CreateCommand("CREATE TABLE sm_sessions(id text PRIMARY KEY,ticket bytea NOT NULL,expires timestamptz NOT NULL)")) await schema.ExecuteNonQueryAsync();
var type = typeof(LibraryModule).Assembly.GetType("JuanGCarmona.ScoreMap.Modules.Library.Infrastructure.SessionVault", true)!;
var store = (ITicketStore)Activator.CreateInstance(type, database, new EphemeralDataProtectionProvider())!;
static AuthenticationTicket Ticket(string value, bool expired = false) => new(new ClaimsPrincipal(new ClaimsIdentity([new Claim("probe", value)], "synthetic-storage-probe")), new AuthenticationProperties { ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(expired ? -1 : 30) }, CookieAuthenticationDefaults.AuthenticationScheme);
var owned = new List<string>();
try
{
  var first = await store.StoreAsync(Ticket("initial")); owned.Add(first);
  if ((await store.RetrieveAsync(first))?.Principal.FindFirst("probe")?.Value != "initial") throw new InvalidOperationException("Stored session did not reconstruct.");
  await store.RenewAsync(first, Ticket("renewed"));
  if ((await store.RetrieveAsync(first))?.Principal.FindFirst("probe")?.Value != "renewed") throw new InvalidOperationException("Live renewal did not reconstruct.");
  var gate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
  var delayed = Task.Run(async () => { await gate.Task; await store.RenewAsync(first, Ticket("late")); });
  await store.RemoveAsync(first); gate.SetResult(); await delayed;
  if (await store.RetrieveAsync(first) is not null) throw new InvalidOperationException("A delayed renewal revived a removed session.");
  var expired = await store.StoreAsync(Ticket("expired", true)); owned.Add(expired);
  await store.RenewAsync(expired, Ticket("must-stay-expired"));
  if (await store.RetrieveAsync(expired) is not null) throw new InvalidOperationException("A renewal revived an expired session.");
  var fresh = await store.StoreAsync(Ticket("fresh")); owned.Add(fresh);
  if ((await store.RetrieveAsync(fresh))?.Principal.FindFirst("probe")?.Value != "fresh" || await store.RetrieveAsync(first) is not null) throw new InvalidOperationException("Fresh admission changed a terminated session.");
  Console.WriteLine(JsonSerializer.Serialize(new { storedSessionReconstructed = true, liveRenewalReconstructed = true, delayedRenewalCannotReviveLogout = true, expiredSessionCannotRenew = true, freshSessionIndependent = true, realDatabase = true, browserAuthentication = false }));
}
finally { foreach (var id in owned) await store.RemoveAsync(id); }
