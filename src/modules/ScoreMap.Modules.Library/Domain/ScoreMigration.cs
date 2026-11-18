using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace JuanGCarmona.ScoreMap.Modules.Library.Domain;

internal static class ScoreMigration
{
  internal static (LibraryDocument Document, Dictionary<string, JsonElement> Sources) Import(LibraryDocument document, Dictionary<string, JsonElement> previous)
  {
    var occupied = new HashSet<string>(StringComparer.Ordinal); Collect(document.Value, occupied); var sources = new Dictionary<string, JsonElement>(StringComparer.Ordinal); var songs = new List<JsonElement>();
    foreach (var song in document.Songs)
    {
      var id = song.GetProperty("id").GetString()!;
      if (!previous.ContainsKey(id) && !LibraryDocument.IsRichSong(song)) { sources.Add(id, song); songs.Add(Migrate(song, occupied)); }
      else songs.Add(song);
    }
    return (new LibraryDocument(JsonSerializer.SerializeToElement(new { schemaVersion = songs.Any(LibraryDocument.IsRichSong) ? 2 : document.Value.GetProperty("schemaVersion").GetInt32(), revision = document.Revision, songs, repertoires = document.Value.GetProperty("repertoires") })), sources);
  }
  private static void Collect(JsonElement value, HashSet<string> occupied)
  {
    if (value.ValueKind == JsonValueKind.Array) foreach (var item in value.EnumerateArray()) Collect(item, occupied);
    else if (value.ValueKind == JsonValueKind.Object) foreach (var property in value.EnumerateObject())
      { if (property.NameEquals("id") && property.Value.ValueKind == JsonValueKind.String) occupied.Add(property.Value.GetString()!); else Collect(property.Value, occupied); }
  }
  internal static JsonElement Migrate(JsonElement song, HashSet<string> occupied)
  {
    var songId = song.GetProperty("id").GetString()!;
    string NewId(string key)
    {
      var counter = 0; string id;
      do
      {
        var source = "scoremap-v1\0" + songId.Length.ToString(CultureInfo.InvariantCulture) + ":" + songId + "\0" + key + "\0" + (counter++).ToString(CultureInfo.InvariantCulture);
        id = "sm-" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(source))).ToLowerInvariant();
      } while (!occupied.Add(id));
      return id;
    }
    return Build(song, NewId);
  }
  internal static void ValidateActivation(JsonElement source, JsonElement candidate)
  {
    LibraryDocument.Require(candidate.TryGetProperty("migration", out var migration), "Retain a complete migration map before activation.");
    var mapping = migration.GetProperty("identities");
    string Mapped(string key)
    {
      LibraryDocument.Require(mapping.TryGetProperty(key, out var id) && id.ValueKind == JsonValueKind.String, "The migration map is incomplete.");
      return id.GetString()!;
    }
    LibraryDocument.Require(JsonElement.DeepEquals(Build(source, Mapped), candidate), "Activate the exact preserved migration first; edit its music in a subsequent acknowledged revision.");
  }
  private static JsonElement Build(JsonElement song, Func<string, string> allocate)
  {
    var identities = new Dictionary<string, string>(StringComparer.Ordinal);
    string NewId(string key) { var id = allocate(key); identities.Add(key, id); return id; }
    var arrangementId = NewId("arrangement"); var partId = NewId("part"); var sections = new List<JsonElement>();
    foreach (var section in song.GetProperty("sections").EnumerateArray()) sections.Add(Section(section, NewId));
    var result = song.EnumerateObject().ToDictionary(p => p.Name, p => p.Value, StringComparer.Ordinal);
    result["schemaVersion"] = JsonSerializer.SerializeToElement(2); result["sections"] = JsonSerializer.SerializeToElement(sections);
    result["migration"] = JsonSerializer.SerializeToElement(new { sourceVersion = 1, identities });
    result["arrangements"] = JsonSerializer.SerializeToElement(new[] { new { id = arrangementId, name = "Default arrangement", parts = new[] { new { id = partId, name = "Unassigned part", role = "", events = Array.Empty<object>() } }, devices = Array.Empty<object>(), bindings = Array.Empty<object>(), voicings = Array.Empty<object>() } });
    return JsonSerializer.SerializeToElement(result);
  }
  private static JsonElement Section(JsonElement section, Func<string, string> newId)
  {
    var sectionId = section.GetProperty("id").GetString()!; var source = section.GetProperty("chords").EnumerateArray().ToArray(); var measures = new List<object>(); var measureIds = new List<string>();
    for (var i = 0; i < (source.Length + 3) / 4; i++) { var id = newId("section/" + sectionId + "/measure/" + i.ToString(CultureInfo.InvariantCulture)); measureIds.Add(id); measures.Add(new { id, meter = new { numerator = 4, denominator = 4 }, length = new { n = 4, d = 1 } }); }
    var events = new List<JsonElement>();
    for (var i = 0; i < source.Length; i++)
    {
      var harmonic = source[i].EnumerateObject().ToDictionary(p => p.Name, p => p.Value, StringComparer.Ordinal);
      harmonic["id"] = JsonSerializer.SerializeToElement(newId("section/" + sectionId + "/event/" + i.ToString(CultureInfo.InvariantCulture))); harmonic["measureId"] = JsonSerializer.SerializeToElement(measureIds[i / 4]); harmonic["start"] = JsonSerializer.SerializeToElement(new { n = i % 4, d = 1 }); harmonic["duration"] = JsonSerializer.SerializeToElement(new { n = 1, d = 1 }); events.Add(JsonSerializer.SerializeToElement(harmonic));
    }
    var result = section.EnumerateObject().ToDictionary(p => p.Name, p => p.Value, StringComparer.Ordinal); result["measures"] = JsonSerializer.SerializeToElement(measures); result["chords"] = JsonSerializer.SerializeToElement(events); return JsonSerializer.SerializeToElement(result);
  }
}
