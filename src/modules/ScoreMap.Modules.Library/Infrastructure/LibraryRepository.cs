using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using JuanGCarmona.ScoreMap.Modules.Library.Application;
using JuanGCarmona.ScoreMap.Modules.Library.Contracts;
using JuanGCarmona.ScoreMap.Modules.Library.Domain;
using Npgsql;

namespace JuanGCarmona.ScoreMap.Modules.Library.Infrastructure;

internal sealed partial class LibraryRepository(NpgsqlDataSource dataSource) : ILibraryRepository
{
  internal async Task Initialize(CancellationToken cancellationToken)
  {
    var command = dataSource.CreateCommand("""
            BEGIN;
            SELECT pg_advisory_xact_lock(1458674261);
            CREATE TABLE IF NOT EXISTS sm_schema(id smallint PRIMARY KEY CHECK(id=1), version integer NOT NULL);
            INSERT INTO sm_schema(id,version) VALUES(1,1) ON CONFLICT DO NOTHING;
            DO $$ BEGIN IF EXISTS(SELECT 1 FROM sm_schema WHERE version NOT IN (1,2)) THEN RAISE EXCEPTION 'Unsupported ScoreMap storage schema; preserve the database and use a compatible build.'; END IF; END $$;
            CREATE TABLE IF NOT EXISTS sm_libraries(principal text PRIMARY KEY, revision bigint NOT NULL DEFAULT 0, repertoires jsonb NOT NULL DEFAULT '[]');
            ALTER TABLE sm_libraries ADD COLUMN IF NOT EXISTS song_order text[] NOT NULL DEFAULT '{}';
            CREATE TABLE IF NOT EXISTS sm_songs(id text PRIMARY KEY, owner text NOT NULL, revision bigint NOT NULL, content jsonb, deleted boolean NOT NULL DEFAULT false, purged boolean NOT NULL DEFAULT false);
            CREATE TABLE IF NOT EXISTS sm_grants(song text NOT NULL REFERENCES sm_songs(id), principal text NOT NULL, role text NOT NULL CHECK(role IN ('editor','viewer')), PRIMARY KEY(song,principal));
            CREATE TABLE IF NOT EXISTS sm_history(song text NOT NULL REFERENCES sm_songs(id), revision bigint NOT NULL, content jsonb NOT NULL, deleted boolean NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(song,revision));
            CREATE TABLE IF NOT EXISTS sm_migrations(song text NOT NULL REFERENCES sm_songs(id),from_revision bigint NOT NULL,to_revision bigint NOT NULL,mapping jsonb NOT NULL,PRIMARY KEY(song,to_revision));
            ALTER TABLE sm_history ADD COLUMN IF NOT EXISTS actor text;
            ALTER TABLE sm_history ADD COLUMN IF NOT EXISTS operation text;
            ALTER TABLE sm_history ADD COLUMN IF NOT EXISTS base_revision bigint;
            ALTER TABLE sm_history ADD COLUMN IF NOT EXISTS source_revision bigint;
            ALTER TABLE sm_history ADD COLUMN IF NOT EXISTS command_id uuid;
            ALTER TABLE sm_history ADD COLUMN IF NOT EXISTS source jsonb;
            CREATE TABLE IF NOT EXISTS sm_receipts(principal text NOT NULL, command uuid NOT NULL, hash text NOT NULL, response jsonb NOT NULL, PRIMARY KEY(principal,command));
            CREATE TABLE IF NOT EXISTS sm_sessions(id text PRIMARY KEY, ticket bytea NOT NULL, expires timestamptz NOT NULL);
            CREATE TABLE IF NOT EXISTS sm_voicing_presets(principal text NOT NULL,id text NOT NULL,revision bigint NOT NULL,content jsonb,deleted boolean NOT NULL DEFAULT false,PRIMARY KEY(principal,id));
            CREATE TABLE IF NOT EXISTS sm_preset_receipts(principal text NOT NULL,command uuid NOT NULL,hash text NOT NULL,preset text NOT NULL,revision bigint NOT NULL,PRIMARY KEY(principal,command));
            CREATE TABLE IF NOT EXISTS sm_device_configurations(principal text NOT NULL,id text NOT NULL,revision bigint NOT NULL,content jsonb,deleted boolean NOT NULL DEFAULT false,PRIMARY KEY(principal,id));
            CREATE TABLE IF NOT EXISTS sm_device_receipts(principal text NOT NULL,command uuid NOT NULL,hash text NOT NULL,configuration text NOT NULL,revision bigint NOT NULL,PRIMARY KEY(principal,command));
            CREATE TABLE IF NOT EXISTS sm_notation(principal text PRIMARY KEY,revision bigint NOT NULL,mode text NOT NULL CHECK(mode IN ('anglo','latin','dual')),primary_notation text NOT NULL CHECK(primary_notation IN ('anglo','latin')),CHECK(mode='dual' OR mode=primary_notation));
            CREATE TABLE IF NOT EXISTS sm_notation_receipts(principal text NOT NULL,command uuid NOT NULL,hash text NOT NULL,response jsonb NOT NULL,PRIMARY KEY(principal,command));
            UPDATE sm_receipts SET response=jsonb_build_object('Revision',response#>'{Library,revision}','Versions',response->'Versions','Capabilities',response->'Capabilities') WHERE response ? 'Library';
            COMMIT;
            """);
    await using (command.ConfigureAwait(false))
    {
      await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }
  }
  private static async Task<int> Execute(NpgsqlConnection connection, string sql, CancellationToken ct, params object[] values)
  {
    var command = new NpgsqlCommand(sql, connection);
    await using (command.ConfigureAwait(false))
    {
      foreach (var value in values) command.Parameters.Add(new NpgsqlParameter { Value = value });
      return await command.ExecuteNonQueryAsync(ct).ConfigureAwait(false);
    }
  }
  private static async Task<object?> Scalar(NpgsqlConnection connection, string sql, CancellationToken ct, params object[] values)
  {
    var command = new NpgsqlCommand(sql, connection);
    await using (command.ConfigureAwait(false))
    {
      foreach (var value in values) command.Parameters.Add(new NpgsqlParameter { Value = value });
      return await command.ExecuteScalarAsync(ct).ConfigureAwait(false);
    }
  }
  private static async Task Lock(NpgsqlConnection connection, CancellationToken ct)
  {
    // Serialize grants and content together for the bounded single-server MVP.
    await Execute(connection, "SELECT pg_advisory_xact_lock(1458674261)", ct).ConfigureAwait(false);
  }
  public async Task<LibraryView> Read(string principal, CancellationToken cancellationToken)
  {
    var connection = await dataSource.OpenConnectionAsync(cancellationToken).ConfigureAwait(false);
    await using (connection.ConfigureAwait(false))
    {
      var transaction = await connection.BeginTransactionAsync(System.Data.IsolationLevel.RepeatableRead, cancellationToken).ConfigureAwait(false);
      await using var transactionDisposal = transaction.ConfigureAwait(false);
      var result = await ReadView(connection, principal, cancellationToken).ConfigureAwait(false);
      await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
      return result;
    }
  }
  private static async Task<LibraryView> ReadView(NpgsqlConnection connection, string principal, CancellationToken ct)
  {
    var revision = 0L;
    var repertoires = JsonSerializer.SerializeToElement(Array.Empty<object>());
    string[] order = [];
    var command = new NpgsqlCommand("SELECT revision,repertoires::text,song_order FROM sm_libraries WHERE principal=$1", connection);
    await using (command.ConfigureAwait(false))
    {
      command.Parameters.AddWithValue(principal);
      var reader = await command.ExecuteReaderAsync(ct).ConfigureAwait(false);
      await using var readerDisposal = reader.ConfigureAwait(false);
      if (await reader.ReadAsync(ct).ConfigureAwait(false)) { revision = reader.GetInt64(0); repertoires = JsonDocument.Parse(reader.GetString(1)).RootElement.Clone(); order = reader.GetFieldValue<string[]>(2); }
    }
    var songs = new List<JsonElement>();
    var versions = new Dictionary<string, long>(StringComparer.Ordinal);
    var capabilities = new Dictionary<string, string>(StringComparer.Ordinal);
    var songCommand = new NpgsqlCommand("SELECT s.id,s.revision,s.content::text,CASE WHEN s.owner=$1 THEN 'owner' ELSE g.role END FROM sm_songs s LEFT JOIN sm_grants g ON g.song=s.id AND g.principal=$1 WHERE NOT s.deleted AND NOT s.purged AND (s.owner=$1 OR g.principal=$1) ORDER BY s.id", connection);
    await using (songCommand.ConfigureAwait(false))
    {
      songCommand.Parameters.AddWithValue(principal);
      var reader = await songCommand.ExecuteReaderAsync(ct).ConfigureAwait(false);
      await using var readerDisposal = reader.ConfigureAwait(false);
      while (await reader.ReadAsync(ct).ConfigureAwait(false))
      {
        var id = reader.GetString(0); versions.Add(id, reader.GetInt64(1)); songs.Add(JsonDocument.Parse(reader.GetString(2)).RootElement.Clone()); capabilities.Add(id, reader.GetString(3));
      }
    }
    // Revocation immediately removes shared membership visibility, without copying the song.
    var visibleRepertoires = repertoires.EnumerateArray().Select(r => new { id = r.GetProperty("id").GetString(), title = r.GetProperty("title").GetString(), songIds = r.GetProperty("songIds").EnumerateArray().Select(i => i.GetString()!).Where(versions.ContainsKey).ToArray() });
    var positions = order.Select((id, index) => (id, index)).ToDictionary(p => p.id, p => p.index, StringComparer.Ordinal);
    var ordered = songs.OrderBy(song => positions.GetValueOrDefault(song.GetProperty("id").GetString()!, int.MaxValue)).ToArray();
    return new LibraryView(JsonSerializer.SerializeToElement(new { schemaVersion = ordered.Any(LibraryDocument.IsRichSong) ? 2 : 1, revision, songs = ordered, repertoires = visibleRepertoires }), versions, capabilities);
  }
  public async Task<LibraryView> Commit(string principal, LibraryDocument document, CommitLibrary request, CancellationToken cancellationToken)
  {
    var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(request))));
    var connection = await dataSource.OpenConnectionAsync(cancellationToken).ConfigureAwait(false);
    await using (connection.ConfigureAwait(false))
    {
      var transaction = await connection.BeginTransactionAsync(cancellationToken).ConfigureAwait(false);
      await using var transactionDisposal = transaction.ConfigureAwait(false);
      await Lock(connection, cancellationToken).ConfigureAwait(false);
      await Execute(connection, "INSERT INTO sm_libraries(principal) VALUES($1) ON CONFLICT DO NOTHING", cancellationToken, principal).ConfigureAwait(false);
      var current = await ReadView(connection, principal, cancellationToken).ConfigureAwait(false);
      var receipt = await Receipt(connection, principal, request.CommandId, hash, current, cancellationToken).ConfigureAwait(false);
      if (receipt is not null)
      {
        if (receipt.Capabilities.Keys.Any(id => !current.Capabilities.ContainsKey(id))) throw new AccessDeniedException("Receipt content is no longer available under current permissions.");
        return receipt;
      }
      if (current.Library.GetProperty("revision").GetInt64() != request.ExpectedRevision) throw new RevisionConflictException("Newer library changes exist. Export your work and reload to compare.");
      var previous = current.Library.GetProperty("songs").EnumerateArray().ToDictionary(s => s.GetProperty("id").GetString()!, StringComparer.Ordinal);
      var proposed = document.Songs.ToDictionary(s => s.GetProperty("id").GetString()!, StringComparer.Ordinal);
      if (request.Import && previous.Any(p => !proposed.TryGetValue(p.Key, out var retained) || !JsonElement.DeepEquals(p.Value, retained))) throw new RevisionConflictException("Import cannot replace existing private songs. Import explicitly confirmed new copies instead.");
      ValidateImportSource(current, document, request.Source, previous, proposed);
      var migrationSources = new Dictionary<string, JsonElement>(StringComparer.Ordinal);
      if (request.Import)
      {
        var migrated = ScoreMigration.Import(document, previous); document = migrated.Document; migrationSources = migrated.Sources;
        proposed = document.Songs.ToDictionary(s => s.GetProperty("id").GetString()!, StringComparer.Ordinal);
      }
      await SaveSongs(connection, principal, current, request, previous, proposed, migrationSources, cancellationToken).ConfigureAwait(false);
      if (proposed.Values.Any(LibraryDocument.IsRichSong)) await Execute(connection, "UPDATE sm_schema SET version=2 WHERE id=1", cancellationToken).ConfigureAwait(false);
      foreach (var (id, song) in previous.Where(p => !proposed.ContainsKey(p.Key)))
        await DeleteSong(connection, principal, id, song, current, request, cancellationToken).ConfigureAwait(false);
      await Execute(connection, "UPDATE sm_libraries SET revision=revision+1,repertoires=$2::jsonb,song_order=$3 WHERE principal=$1", cancellationToken, principal, document.Value.GetProperty("repertoires").GetRawText(), document.Songs.Select(song => song.GetProperty("id").GetString()!).ToArray()).ConfigureAwait(false);
      if (request.RecoveryKeyId is Guid recoveryId)
      {
        var bound = await Execute(connection, "UPDATE sm_recovery_keys SET resources=ARRAY(SELECT DISTINCT unnest(resources || $3)) WHERE id=$1 AND principal=$2 AND purpose='song'", cancellationToken, recoveryId, principal, document.Songs.Select(song => song.GetProperty("id").GetString()!).ToArray()).ConfigureAwait(false);
        LibraryDocument.Require(bound == 1, "Private recovery key is unavailable; sign in again without discarding your pending work.");
      }
      var saved = await ReadView(connection, principal, cancellationToken).ConfigureAwait(false);
      await Execute(connection, "INSERT INTO sm_receipts(principal,command,hash,response) VALUES($1,$2,$3,$4::jsonb)", cancellationToken, principal, request.CommandId, hash, JsonSerializer.Serialize(new LibraryReceipt(saved.Library.GetProperty("revision").GetInt64(), saved.Versions, saved.Capabilities))).ConfigureAwait(false);
      await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
      return saved;
    }
  }
  private static void ValidateImportSource(LibraryView current, LibraryDocument document, ImportSource? source, Dictionary<string, JsonElement> previous, Dictionary<string, JsonElement> proposed)
  {
    if (source is null) return;
    var previousRepertoires = current.Library.GetProperty("repertoires").EnumerateArray().Select(value => value.GetProperty("id").GetString()).ToHashSet(StringComparer.Ordinal);
    var addedRepertoires = document.Value.GetProperty("repertoires").EnumerateArray().Count(value => !previousRepertoires.Contains(value.GetProperty("id").GetString()));
    LibraryDocument.Require(source.SongCount == proposed.Keys.Count(id => !previous.ContainsKey(id)) && source.RepertoireCount == addedRepertoires, "The declared selected import scope does not match its complete new destination boundaries.");
  }
  private static void CheckVersion(string id, IReadOnlyDictionary<string, long> expected, IReadOnlyDictionary<string, long> actual)
  {
    if (!expected.TryGetValue(id, out var version) || version != actual[id]) throw new RevisionConflictException("A newer song revision exists. Your work has not overwritten it; export and reload to compare.");
  }
  public async Task Grant(string owner, string song, GrantRequest request, CancellationToken ct)
  {
    LibraryDocument.Require(request.Role is null or "editor" or "viewer" && !string.IsNullOrWhiteSpace(request.Principal), "Choose a stable principal and an editor/viewer grant.");
    var connection = await dataSource.OpenConnectionAsync(ct).ConfigureAwait(false);
    await using (connection.ConfigureAwait(false))
    {
      var transaction = await connection.BeginTransactionAsync(ct).ConfigureAwait(false);
      await using var transactionDisposal = transaction.ConfigureAwait(false);
      await Lock(connection, ct).ConfigureAwait(false);
      if (await Scalar(connection, "SELECT 1 FROM sm_songs WHERE id=$1 AND owner=$2 AND NOT deleted AND NOT purged", ct, song, owner).ConfigureAwait(false) is null) throw new AccessDeniedException("This song is unavailable.");
      await Execute(connection, "DELETE FROM sm_grants WHERE song=$1 AND principal=$2", ct, song, request.Principal).ConfigureAwait(false);
      if (request.Role is not null) await Execute(connection, "INSERT INTO sm_grants(song,principal,role) VALUES($1,$2,$3)", ct, song, request.Principal, request.Role).ConfigureAwait(false);
      _ = new LibraryDocument((await ReadView(connection, request.Principal, ct).ConfigureAwait(false)).Library);
      await transaction.CommitAsync(ct).ConfigureAwait(false);
    }
  }

  private static async Task DeleteSong(NpgsqlConnection connection, string principal, string id, JsonElement song, LibraryView current, CommitLibrary request, CancellationToken cancellationToken)
  {
    if (!string.Equals(current.Capabilities[id], "owner", StringComparison.Ordinal)) throw new AccessDeniedException("Only the song owner can delete it. Shared songs cannot be removed by replacing your library.");
    CheckVersion(id, request.Versions, current.Versions);
    await Execute(connection, "UPDATE sm_songs SET deleted=true,revision=revision+1 WHERE id=$1", cancellationToken, id).ConfigureAwait(false);
    await Execute(connection, "INSERT INTO sm_history(song,revision,content,deleted,actor,operation,base_revision,command_id) VALUES($1,$2,$3::jsonb,true,$4,'delete',$5,$6)", cancellationToken, id, current.Versions[id] + 1, song.GetRawText(), principal, current.Versions[id], request.CommandId).ConfigureAwait(false);
    await Execute(connection, "DELETE FROM sm_grants WHERE song=$1", cancellationToken, id).ConfigureAwait(false);
    await Execute(connection, """
                UPDATE sm_libraries SET revision=revision+1,repertoires=(
                  SELECT COALESCE(jsonb_agg(jsonb_set(r,'{songIds}',(SELECT COALESCE(jsonb_agg(i),'[]') FROM jsonb_array_elements(r->'songIds') i WHERE i<>to_jsonb($1::text)))),'[]')
                  FROM jsonb_array_elements(repertoires) r)
                WHERE principal<>$2 AND EXISTS(SELECT 1 FROM jsonb_array_elements(repertoires) r WHERE r->'songIds' ? $1)
                """, cancellationToken, id, principal).ConfigureAwait(false);
  }
  private static async Task<LibraryView?> Receipt(NpgsqlConnection connection, string principal, Guid commandId, string hash, LibraryView current, CancellationToken ct)
  {
    var command = new NpgsqlCommand("SELECT hash,response::text FROM sm_receipts WHERE principal=$1 AND command=$2", connection);
    await using var commandDisposal = command.ConfigureAwait(false);
    command.Parameters.AddWithValue(principal); command.Parameters.AddWithValue(commandId);
    var reader = await command.ExecuteReaderAsync(ct).ConfigureAwait(false);
    await using var readerDisposal = reader.ConfigureAwait(false);
    if (!await reader.ReadAsync(ct).ConfigureAwait(false)) return null;
    if (!string.Equals(reader.GetString(0), hash, StringComparison.Ordinal)) throw new RevisionConflictException("A command identity cannot be reused with different content.");
    using var response = JsonDocument.Parse(reader.GetString(1));
    if (response.RootElement.TryGetProperty("Purged", out _)) throw new RevisionConflictException("This receipt contains permanently purged content and cannot be replayed.");
    var acknowledged = JsonSerializer.Deserialize<LibraryReceipt>(reader.GetString(1))!;
    if (acknowledged.Capabilities.Keys.Any(id => !current.Capabilities.ContainsKey(id))) throw new AccessDeniedException("The receipt is outside your current resource permissions.");
    if (acknowledged.Revision != current.Library.GetProperty("revision").GetInt64() || acknowledged.Versions.Count != current.Versions.Count || acknowledged.Versions.Any(p => !current.Versions.TryGetValue(p.Key, out var version) || version != p.Value) || acknowledged.Capabilities.Any(p => !current.Capabilities.TryGetValue(p.Key, out var role) || !string.Equals(role, p.Value, StringComparison.Ordinal)))
      throw new RevisionConflictException("This command was acknowledged, but newer content or permissions exist. Export pending work and reload to compare before continuing.");
    return current;
  }

  private static async Task SaveSongs(NpgsqlConnection connection, string principal, LibraryView current, CommitLibrary request, Dictionary<string, JsonElement> previous, IReadOnlyDictionary<string, JsonElement> proposed, Dictionary<string, JsonElement> migrationSources, CancellationToken cancellationToken)
  {
    foreach (var (id, song) in proposed)
    {
      if (previous.TryGetValue(id, out var old) && JsonElement.DeepEquals(old, song)) continue;
      long version;
      if (previous.ContainsKey(id))
      {
        if (string.Equals(current.Capabilities[id], "viewer", StringComparison.Ordinal)) throw new AccessDeniedException("You have read-only access to this song.");
        CheckVersion(id, request.Versions, current.Versions);
        version = current.Versions[id] + 1;
        await Execute(connection, "UPDATE sm_songs SET content=$2::jsonb,revision=$3 WHERE id=$1", cancellationToken, id, song.GetRawText(), version).ConfigureAwait(false);
      }
      else
      {
        if (await Scalar(connection, "SELECT 1 FROM sm_songs WHERE id=$1", cancellationToken, id).ConfigureAwait(false) is not null)
          throw new RevisionConflictException("An imported identity is already in use. Keep the original and use an explicitly confirmed copy.");
        version = 1;
        await Execute(connection, "INSERT INTO sm_songs(id,owner,revision,content) VALUES($1,$2,1,$3::jsonb)", cancellationToken, id, principal, song.GetRawText()).ConfigureAwait(false);
      }
      await RetainMigration(connection, id, version, song, previous.GetValueOrDefault(id), migrationSources.GetValueOrDefault(id), request.CommandId, cancellationToken).ConfigureAwait(false);
      await Execute(connection, "INSERT INTO sm_history(song,revision,content,deleted,actor,operation,base_revision,command_id,source_revision,source) VALUES($1,$2,$3::jsonb,false,$4,$5,$6,$7,$8,$9::jsonb)", cancellationToken, id, version, song.GetRawText(), principal, request.Import ? "import" : previous.ContainsKey(id) ? "edit" : "create", version - 1, request.CommandId, request.Source is { } provenance ? provenance.Revision : DBNull.Value, request.Source is not null ? JsonSerializer.Serialize(request.Source, JsonSerializerOptions.Web) : DBNull.Value).ConfigureAwait(false);
    }
  }
  private sealed record LibraryReceipt(long Revision, IReadOnlyDictionary<string, long> Versions, IReadOnlyDictionary<string, string> Capabilities);
}
