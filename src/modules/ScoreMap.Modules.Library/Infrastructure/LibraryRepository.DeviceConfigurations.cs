using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using JuanGCarmona.ScoreMap.Modules.Library.Application;
using JuanGCarmona.ScoreMap.Modules.Library.Contracts;
using Npgsql;

namespace JuanGCarmona.ScoreMap.Modules.Library.Infrastructure;

internal sealed partial class LibraryRepository
{
  public async Task<JsonElement> ReadDeviceConfigurations(string principal, CancellationToken cancellationToken)
  {
    var connection = await dataSource.OpenConnectionAsync(cancellationToken).ConfigureAwait(false);
    await using var disposal = connection.ConfigureAwait(false);
    var json = await Scalar(connection, "SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'revision',revision,'configuration',content) ORDER BY id),'[]'::jsonb)::text FROM sm_device_configurations WHERE principal=$1 AND NOT deleted", cancellationToken, principal).ConfigureAwait(false);
    return JsonDocument.Parse((string)json!).RootElement.Clone();
  }
  private static async Task<JsonElement?> DeviceConfiguration(NpgsqlConnection connection, string principal, string id, CancellationToken ct)
  {
    var json = await Scalar(connection, "SELECT jsonb_build_object('id',id,'revision',revision,'configuration',content)::text FROM sm_device_configurations WHERE principal=$1 AND id=$2", ct, principal, id).ConfigureAwait(false);
    return json is string text ? JsonDocument.Parse(text).RootElement.Clone() : null;
  }
  public async Task<JsonElement> MutateDeviceConfiguration(string principal, DeviceConfigurationRequest request, CancellationToken cancellationToken)
  {
    var connection = await dataSource.OpenConnectionAsync(cancellationToken).ConfigureAwait(false);
    await using var disposal = connection.ConfigureAwait(false);
    var transaction = await connection.BeginTransactionAsync(cancellationToken).ConfigureAwait(false);
    await using var transactionDisposal = transaction.ConfigureAwait(false);
    await Lock(connection, cancellationToken).ConfigureAwait(false);
    var current = await DeviceConfiguration(connection, principal, request.Id, cancellationToken).ConfigureAwait(false);
    var revision = current?.GetProperty("revision").GetInt64() ?? 0;
    var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(request))));
    var receipt = await Scalar(connection, "SELECT jsonb_build_object('hash',hash,'id',configuration,'revision',revision)::text FROM sm_device_receipts WHERE principal=$1 AND command=$2", cancellationToken, principal, request.CommandId).ConfigureAwait(false);
    if (receipt is string previous)
    {
      var retained = JsonDocument.Parse(previous).RootElement;
      if (!string.Equals(retained.GetProperty("hash").GetString(), hash, StringComparison.Ordinal) || retained.GetProperty("revision").GetInt64() != revision || current is null) throw new RevisionConflictException("The configuration command was already used or newer content exists. Load your saved configurations before continuing.");
      return current.Value;
    }
    if (revision != request.ExpectedRevision || (current is not null && current.Value.GetProperty("configuration").ValueKind == JsonValueKind.Null)) throw new RevisionConflictException("Newer or deleted configuration content exists. Keep/export your preview and load the saved version.");
    var deleted = string.Equals(request.Operation, "delete", StringComparison.Ordinal);
    await Execute(connection, "INSERT INTO sm_device_configurations(principal,id,revision,content,deleted) VALUES($1,$2,$3,CASE WHEN $4 THEN NULL ELSE $5::jsonb END,$4) ON CONFLICT(principal,id) DO UPDATE SET revision=EXCLUDED.revision,content=EXCLUDED.content,deleted=EXCLUDED.deleted", cancellationToken, principal, request.Id, revision + 1, deleted, request.Content?.GetRawText() ?? "null").ConfigureAwait(false);
    await Execute(connection, "INSERT INTO sm_device_receipts(principal,command,hash,configuration,revision) VALUES($1,$2,$3,$4,$5)", cancellationToken, principal, request.CommandId, hash, request.Id, revision + 1).ConfigureAwait(false);
    var saved = (await DeviceConfiguration(connection, principal, request.Id, cancellationToken).ConfigureAwait(false))!.Value;
    await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
    return saved;
  }
}
