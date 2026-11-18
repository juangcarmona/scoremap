using System.Text.Json;
using JuanGCarmona.ScoreMap.Modules.Library.Domain;
using Npgsql;

namespace JuanGCarmona.ScoreMap.Modules.Library.Infrastructure;

internal sealed partial class LibraryRepository
{
  private static async Task RetainMigration(NpgsqlConnection connection, string songId, long revision, JsonElement candidate, JsonElement previous, JsonElement importedSource, Guid commandId, CancellationToken ct)
  {
    if (!LibraryDocument.IsRichSong(candidate)) return;
    var import = importedSource.ValueKind != JsonValueKind.Undefined;
    var legacyUpdate = previous.ValueKind != JsonValueKind.Undefined && !LibraryDocument.IsRichSong(previous);
    if (!import && !legacyUpdate) return;
    LibraryDocument.Require(candidate.TryGetProperty("migration", out var mapping), "Retain the generated migration mapping before activating richer content.");
    var source = import ? importedSource : previous;
    ScoreMigration.ValidateActivation(source, candidate);
    var sourceRevision = import ? 0 : revision - 1;
    var retained = await Scalar(connection, "SELECT content::text FROM sm_history WHERE song=$1 AND revision=$2", ct, songId, sourceRevision).ConfigureAwait(false);
    if (retained is string json) LibraryDocument.Require(JsonElement.DeepEquals(JsonDocument.Parse(json).RootElement, source), "The pre-migration source differs from its immutable history. Preserve it and recover before migrating.");
    else await Execute(connection, "INSERT INTO sm_history(song,revision,content,deleted,operation,command_id) VALUES($1,$2,$3::jsonb,false,'legacy-source',$4)", ct, songId, sourceRevision, source.GetRawText(), commandId).ConfigureAwait(false);
    await Execute(connection, "INSERT INTO sm_migrations(song,from_revision,to_revision,mapping) VALUES($1,$2,$3,$4::jsonb)", ct, songId, sourceRevision, revision, mapping.GetRawText()).ConfigureAwait(false);
  }
}
