using System.Text.Json;

namespace JuanGCarmona.ScoreMap.Modules.Library.Contracts;

public sealed record RestoreRequest(long ExpectedRevision, Guid CommandId, string Mode, bool Confirmed = false, long? Revision = null, string? Confirmation = null);
