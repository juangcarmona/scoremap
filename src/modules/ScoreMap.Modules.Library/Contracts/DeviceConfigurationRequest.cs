using System.Text.Json;

namespace JuanGCarmona.ScoreMap.Modules.Library.Contracts;

public sealed record DeviceConfigurationRequest(string Operation, string Id, long ExpectedRevision, Guid CommandId, string Mode, JsonElement? Content);
