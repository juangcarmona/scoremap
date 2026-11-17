namespace JuanGCarmona.ScoreMap.Modules.Library.Contracts;

public sealed record RecoveryAcknowledgement(Guid CommandId, string SongId, long Revision, string Retention);
