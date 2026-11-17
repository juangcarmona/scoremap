using System.Text.Json;

namespace JuanGCarmona.ScoreMap.Modules.Library.Domain;

internal sealed class DeviceConfigurationDocument
{
  internal JsonElement Value { get; }
  internal DeviceConfigurationDocument(JsonElement value)
  {
    LibraryDocument.Object(value, ["id", "name", "instrument", "range"]);
    LibraryDocument.Name(value.GetProperty("id"));
    LibraryDocument.Name(value.GetProperty("name"));
    LibraryDocument.Name(value.GetProperty("instrument"));
    var range = value.GetProperty("range");
    LibraryDocument.Require(range.ValueKind == JsonValueKind.Array && range.GetArrayLength() == 2, "Expected an inclusive physical range.");
    LibraryDocument.Require(range[0].TryGetInt64(out var lower), "Expected an exact physical pitch.");
    LibraryDocument.Require(range[1].TryGetInt64(out var upper), "Expected an exact physical pitch.");
    LibraryDocument.Require(lower >= 0 && upper <= 127 && lower <= upper, "Physical range must lie within 0..127.");
    Value = value.Clone();
  }
}
