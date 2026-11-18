namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed record RecoveryCommand(string Principal, string Operation, Guid KeyId, string Purpose = "song");
