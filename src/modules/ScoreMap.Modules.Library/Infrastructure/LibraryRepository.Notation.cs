using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using JuanGCarmona.ScoreMap.Modules.Library.Application;
using JuanGCarmona.ScoreMap.Modules.Library.Contracts;
using Npgsql;

namespace JuanGCarmona.ScoreMap.Modules.Library.Infrastructure;

internal sealed partial class LibraryRepository
{
  public async Task<NotationSettings> ReadNotation(string principal, CancellationToken cancellationToken)
  {
    var connection = await dataSource.OpenConnectionAsync(cancellationToken).ConfigureAwait(false);
    await using var disposal = connection.ConfigureAwait(false);
    return await Notation(connection, principal, cancellationToken).ConfigureAwait(false);
  }
  private static async Task<NotationSettings> Notation(NpgsqlConnection connection, string principal, CancellationToken ct)
  {
    var json = await Scalar(connection, "SELECT jsonb_build_object('Revision',revision,'Mode',mode,'Primary',primary_notation)::text FROM sm_notation WHERE principal=$1", ct, principal).ConfigureAwait(false);
    return json is string value ? JsonSerializer.Deserialize<NotationSettings>(value)! : new NotationSettings(0, "anglo", "anglo");
  }
  public async Task<NotationSettings> SaveNotation(string principal, NotationRequest request, CancellationToken cancellationToken)
  {
    var connection = await dataSource.OpenConnectionAsync(cancellationToken).ConfigureAwait(false);
    await using var connectionDisposal = connection.ConfigureAwait(false);
    var transaction = await connection.BeginTransactionAsync(cancellationToken).ConfigureAwait(false);
    await using var transactionDisposal = transaction.ConfigureAwait(false);
    await Lock(connection, cancellationToken).ConfigureAwait(false);
    var current = await Notation(connection, principal, cancellationToken).ConfigureAwait(false);
    var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(request))));
    var receipt = await NotationReceipt(connection, principal, request.CommandId, hash, cancellationToken).ConfigureAwait(false);
    if (receipt is not null)
    {
      if (receipt != current) throw new RevisionConflictException("The preference was acknowledged, but newer note-name settings exist. Load the saved choice before continuing.");
      return receipt;
    }
    if (current.Revision != request.ExpectedRevision) throw new RevisionConflictException("Newer note-name settings exist. Load the saved choice before continuing.");
    var saved = new NotationSettings(current.Revision + 1, request.Mode, request.Primary);
    await Execute(connection, "INSERT INTO sm_notation(principal,revision,mode,primary_notation) VALUES($1,$2,$3,$4) ON CONFLICT(principal) DO UPDATE SET revision=EXCLUDED.revision,mode=EXCLUDED.mode,primary_notation=EXCLUDED.primary_notation", cancellationToken, principal, saved.Revision, saved.Mode, saved.Primary).ConfigureAwait(false);
    await Execute(connection, "INSERT INTO sm_notation_receipts(principal,command,hash,response) VALUES($1,$2,$3,$4::jsonb)", cancellationToken, principal, request.CommandId, hash, JsonSerializer.Serialize(saved)).ConfigureAwait(false);
    await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
    return saved;
  }
  private static async Task<NotationSettings?> NotationReceipt(NpgsqlConnection connection, string principal, Guid command, string hash, CancellationToken ct)
  {
    var lookup = new NpgsqlCommand("SELECT hash,response::text FROM sm_notation_receipts WHERE principal=$1 AND command=$2", connection);
    await using var disposal = lookup.ConfigureAwait(false);
    lookup.Parameters.AddWithValue(principal); lookup.Parameters.AddWithValue(command);
    var reader = await lookup.ExecuteReaderAsync(ct).ConfigureAwait(false);
    await using var readerDisposal = reader.ConfigureAwait(false);
    if (!await reader.ReadAsync(ct).ConfigureAwait(false)) return null;
    if (!string.Equals(reader.GetString(0), hash, StringComparison.Ordinal)) throw new RevisionConflictException("A preference command identity cannot be reused with different settings.");
    return JsonSerializer.Deserialize<NotationSettings>(reader.GetString(1));
  }
}
