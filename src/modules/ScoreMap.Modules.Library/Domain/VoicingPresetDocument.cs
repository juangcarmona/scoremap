using System.Text.Json;

namespace JuanGCarmona.ScoreMap.Modules.Library.Domain;

internal sealed class VoicingPresetDocument
{
  internal JsonElement Value { get; }
  internal VoicingPresetDocument(JsonElement value)
  {
    LibraryDocument.Object(value, ["id", "name", "harmony", "pitches", "custom"]);
    LibraryDocument.Name(value.GetProperty("id")); LibraryDocument.Name(value.GetProperty("name"));
    var harmony = value.GetProperty("harmony"); LibraryDocument.Object(harmony, ["root", "quality"], ["alterations", "bass"]);
    var allowed = LibraryDocument.HarmonyPitches(harmony); var custom = value.GetProperty("custom");
    LibraryDocument.Require(custom.ValueKind is JsonValueKind.True or JsonValueKind.False, "Declare custom voicing explicitly.");
    foreach (var pitch in value.GetProperty("pitches").EnumerateArray())
    {
      LibraryDocument.Pitch(pitch);
      LibraryDocument.Require(custom.GetBoolean() || allowed.Contains(pitch.GetProperty("midi").GetInt32() % 12), "Non-chord preset pitches need explicit custom reconciliation.");
    }
    Value = value.Clone();
  }
}
