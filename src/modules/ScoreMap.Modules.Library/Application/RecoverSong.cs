using JuanGCarmona.ScoreMap.Modules.Library.Contracts;
namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed record RecoverSong(string Principal, string SongId, string Operation, RestoreRequest Request);
