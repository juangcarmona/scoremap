using System.Text.Json;

namespace JuanGCarmona.ScoreMap.Api;

internal static class ApplicationSettings
{
  internal static JsonDocument Read(string path)
  {
    var document = JsonDocument.Parse(File.ReadAllText(path));
    var root = document.RootElement;
    Check(root, ["SchemaVersion", "Environment", "InstanceId", "Application", "Identity", "Storage"], ["Development", "Ingress"]);
    Check(root.GetProperty("Application"), ["PublicOrigin", "WebRoot", "ProductionQualified"]);
    Check(root.GetProperty("Identity"), ["Authority", "ClientId", "ClientSecret", "DevelopmentFixture"]);
    Check(root.GetProperty("Storage"), ["ConnectionString", "KeysPath"]);
    if (root.TryGetProperty("Development", out var development)) Check(development, ["IdentityPort", "DatabasePort"], ["DatabasePassword"]);
    if (root.TryGetProperty("Ingress", out var ingress)) Check(ingress, ["TrustedProxy"]);
    if (root.GetProperty("SchemaVersion").GetInt32() != 1) throw new InvalidOperationException("Unsupported application configuration version.");
    return document;
  }
  private static void Check(JsonElement value, string[] required, string[]? optional = null)
  {
    if (value.ValueKind != JsonValueKind.Object) throw new InvalidOperationException("Application settings must contain objects.");
    var keys = value.EnumerateObject().Select(p => p.Name).ToArray();
    if (keys.Distinct(StringComparer.Ordinal).Count() != keys.Length || required.Any(k => !keys.Contains(k, StringComparer.Ordinal)) || keys.Any(k => !required.Contains(k, StringComparer.Ordinal) && !(optional?.Contains(k, StringComparer.Ordinal) ?? false)))
      throw new InvalidOperationException("Missing, duplicate or unknown application settings. See config/application.example.json.");
  }
}
