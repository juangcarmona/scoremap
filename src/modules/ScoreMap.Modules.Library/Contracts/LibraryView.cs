using System.Text.Json;

namespace JuanGCarmona.ScoreMap.Modules.Library.Contracts;

public sealed record LibraryView(JsonElement Library, IReadOnlyDictionary<string, long> Versions, IReadOnlyDictionary<string, string> Capabilities);
