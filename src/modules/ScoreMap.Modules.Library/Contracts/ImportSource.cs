namespace JuanGCarmona.ScoreMap.Modules.Library.Contracts;

// Declared portable-source provenance; never an ownership or access credential.
public sealed record ImportSource(string Kind, int SchemaVersion, long Revision, int SongCount, int RepertoireCount, bool Copied);
