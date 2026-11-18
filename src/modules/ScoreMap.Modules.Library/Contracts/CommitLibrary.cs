using System.Text.Json;
using System.Text.Json.Serialization;

namespace JuanGCarmona.ScoreMap.Modules.Library.Contracts;

public sealed record CommitLibrary(JsonElement Library, long ExpectedRevision, IReadOnlyDictionary<string, long> Versions, Guid CommandId, string Mode, bool Import = false, Guid? RecoveryKeyId = null, [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] ImportSource? Source = null);
