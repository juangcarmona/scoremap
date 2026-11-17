using System.Text.Json;
using System.Diagnostics.CodeAnalysis;
using System.Text.RegularExpressions;

namespace JuanGCarmona.ScoreMap.Modules.Library.Domain;

internal sealed partial class LibraryDocument
{
  internal JsonElement Value { get; }
  internal JsonElement[] Songs => Value.GetProperty("songs").EnumerateArray().ToArray();
  internal JsonElement[] Repertoires => Value.GetProperty("repertoires").EnumerateArray().ToArray();
  internal long Revision => Value.GetProperty("revision").GetInt64();
  internal LibraryDocument(JsonElement value)
  {
    Object(value, ["schemaVersion", "revision", "songs", "repertoires"]);
    Require(value.GetProperty("schemaVersion").GetInt32() is 1 or 2, "Unsupported library version. Keep the original export.");
    Require(value.GetProperty("revision").TryGetInt64(out var revision) && revision is >= 0 and <= 9007199254740991, "Invalid revision.");
    Value = value.Clone();
    var ids = new HashSet<string>(StringComparer.Ordinal);
    void Identity(JsonElement element) { var id = Name(element); Require(ids.Add(id), "Duplicate identity."); }
    var songIds = new HashSet<string>(StringComparer.Ordinal);
    foreach (var song in Songs)
    {
      var rich = IsRichSong(song);
      Require(!rich || value.GetProperty("schemaVersion").GetInt32() == 2, "Identified arrangements need a version-2 library envelope.");
      Object(song, rich ? ["id", "title", "artist", "notes", "sections", "references", "schemaVersion", "arrangements"] : ["id", "title", "artist", "notes", "sections", "references"], rich ? ["pdf", "migration"] : ["pdf"]);
      Require(!song.TryGetProperty("pdf", out _), "PDF transfer is not yet supported; keep the original export.");
      Identity(song.GetProperty("id")); songIds.Add(song.GetProperty("id").GetString()!);
      Name(song.GetProperty("title")); Text(song.GetProperty("artist")); Text(song.GetProperty("notes"));
      Sections(song, rich, Identity);
      if (rich) RichScore(song, Identity);
      foreach (var reference in song.GetProperty("references").EnumerateArray())
      {
        Object(reference, ["id", "title", "url"]); Identity(reference.GetProperty("id")); Name(reference.GetProperty("title"));
        Require(Uri.TryCreate(Text(reference.GetProperty("url")), UriKind.Absolute, out var uri) && uri.Scheme is "http" or "https", "Only HTTP(S) references are supported.");
      }
    }
    foreach (var repertoire in Repertoires)
    {
      Object(repertoire, ["id", "title", "songIds"]); Identity(repertoire.GetProperty("id")); Name(repertoire.GetProperty("title"));
      var members = new HashSet<string>(StringComparer.Ordinal);
      foreach (var id in repertoire.GetProperty("songIds").EnumerateArray())
        Require(songIds.Contains(Text(id)) && members.Add(Text(id)), "Missing or duplicate repertoire song.");
    }
  }
  private static void Sections(JsonElement song, bool rich, Action<JsonElement> identity)
  {
    foreach (var section in song.GetProperty("sections").EnumerateArray())
    {
      Object(section, rich ? ["id", "name", "repeat", "chords", "notes", "measures"] : ["id", "name", "repeat", "chords", "notes"]);
      identity(section.GetProperty("id")); Name(section.GetProperty("name")); Text(section.GetProperty("notes"));
      Require(section.GetProperty("repeat").TryGetInt32(out var repeat) && repeat is >= 1 and <= 99, "Repeat must be between 1 and 99.");
      if (!rich) foreach (var chord in section.GetProperty("chords").EnumerateArray())
        {
          Object(chord, ["root", "quality"]);
          Require(RootPattern().IsMatch(Text(chord.GetProperty("root"))), "Invalid chord root.");
          Require(Text(chord.GetProperty("quality")) is "major" or "minor", "Unsupported chord quality.");
        }
    }
  }
  internal static void Require([DoesNotReturnIf(false)] bool condition, string detail) { if (!condition) throw new ArgumentException(detail, nameof(condition)); }
  private static string Text(JsonElement value) { Require(value.ValueKind == JsonValueKind.String, "Expected text."); return value.GetString()!; }
  private static string Name(JsonElement value) { var text = Text(value); Require(!string.IsNullOrWhiteSpace(text), "A name or identity is required."); return text; }
  private static void Object(JsonElement value, string[] required, string[]? optional = null)
  {
    Require(value.ValueKind == JsonValueKind.Object, "Expected an object.");
    var keys = value.EnumerateObject().Select(p => p.Name).ToArray();
    Require(keys.Distinct(StringComparer.Ordinal).Count() == keys.Length && required.All(k => keys.Contains(k, StringComparer.Ordinal)) && keys.All(k => required.Contains(k, StringComparer.Ordinal) || (optional?.Contains(k, StringComparer.Ordinal) ?? false)), "Missing, duplicate or unsupported fields.");
  }
  [GeneratedRegex("^[A-G][#b]?\\z", RegexOptions.NonBacktracking, 100)]
  private static partial Regex RootPattern();
}
