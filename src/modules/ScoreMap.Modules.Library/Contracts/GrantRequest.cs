using System.Text.Json;

namespace JuanGCarmona.ScoreMap.Modules.Library.Contracts;

public sealed record GrantRequest(string Principal, string? Role, string Mode);
