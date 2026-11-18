using System.Security.Cryptography;
using System.Text.Json;
using JuanGCarmona.ScoreMap.Modules.Library.Application;
using JuanGCarmona.ScoreMap.Modules.Library.Contracts;
using JuanGCarmona.ScoreMap.Modules.Library.Domain;
using Microsoft.AspNetCore.DataProtection;
using Npgsql;

namespace JuanGCarmona.ScoreMap.Modules.Library.Infrastructure;

internal sealed partial class LibraryRepository
{
  private static readonly JsonSerializerOptions OfflineJsonOptions = new(JsonSerializerDefaults.Web);
  public async Task<JsonElement> AuthorizeOffline(AuthorizeOffline command, CancellationToken cancellationToken)
  {
    var connection = await dataSource.OpenConnectionAsync(cancellationToken).ConfigureAwait(false);
    await using var disposal = connection.ConfigureAwait(false);
    var transaction = await connection.BeginTransactionAsync(cancellationToken).ConfigureAwait(false);
    await using var transactionDisposal = transaction.ConfigureAwait(false);
    await Lock(connection, cancellationToken).ConfigureAwait(false);
    var current = await ReadView(connection, command.Principal, cancellationToken).ConfigureAwait(false);
    var selected = command.Request.SongIds.ToHashSet(StringComparer.Ordinal);
    if (selected.Any(id => !current.Capabilities.ContainsKey(id))) throw new AccessDeniedException("The requested offline song scope is unavailable.");
    var view = ScopedOfflineView(current, selected);
    var checkedAt = new DateTimeOffset((DateTime)(await Scalar(connection, "SELECT clock_timestamp()", cancellationToken).ConfigureAwait(false))!);
    var expiresAt = OfflinePolicy.Expiry(checkedAt, command.AuthorizationExpiresAt, command.ConfiguredMinutes);
    var scope = new { songs = view.Capabilities, personal = true, repertoires = true, createSongs = true };
    var musicKey = await OfflineKey(connection, command.Principal, selected.ToArray(), false, cancellationToken).ConfigureAwait(false);
    var personalKey = await OfflineKey(connection, command.Principal, [], true, cancellationToken).ConfigureAwait(false);
    var id = Guid.NewGuid();
    await Execute(connection, "INSERT INTO sm_offline_leases(id,principal,session_id,checked_at,expires_at,authorization_expires_at,configured_minutes,scope,music_key,personal_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10)", cancellationToken, id, command.Principal, command.SessionId, checkedAt, expiresAt, command.AuthorizationExpiresAt, command.ConfiguredMinutes, JsonSerializer.Serialize(scope), musicKey.GetProperty("id").GetGuid(), personalKey.GetProperty("id").GetGuid()).ConfigureAwait(false);
    var notation = await Notation(connection, command.Principal, cancellationToken).ConfigureAwait(false);
    var presets = (string)(await Scalar(connection, "SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'revision',revision,'preset',content) ORDER BY id),'[]'::jsonb)::text FROM sm_voicing_presets WHERE principal=$1 AND NOT deleted", cancellationToken, command.Principal).ConfigureAwait(false))!;
    var devices = (string)(await Scalar(connection, "SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'revision',revision,'configuration',content) ORDER BY id),'[]'::jsonb)::text FROM sm_device_configurations WHERE principal=$1 AND NOT deleted", cancellationToken, command.Principal).ConfigureAwait(false))!;
    using var presetsDocument = JsonDocument.Parse(presets);
    using var devicesDocument = JsonDocument.Parse(devices);
    var response = JsonSerializer.SerializeToElement(new { id, principal = command.Principal, sessionId = command.SessionId, checkedAt, expiresAt, authorizationExpiresAt = command.AuthorizationExpiresAt, configuredMinutes = command.ConfiguredMinutes, scope, view, personal = new { notation, presets = presetsDocument.RootElement, deviceConfigurations = devicesDocument.RootElement }, keys = new { songs = musicKey, personal = personalKey } }, OfflineJsonOptions);
    await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
    return response;
  }
  private static LibraryView ScopedOfflineView(LibraryView current, HashSet<string> selected)
  {
    var songs = current.Library.GetProperty("songs").EnumerateArray().Where(song => selected.Contains(song.GetProperty("id").GetString()!)).ToArray();
    var repertoires = current.Library.GetProperty("repertoires").EnumerateArray().Select(repertoire => new { id = repertoire.GetProperty("id").GetString(), title = repertoire.GetProperty("title").GetString(), songIds = repertoire.GetProperty("songIds").EnumerateArray().Select(value => value.GetString()!).Where(selected.Contains).ToArray() }).ToArray();
    var library = JsonSerializer.SerializeToElement(new { schemaVersion = current.Library.GetProperty("schemaVersion").GetInt32(), revision = current.Library.GetProperty("revision").GetInt64(), songs, repertoires });
    return new LibraryView(library, current.Versions.Where(pair => selected.Contains(pair.Key)).ToDictionary(pair => pair.Key, pair => pair.Value, StringComparer.Ordinal), current.Capabilities.Where(pair => selected.Contains(pair.Key)).ToDictionary(pair => pair.Key, pair => pair.Value, StringComparer.Ordinal));
  }
  private async Task<JsonElement> OfflineKey(NpgsqlConnection connection, string principal, string[] resources, bool personal, CancellationToken cancellationToken)
  {
    var id = Guid.NewGuid(); var key = RandomNumberGenerator.GetBytes(32);
    var purpose = personal ? "personal" : "song";
    var protector = protection.CreateProtector(personal ? "ScoreMap.PersonalPending.v1" : "ScoreMap.Pending.v1", principal);
    await Execute(connection, "INSERT INTO sm_recovery_keys(id,principal,resources,protected_key,purpose) VALUES($1,$2,$3,$4,$5)", cancellationToken, id, principal, resources, protector.Protect(key), purpose).ConfigureAwait(false);
    return JsonSerializer.SerializeToElement(new { id, key = Convert.ToBase64String(key) });
  }
}
