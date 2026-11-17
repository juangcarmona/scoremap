using System.Globalization;
using System.Runtime.InteropServices;
using System.Numerics;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace JuanGCarmona.ScoreMap.Modules.Library.Domain;

internal sealed partial class LibraryDocument
{
  internal static bool IsRichSong(JsonElement song) => song.TryGetProperty("schemaVersion", out var version) && version.ValueKind == JsonValueKind.Number && version.TryGetInt32(out var number) && number == 2;
  [StructLayout(LayoutKind.Auto)]
  private readonly record struct Ratio(BigInteger N, BigInteger D);
  private static Ratio Fraction(JsonElement value)
  {
    Object(value, ["n", "d"]); var n = Integer(value.GetProperty("n")); var d = Integer(value.GetProperty("d")); Require(d > 0, "A musical fraction needs a positive denominator."); return new Ratio(n, d);
  }
  private static long Integer(JsonElement value) { Require(value.TryGetInt64(out var number) && number is >= -9007199254740991 and <= 9007199254740991, "Expected an exact supported integer."); return number; }
  private static int Compare(Ratio left, Ratio right) => (left.N * right.D).CompareTo(right.N * left.D);
  private static Ratio Add(Ratio left, Ratio right) => new(left.N * right.D + right.N * left.D, left.D * right.D);
  private static void EventTime(JsonElement value, JsonElement measure)
  {
    var start = Fraction(value.GetProperty("start")); var duration = Fraction(value.GetProperty("duration")); var length = Fraction(measure.GetProperty("length"));
    Require(start.N >= 0 && duration.N > 0 && Compare(start, length) < 0 && Compare(Add(start, duration), length) <= 0, "Musical events must have a positive duration wholly within their measure.");
  }
  private static void Measure(JsonElement value, Action<JsonElement> identity)
  {
    Object(value, ["id", "meter", "length"]); identity(value.GetProperty("id")); var meter = value.GetProperty("meter"); Object(meter, ["numerator", "denominator"]);
    Require(Integer(meter.GetProperty("numerator")) > 0, "Meter needs a positive numerator."); var denominator = Integer(meter.GetProperty("denominator")); Require(denominator > 0 && (denominator & (denominator - 1)) == 0, "Meter denominator must be a power of two.");
    Require(Fraction(value.GetProperty("length")).N > 0, "A measure needs positive exact length.");
  }
  internal static HashSet<int> HarmonyPitches(JsonElement value)
  {
    var root = Text(value.GetProperty("root")); var quality = Text(value.GetProperty("quality")); Require(RootPattern().IsMatch(root) && ChordCatalogue.Qualities.ContainsKey(quality), "Unsupported harmony or root spelling.");
    var degrees = ChordCatalogue.Qualities[quality].Degrees.ToList(); var altered = new HashSet<string>(StringComparer.Ordinal);
    if (value.TryGetProperty("alterations", out var alterations)) foreach (var item in alterations.EnumerateArray())
      {
        var alteration = Text(item); Require(quality.StartsWith("dominant-", StringComparison.Ordinal) && alteration is "b5" or "#5" or "b9" or "#9" or "#11" or "b13", "Unsupported quality/alteration combination.");
        var degree = alteration[1..]; Require(altered.Add(degree), "Only one alteration per degree is supported."); degrees.RemoveAll(d => string.Equals(d.TrimStart('b', '#'), degree, StringComparison.Ordinal)); degrees.Add(alteration);
      }
    var rootPitch = SpellingPitch(root); var pitches = new HashSet<int>(degrees.Select(degree => ((rootPitch + DegreePitch(degree)) % 12 + 12) % 12));
    if (value.TryGetProperty("bass", out var bass)) { var spelling = Text(bass); Require(RootPattern().IsMatch(spelling), "Unsupported explicit bass spelling."); pitches.Add((SpellingPitch(spelling) % 12 + 12) % 12); }
    return pitches;
  }
  private static int DegreePitch(string degree)
  {
    var number = int.Parse(degree.TrimStart('b', '#'), CultureInfo.InvariantCulture); var natural = number switch { 1 => 0, 2 => 2, 3 => 4, 4 => 5, 5 => 7, 6 => 9, 7 => 11, 9 => 14, 11 => 17, 13 => 21, _ => throw new ArgumentException("Unsupported catalogue degree.", nameof(degree)) };
    return natural + (degree.StartsWith("bb", StringComparison.Ordinal) ? -2 : degree.StartsWith('b') ? -1 : degree.StartsWith('#') ? 1 : 0);
  }
  private static int SpellingPitch(string spelling)
  {
    var match = PitchSpelling().Match(spelling); Require(match.Success, "Invalid spelled pitch."); var natural = spelling[0] switch { 'C' => 0, 'D' => 2, 'E' => 4, 'F' => 5, 'G' => 7, 'A' => 9, 'B' => 11, _ => throw new ArgumentException("Invalid spelled note.", nameof(spelling)) };
    var accidental = match.Groups["accidental"].Value; return natural + (accidental.StartsWith('b') ? -accidental.Length : accidental.Length);
  }
  internal static void Pitch(JsonElement pitch)
  {
    Object(pitch, ["spelling", "octave", "midi"]); var octave = Integer(pitch.GetProperty("octave")); var midi = Integer(pitch.GetProperty("midi")); Require(midi is >= 0 and <= 127, "Performed pitch is outside C-1 through G9."); Require(12 * (new BigInteger(octave) + 1) + SpellingPitch(Text(pitch.GetProperty("spelling"))) == midi, "Performed spelling, octave and absolute pitch must agree.");
  }
  private static void HarmonicEvent(JsonElement value, Dictionary<string, JsonElement> measures, Action<JsonElement> identity)
  {
    Object(value, ["id", "measureId", "start", "duration", "root", "quality"], ["alterations", "bass"]); identity(value.GetProperty("id")); Require(measures.TryGetValue(Text(value.GetProperty("measureId")), out var measure), "Harmonic event refers to a missing measure in its section."); EventTime(value, measure); _ = HarmonyPitches(value);
  }
  private static void RichScore(JsonElement song, Action<JsonElement> identity)
  {
    var measures = new Dictionary<string, JsonElement>(StringComparer.Ordinal); var harmonies = new Dictionary<string, JsonElement>(StringComparer.Ordinal); var order = new List<string>();
    foreach (var section in song.GetProperty("sections").EnumerateArray())
    {
      var local = new Dictionary<string, JsonElement>(StringComparer.Ordinal);
      foreach (var measure in section.GetProperty("measures").EnumerateArray()) { Measure(measure, identity); var id = Text(measure.GetProperty("id")); measures.Add(id, measure); local.Add(id, measure); order.Add(id); }
      foreach (var harmonic in section.GetProperty("chords").EnumerateArray()) { HarmonicEvent(harmonic, local, identity); harmonies.Add(Text(harmonic.GetProperty("id")), harmonic); }
      foreach (var id in local.Keys)
      {
        var events = section.GetProperty("chords").EnumerateArray().Where(e => string.Equals(Text(e.GetProperty("measureId")), id, StringComparison.Ordinal)).OrderBy(e => Fraction(e.GetProperty("start")), Comparer<Ratio>.Create(Compare)).ToArray();
        for (var i = 1; i < events.Length; i++) Require(Compare(Add(Fraction(events[i - 1].GetProperty("start")), Fraction(events[i - 1].GetProperty("duration"))), Fraction(events[i].GetProperty("start"))) <= 0, "Harmonic events cannot overlap within one measure.");
      }
    }
    foreach (var arrangement in song.GetProperty("arrangements").EnumerateArray()) Arrangement(arrangement, measures, harmonies, order, identity);
    if (song.TryGetProperty("migration", out var migration)) Migration(migration);
  }
  private static void Migration(JsonElement value)
  {
    Object(value, ["sourceVersion", "identities"]); Require(value.GetProperty("sourceVersion").GetInt32() == 1, "Unsupported migration provenance."); var mapping = value.GetProperty("identities"); Require(mapping.ValueKind == JsonValueKind.Object, "Expected explicit migration identities.");
    var keys = new HashSet<string>(StringComparer.Ordinal); var values = new HashSet<string>(StringComparer.Ordinal);
    foreach (var entry in mapping.EnumerateObject()) { Require(!string.IsNullOrWhiteSpace(entry.Name) && keys.Add(entry.Name) && values.Add(Name(entry.Value)), "Migration needs unique explicit generated identities."); }
    Require(keys.Count > 0, "Missing generated migration identities.");
  }
  private static Dictionary<string, (bool Custom, HashSet<int> Pitches)> Voicings(JsonElement arrangement, Dictionary<string, JsonElement> harmonies, Action<JsonElement> identity)
  {
    var result = new Dictionary<string, (bool Custom, HashSet<int> Pitches)>(StringComparer.Ordinal);
    foreach (var voicing in arrangement.GetProperty("voicings").EnumerateArray())
    {
      Object(voicing, ["id", "name", "harmonyId", "custom"], ["sourcePreset"]); identity(voicing.GetProperty("id")); Name(voicing.GetProperty("name")); Require(harmonies.TryGetValue(Text(voicing.GetProperty("harmonyId")), out var harmony), "Voicing refers to a missing harmonic event."); var custom = voicing.GetProperty("custom"); Require(custom.ValueKind is JsonValueKind.True or JsonValueKind.False, "Declare custom voicing explicitly.");
      if (voicing.TryGetProperty("sourcePreset", out var source)) { Object(source, ["id", "revision", "name"]); Name(source.GetProperty("id")); Name(source.GetProperty("name")); Require(Integer(source.GetProperty("revision")) >= 1, "Copied preset provenance needs an acknowledged version."); }
      result.Add(Text(voicing.GetProperty("id")), (custom.GetBoolean(), HarmonyPitches(harmony)));
    }
    return result;
  }
  private static void Arrangement(JsonElement value, Dictionary<string, JsonElement> measures, Dictionary<string, JsonElement> harmonies, List<string> order, Action<JsonElement> identity)
  {
    Object(value, ["id", "name", "parts", "devices", "bindings", "voicings"]); identity(value.GetProperty("id")); Name(value.GetProperty("name")); var voicings = Voicings(value, harmonies, identity);
    var parts = new Dictionary<string, JsonElement>(StringComparer.Ordinal);
    foreach (var part in value.GetProperty("parts").EnumerateArray()) { Part(part, measures, voicings, order, identity); parts.Add(Text(part.GetProperty("id")), part); }
    var devices = new Dictionary<string, JsonElement>(StringComparer.Ordinal);
    foreach (var device in value.GetProperty("devices").EnumerateArray()) { Object(device, ["id", "name", "instrument", "range"]); identity(device.GetProperty("id")); Name(device.GetProperty("name")); Name(device.GetProperty("instrument")); _ = Range(device.GetProperty("range")); devices.Add(Text(device.GetProperty("id")), device); }
    foreach (var binding in value.GetProperty("bindings").EnumerateArray()) Binding(binding, parts, devices, identity);
  }
  private static void Part(JsonElement value, Dictionary<string, JsonElement> measures, Dictionary<string, (bool Custom, HashSet<int> Pitches)> voicings, List<string> order, Action<JsonElement> identity)
  {
    Object(value, ["id", "name", "role", "events"], ["hand"]); identity(value.GetProperty("id")); Name(value.GetProperty("name")); Text(value.GetProperty("role")); if (value.TryGetProperty("hand", out var hand)) Name(hand);
    var events = new Dictionary<string, JsonElement>(StringComparer.Ordinal);
    foreach (var note in value.GetProperty("events").EnumerateArray())
    {
      Object(note, ["id", "measureId", "start", "duration", "pitch", "voicingId"], ["tieNextId"]); identity(note.GetProperty("id")); Require(measures.TryGetValue(Text(note.GetProperty("measureId")), out var measure), "Performed event refers to a missing measure."); EventTime(note, measure); Pitch(note.GetProperty("pitch")); Require(voicings.TryGetValue(Text(note.GetProperty("voicingId")), out var voicing), "Performed event refers to another or missing arrangement voicing."); Require(voicing.Custom || voicing.Pitches.Contains((int)Integer(note.GetProperty("pitch").GetProperty("midi")) % 12), "Non-chord performed tones require explicit custom-voicing reconciliation.");
      if (note.TryGetProperty("tieNextId", out var tie)) Name(tie); events.Add(Text(note.GetProperty("id")), note);
    }
    foreach (var note in events.Values) if (note.TryGetProperty("tieNextId", out var next)) Tie(note, Text(next), events, measures, order);
  }
  private static void Tie(JsonElement current, string target, Dictionary<string, JsonElement> events, Dictionary<string, JsonElement> measures, List<string> order)
  {
    Require(events.TryGetValue(target, out var next) && !string.Equals(target, Text(current.GetProperty("id")), StringComparison.Ordinal), "Tie target must be another occurrence in the same part.");
    Require(JsonElement.DeepEquals(current.GetProperty("pitch"), next.GetProperty("pitch")), "Tied occurrences must preserve exact performed pitch.");
    var end = Add(Fraction(current.GetProperty("start")), Fraction(current.GetProperty("duration"))); var currentMeasure = Text(current.GetProperty("measureId")); var nextMeasure = Text(next.GetProperty("measureId"));
    var same = string.Equals(currentMeasure, nextMeasure, StringComparison.Ordinal) && Compare(end, Fraction(next.GetProperty("start"))) == 0;
    var following = order.IndexOf(nextMeasure) == order.IndexOf(currentMeasure) + 1 && Fraction(next.GetProperty("start")).N.IsZero && Compare(end, Fraction(measures[currentMeasure].GetProperty("length"))) == 0;
    Require(same || following, "Ties require consecutive identified occurrences.");
  }
  private static (long Lower, long Upper) Range(JsonElement value)
  {
    Require(value.ValueKind == JsonValueKind.Array && value.GetArrayLength() == 2, "Expected an inclusive physical range."); var lower = Integer(value[0]); var upper = Integer(value[1]); Require(lower >= 0 && upper <= 127 && lower <= upper, "Physical range must lie within 0..127."); return (lower, upper);
  }
  private static void Binding(JsonElement value, Dictionary<string, JsonElement> parts, Dictionary<string, JsonElement> devices, Action<JsonElement> identity)
  {
    Object(value, ["id", "partId", "deviceId", "range"], ["sound", "layer", "eventIds"]); identity(value.GetProperty("id")); Require(parts.TryGetValue(Text(value.GetProperty("partId")), out var part), "Binding must refer to its own arrangement part."); Require(devices.TryGetValue(Text(value.GetProperty("deviceId")), out var device), "Binding must refer to its own arrangement device."); var range = Range(value.GetProperty("range")); var deviceRange = Range(device.GetProperty("range")); Require(range.Lower >= deviceRange.Lower && range.Upper <= deviceRange.Upper, "Binding range exceeds its device.");
    if (value.TryGetProperty("sound", out var sound)) Text(sound); if (value.TryGetProperty("layer", out var layer)) Text(layer);
    var notes = part.GetProperty("events").EnumerateArray().ToArray();
    if (value.TryGetProperty("eventIds", out var selected))
    {
      var ids = new HashSet<string>(StringComparer.Ordinal); foreach (var id in selected.EnumerateArray()) Require(ids.Add(Text(id)) && notes.Any(note => string.Equals(Text(note.GetProperty("id")), Text(id), StringComparison.Ordinal)), "Binding refers to a duplicate, missing or other-part note."); notes = notes.Where(note => ids.Contains(Text(note.GetProperty("id")))).ToArray();
    }
    Require(notes.All(note => { var midi = Integer(note.GetProperty("pitch").GetProperty("midi")); return midi >= range.Lower && midi <= range.Upper; }), "Physical assignment excludes performed notes; reconcile before saving.");
  }
  [GeneratedRegex("^[A-G](?<accidental>(?:#+|b+)?)\\z", RegexOptions.NonBacktracking | RegexOptions.ExplicitCapture, 100)]
  private static partial Regex PitchSpelling();
}
