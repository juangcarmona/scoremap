using JuanGCarmona.ScoreMap.Modules.Library.Contracts;
namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed record GrantSong(string Principal, string SongId, GrantRequest Request);
