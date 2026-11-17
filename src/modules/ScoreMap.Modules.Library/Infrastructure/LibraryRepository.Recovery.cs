using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using JuanGCarmona.ScoreMap.Modules.Library.Application;
using JuanGCarmona.ScoreMap.Modules.Library.Contracts;
using JuanGCarmona.ScoreMap.Modules.Library.Domain;
using Npgsql;

namespace JuanGCarmona.ScoreMap.Modules.Library.Infrastructure;

internal sealed partial class LibraryRepository
{
  public async Task<JsonElement> Trash(string principal, CancellationToken cancellationToken)
  {
    var connection = await dataSource.OpenConnectionAsync(cancellationToken).ConfigureAwait(false);
    await using var disposal = connection.ConfigureAwait(false);
    var value = await Scalar(connection, "SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'title',content->>'title','revision',revision) ORDER BY id),'[]')::text FROM sm_songs WHERE owner=$1 AND deleted AND NOT purged", cancellationToken, principal).ConfigureAwait(false);
    return JsonDocument.Parse((string)value!).RootElement.Clone();
  }
  public async Task<JsonElement> History(string principal, string song, CancellationToken cancellationToken)
  {
    var connection = await dataSource.OpenConnectionAsync(cancellationToken).ConfigureAwait(false);
    await using var disposal = connection.ConfigureAwait(false);
    var value = await Scalar(connection, """
            SELECT (SELECT COALESCE(jsonb_agg(jsonb_build_object('revision',h.revision,'content',h.content,'deleted',h.deleted,'created',h.created_at,'actor',h.actor,'operation',h.operation,'baseRevision',h.base_revision,'sourceRevision',h.source_revision,'commandId',h.command_id) ORDER BY h.revision DESC),'[]')::text FROM sm_history h WHERE h.song=s.id)
            FROM sm_songs s LEFT JOIN sm_grants g ON g.song=s.id AND g.principal=$2
            WHERE s.id=$1 AND NOT s.purged AND (s.owner=$2 OR (NOT s.deleted AND g.principal=$2))
            """, cancellationToken, song, principal).ConfigureAwait(false);
    if (value is not string json) throw new AccessDeniedException("This song history is unavailable.");
    return JsonDocument.Parse(json).RootElement.Clone();
  }
  public async Task<RecoveryAcknowledgement> Recover(string principal, string song, string operation, RestoreRequest request, CancellationToken cancellationToken)
  {
    var connection = await dataSource.OpenConnectionAsync(cancellationToken).ConfigureAwait(false);
    await using var connectionDisposal = connection.ConfigureAwait(false);
    var transaction = await connection.BeginTransactionAsync(cancellationToken).ConfigureAwait(false);
    await using var transactionDisposal = transaction.ConfigureAwait(false);
    await Lock(connection, cancellationToken).ConfigureAwait(false);
    var state = await StoredSong(connection, principal, song, cancellationToken).ConfigureAwait(false);
    var owner = string.Equals(state.GetProperty("owner").GetString(), principal, StringComparison.Ordinal);
    var role = state.GetProperty("role").GetString();
    if (!owner && (!string.Equals(role, "editor", StringComparison.Ordinal) || state.GetProperty("deleted").GetBoolean() || string.Equals(operation, "purge", StringComparison.Ordinal))) throw new AccessDeniedException("This recovery operation is unavailable.");
    var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { song, operation, request }))));
    var receipt = await RecoveryReceipt(connection, principal, request.CommandId, hash, cancellationToken).ConfigureAwait(false);
    if (receipt is not null) return receipt;
    if (state.GetProperty("purged").GetBoolean() || state.GetProperty("revision").GetInt64() != request.ExpectedRevision) throw new RevisionConflictException("This song changed or was permanently purged. Reload before continuing.");
    if (string.Equals(operation, "purge", StringComparison.Ordinal)) await PurgeSong(connection, song, state, request, cancellationToken).ConfigureAwait(false);
    else await RestoreSong(connection, principal, song, state, request, cancellationToken).ConfigureAwait(false);
    var saved = new RecoveryAcknowledgement(request.CommandId, song, state.GetProperty("revision").GetInt64() + 1, string.Equals(operation, "purge", StringComparison.Ordinal) ? "purged" : "active");
    await Execute(connection, "INSERT INTO sm_receipts(principal,command,hash,response) VALUES($1,$2,$3,$4::jsonb)", cancellationToken, principal, request.CommandId, hash, JsonSerializer.Serialize(new { Recovery = saved })).ConfigureAwait(false);
    await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
    return saved;
  }
  private static async Task<JsonElement> StoredSong(NpgsqlConnection connection, string principal, string song, CancellationToken ct)
  {
    var value = await Scalar(connection, "SELECT jsonb_build_object('owner',s.owner,'revision',s.revision,'content',s.content,'deleted',s.deleted,'purged',s.purged,'role',g.role)::text FROM sm_songs s LEFT JOIN sm_grants g ON g.song=s.id AND g.principal=$2 WHERE s.id=$1", ct, song, principal).ConfigureAwait(false);
    if (value is not string json) throw new AccessDeniedException("This song is unavailable.");
    return JsonDocument.Parse(json).RootElement.Clone();
  }
  private static async Task RestoreSong(NpgsqlConnection connection, string principal, string song, JsonElement state, RestoreRequest request, CancellationToken ct)
  {
    var content = state.GetProperty("content");
    if (request.Revision is long revision)
    {
      var historical = await Scalar(connection, "SELECT content::text FROM sm_history WHERE song=$1 AND revision=$2", ct, song, revision).ConfigureAwait(false);
      if (historical is not string json) throw new RevisionConflictException("The selected revision is unavailable.");
      content = JsonDocument.Parse(json).RootElement.Clone();
    }
    var current = await ReadView(connection, principal, ct).ConfigureAwait(false);
    var songs = current.Library.GetProperty("songs").EnumerateArray().Where(s => !string.Equals(s.GetProperty("id").GetString(), song, StringComparison.Ordinal)).Append(content).ToArray();
    var complete = JsonSerializer.SerializeToElement(new { schemaVersion = songs.Any(LibraryDocument.IsRichSong) ? 2 : 1, revision = 0, songs, repertoires = current.Library.GetProperty("repertoires") });
    _ = new LibraryDocument(complete);
    var next = state.GetProperty("revision").GetInt64() + 1;
    await Execute(connection, "UPDATE sm_songs SET deleted=false,revision=$2,content=$3::jsonb WHERE id=$1", ct, song, next, content.GetRawText()).ConfigureAwait(false);
    await Execute(connection, "INSERT INTO sm_history(song,revision,content,deleted,actor,operation,base_revision,source_revision,command_id) VALUES($1,$2,$3::jsonb,false,$4,'restore',$5,$6,$7)", ct, song, next, content.GetRawText(), principal, next - 1, request.Revision ?? next - 1, request.CommandId).ConfigureAwait(false);
    if (state.GetProperty("deleted").GetBoolean()) await Execute(connection, "DELETE FROM sm_grants WHERE song=$1", ct, song).ConfigureAwait(false);
    await Execute(connection, "INSERT INTO sm_libraries(principal) VALUES($1) ON CONFLICT DO NOTHING", ct, principal).ConfigureAwait(false);
    await Execute(connection, "UPDATE sm_libraries SET revision=revision+1,song_order=CASE WHEN $2=ANY(song_order) THEN song_order ELSE array_append(song_order,$2) END WHERE principal=$1", ct, principal, song).ConfigureAwait(false);
  }
  private static async Task PurgeSong(NpgsqlConnection connection, string song, JsonElement state, RestoreRequest request, CancellationToken ct)
  {
    LibraryDocument.Require(state.GetProperty("deleted").GetBoolean() && string.Equals(request.Confirmation, state.GetProperty("content").GetProperty("title").GetString(), StringComparison.Ordinal), "Confirm the exact deleted song title before permanent purge.");
    await Execute(connection, "DELETE FROM sm_migrations WHERE song=$1", ct, song).ConfigureAwait(false);
    await Execute(connection, "DELETE FROM sm_history WHERE song=$1", ct, song).ConfigureAwait(false);
    await Execute(connection, "DELETE FROM sm_grants WHERE song=$1", ct, song).ConfigureAwait(false);
    await Execute(connection, "UPDATE sm_songs SET purged=true,deleted=true,content=NULL,revision=revision+1 WHERE id=$1", ct, song).ConfigureAwait(false);
  }
  private static async Task<RecoveryAcknowledgement?> RecoveryReceipt(NpgsqlConnection connection, string principal, Guid commandId, string hash, CancellationToken ct)
  {
    var command = new NpgsqlCommand("SELECT hash,response::text FROM sm_receipts WHERE principal=$1 AND command=$2", connection);
    await using var disposal = command.ConfigureAwait(false);
    command.Parameters.AddWithValue(principal); command.Parameters.AddWithValue(commandId);
    var reader = await command.ExecuteReaderAsync(ct).ConfigureAwait(false);
    await using var readerDisposal = reader.ConfigureAwait(false);
    if (!await reader.ReadAsync(ct).ConfigureAwait(false)) return null;
    if (!string.Equals(reader.GetString(0), hash, StringComparison.Ordinal)) throw new RevisionConflictException("This command identity is already in use.");
    using var document = JsonDocument.Parse(reader.GetString(1));
    if (!document.RootElement.TryGetProperty("Recovery", out var recovery)) throw new RevisionConflictException("This is not a recovery command receipt.");
    return recovery.Deserialize<RecoveryAcknowledgement>();
  }
}
