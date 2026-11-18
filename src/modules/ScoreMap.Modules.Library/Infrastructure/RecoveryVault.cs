using System.Security.Cryptography;
using Microsoft.AspNetCore.DataProtection;
using Npgsql;
using JuanGCarmona.ScoreMap.Modules.Library.Application;

namespace JuanGCarmona.ScoreMap.Modules.Library.Infrastructure;

internal sealed class RecoveryVault(NpgsqlDataSource dataSource, IDataProtectionProvider protection) : IRecoveryKeyRepository
{
  internal async Task Initialize(CancellationToken ct)
  {
    var command = dataSource.CreateCommand("CREATE TABLE IF NOT EXISTS sm_recovery_keys(id uuid PRIMARY KEY,principal text NOT NULL,resources text[] NOT NULL,protected_key bytea NOT NULL); ALTER TABLE sm_recovery_keys ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'song' CHECK(purpose IN ('song','personal')); ALTER TABLE sm_recovery_keys ADD COLUMN IF NOT EXISTS write_resources text[]");
    await using (command.ConfigureAwait(false))
    {
      await command.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }
  }
  public async Task<object> Create(string principal, string purpose, CancellationToken ct)
  {
    var connection = await dataSource.OpenConnectionAsync(ct).ConfigureAwait(false);
    await using (connection.ConfigureAwait(false))
    {
      var ids = new List<string>(); var writable = new List<string>();
      if (string.Equals(purpose, "song", StringComparison.Ordinal))
      {
        var lookup = new NpgsqlCommand("SELECT s.id,(s.owner=$1 OR g.role='editor') FROM sm_songs s LEFT JOIN sm_grants g ON s.id=g.song AND g.principal=$1 WHERE NOT s.deleted AND NOT s.purged AND (s.owner=$1 OR g.principal=$1)", connection);
        await using var lookupDisposal = lookup.ConfigureAwait(false);
        lookup.Parameters.AddWithValue(principal); var reader = await lookup.ExecuteReaderAsync(ct).ConfigureAwait(false);
        await using var readerDisposal = reader.ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false)) { ids.Add(reader.GetString(0)); if (reader.GetBoolean(1)) writable.Add(reader.GetString(0)); }
      }
      var id = Guid.NewGuid(); var key = RandomNumberGenerator.GetBytes(32);
      var command = new NpgsqlCommand("INSERT INTO sm_recovery_keys(id,principal,resources,protected_key,purpose,write_resources) VALUES($1,$2,$3,$4,$5,$6)", connection);
      await using (command.ConfigureAwait(false))
      {
        command.Parameters.AddWithValue(id); command.Parameters.AddWithValue(principal); command.Parameters.AddWithValue(ids.ToArray()); command.Parameters.AddWithValue(protection.CreateProtector(ProtectorPurpose(purpose), principal).Protect(key)); command.Parameters.AddWithValue(purpose); command.Parameters.AddWithValue(writable.ToArray());
        await command.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
      }
      return new { id, key = Convert.ToBase64String(key) };
    }
  }
  public async Task<object> Unlock(string principal, Guid id, string purpose, CancellationToken ct)
  {
    var command = dataSource.CreateCommand("""
            SELECT k.protected_key FROM sm_recovery_keys k WHERE k.id=$1 AND k.principal=$2 AND k.purpose=$3
            AND (k.purpose='personal' OR (
              NOT EXISTS(SELECT 1 FROM unnest(k.resources) r WHERE NOT EXISTS(
                SELECT 1 FROM sm_songs s LEFT JOIN sm_grants g ON s.id=g.song AND g.principal=$2
                WHERE s.id=r AND NOT s.purged AND (s.owner=$2 OR (NOT s.deleted AND g.role IN ('editor','viewer')))))
              AND NOT EXISTS(SELECT 1 FROM unnest(COALESCE(k.write_resources,k.resources)) r WHERE NOT EXISTS(
                SELECT 1 FROM sm_songs s LEFT JOIN sm_grants g ON s.id=g.song AND g.principal=$2
                WHERE s.id=r AND NOT s.deleted AND NOT s.purged AND (s.owner=$2 OR g.role='editor')))))
            """);
    await using (command.ConfigureAwait(false))
    {
      command.Parameters.AddWithValue(id); command.Parameters.AddWithValue(principal); command.Parameters.AddWithValue(purpose);
      if (await command.ExecuteScalarAsync(ct).ConfigureAwait(false) is not byte[] value) throw new AccessDeniedException("Protected work cannot be unlocked for the current account and resource scope.");
      return new { id, key = Convert.ToBase64String(protection.CreateProtector(ProtectorPurpose(purpose), principal).Unprotect(value)) };
    }
  }
  private static string ProtectorPurpose(string purpose) => string.Equals(purpose, "personal", StringComparison.Ordinal) ? "ScoreMap.PersonalPending.v1" : "ScoreMap.Pending.v1";
  public async Task Delete(string principal, Guid id, string purpose, CancellationToken ct)
  {
    var command = dataSource.CreateCommand("DELETE FROM sm_recovery_keys WHERE principal=$1 AND id=$2 AND purpose=$3");
    await using (command.ConfigureAwait(false))
    {
      command.Parameters.AddWithValue(principal); command.Parameters.AddWithValue(id); command.Parameters.AddWithValue(purpose); await command.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }
  }
}
