using System.Text.Json;

namespace JuanGCarmona.ScoreMap.Modules.Library.Contracts;

public sealed record CommitLibrary(JsonElement Library, long ExpectedRevision, IReadOnlyDictionary<string, long> Versions, Guid CommandId, string Mode, bool Import = false, Guid? RecoveryKeyId = null);
