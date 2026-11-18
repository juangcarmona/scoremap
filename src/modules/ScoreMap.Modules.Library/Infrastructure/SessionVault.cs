using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Npgsql;

namespace JuanGCarmona.ScoreMap.Modules.Library.Infrastructure;

internal sealed class SessionVault(NpgsqlDataSource dataSource, IDataProtectionProvider protection) : ITicketStore
{
  private readonly IDataProtector protector = protection.CreateProtector("ScoreMap.ServerSession.v1");
  public async Task<string> StoreAsync(AuthenticationTicket ticket)
  {
    var id = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
    await Persist(id, ticket, true).ConfigureAwait(false);
    return id;
  }
  public Task RenewAsync(string key, AuthenticationTicket ticket) => Persist(key, ticket, false);
  private async Task Persist(string key, AuthenticationTicket ticket, bool create)
  {
    var command = dataSource.CreateCommand(create ? "INSERT INTO sm_sessions(id,ticket,expires) VALUES($1,$2,$3)" : "UPDATE sm_sessions SET ticket=$2,expires=$3 WHERE id=$1 AND expires>now()");
    await using (command.ConfigureAwait(false))
    {
      command.Parameters.AddWithValue(key); command.Parameters.AddWithValue(protector.Protect(TicketSerializer.Default.Serialize(ticket))); command.Parameters.AddWithValue(ticket.Properties.ExpiresUtc ?? DateTimeOffset.UtcNow.AddHours(8));
      await command.ExecuteNonQueryAsync().ConfigureAwait(false);
    }
  }
  public async Task<AuthenticationTicket?> RetrieveAsync(string key)
  {
    var command = dataSource.CreateCommand("SELECT ticket FROM sm_sessions WHERE id=$1 AND expires>now()");
    await using (command.ConfigureAwait(false))
    {
      command.Parameters.AddWithValue(key);
      var value = await command.ExecuteScalarAsync().ConfigureAwait(false);
      return value is byte[] bytes ? TicketSerializer.Default.Deserialize(protector.Unprotect(bytes)) : null;
    }
  }
  public async Task RemoveAsync(string key)
  {
    var command = dataSource.CreateCommand("DELETE FROM sm_sessions WHERE id=$1");
    await using (command.ConfigureAwait(false))
    {
      command.Parameters.AddWithValue(key);
      await command.ExecuteNonQueryAsync().ConfigureAwait(false);
    }
  }
}
