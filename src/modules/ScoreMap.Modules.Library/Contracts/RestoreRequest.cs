using System.Text.Json;

namespace JuanGCarmona.ScoreMap.Modules.Library.Contracts;

public sealed record RestoreRequest(long ExpectedRevision, Guid CommandId, string Mode);
