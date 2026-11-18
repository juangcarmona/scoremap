using System.Text.Json;
using JuanGCarmona.ScoreMap.Modules.Library.Domain;
using Xunit;

namespace JuanGCarmona.ScoreMap.Tests;

public sealed class VoicingPresetTests
{
  [Fact]
  public void CompleteExactPresetRetainsContentWithoutInferringPerformedOctaves()
  {
    using var json = JsonDocument.Parse("""
      {"id":"preset","name":"Open seventh","harmony":{"root":"C","quality":"major-seventh"},"pitches":[{"spelling":"C","octave":2,"midi":36},{"spelling":"G","octave":2,"midi":43},{"spelling":"E","octave":4,"midi":64},{"spelling":"B","octave":4,"midi":71}],"custom":false}
      """);
    Assert.True(JsonElement.DeepEquals(json.RootElement, new VoicingPresetDocument(json.RootElement).Value));
  }
  [Theory]
  [InlineData(false)]
  [InlineData(true)]
  public void NonChordPresetPitchesRequireExplicitCustomReconciliation(bool custom)
  {
    var value = JsonSerializer.SerializeToElement(new { id = "preset", name = "Custom", harmony = new { root = "C", quality = "major" }, pitches = new[] { new { spelling = "F#", octave = 4, midi = 66 } }, custom });
    if (custom) Assert.True(JsonElement.DeepEquals(value, new VoicingPresetDocument(value).Value));
    else Assert.Throws<ArgumentException>(() => new VoicingPresetDocument(value));
  }
  [Fact]
  public void AbsolutePitchBoundsAllowConsistentEnharmonicWrittenOctave()
  {
    var value = JsonSerializer.SerializeToElement(new { id = "preset", name = "Lowest absolute pitch", harmony = new { root = "C", quality = "major" }, pitches = new[] { new { spelling = "B#", octave = -2, midi = 0 } }, custom = false });
    Assert.True(JsonElement.DeepEquals(value, new VoicingPresetDocument(value).Value));
  }
}
