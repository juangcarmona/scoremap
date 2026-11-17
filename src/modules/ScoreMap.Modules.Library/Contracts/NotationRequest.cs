namespace JuanGCarmona.ScoreMap.Modules.Library.Contracts;

public sealed record NotationRequest(long ExpectedRevision, Guid CommandId, string Mode, string Primary);
