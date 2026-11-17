using System.Text.Json;
using System.Text.Json.Nodes;
using JuanGCarmona.ScoreMap.Modules.Library.Domain;
using Xunit;

namespace JuanGCarmona.ScoreMap.Tests;

public sealed class ScoreContractTests
{
  private static JsonElement Fixture(string name) => JsonDocument.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "fixtures", name + ".json"))).RootElement.Clone();
  [Fact]
  public void LegacyImportMatchesIndependentlyCalculatedCompleteMappingAndIsIdempotent()
  {
    var source = new LibraryDocument(Fixture("library-v1"));
    var (migrated, sources) = ScoreMigration.Import(source, new Dictionary<string, JsonElement>(StringComparer.Ordinal));
    Assert.True(JsonElement.DeepEquals(Fixture("library-v1-migrated"), migrated.Value));
    Assert.True(JsonElement.DeepEquals(source.Songs[0], sources["song"]));
    var (again, repeatedSources) = ScoreMigration.Import(migrated, new Dictionary<string, JsonElement>(StringComparer.Ordinal));
    Assert.True(JsonElement.DeepEquals(migrated.Value, again.Value));
    Assert.Empty(repeatedSources);
  }
  [Fact]
  public void MigrationActivationRefusesPartialMappingOrSimultaneousMusicalRewrites()
  {
    var source = Fixture("library-v1").GetProperty("songs")[0];
    var valid = Fixture("library-v1-migrated").GetProperty("songs")[0];
    ScoreMigration.ValidateActivation(source, valid);
    var changed = JsonNode.Parse(valid.GetRawText())!;
    changed["notes"] = "Unexpected rewrite";
    Assert.Throws<ArgumentException>(() => ScoreMigration.ValidateActivation(source, JsonSerializer.SerializeToElement(changed)));
    changed = JsonNode.Parse(valid.GetRawText())!;
    changed["migration"]!["identities"]!.AsObject().Remove("part");
    Assert.Throws<ArgumentException>(() => ScoreMigration.ValidateActivation(source, JsonSerializer.SerializeToElement(changed)));
  }
  [Fact]
  public void RichArrangementPreservesIndependentPartsAbsolutePitchesAndCopiedProvenance()
  {
    var fixture = Fixture("library-v2");
    Assert.True(JsonElement.DeepEquals(fixture, new LibraryDocument(fixture).Value));
    var song = fixture.GetProperty("songs")[0];
    Assert.Equal(2, song.GetProperty("arrangements").GetArrayLength());
    Assert.Equal(71, song.GetProperty("arrangements")[0].GetProperty("parts")[1].GetProperty("events")[1].GetProperty("pitch").GetProperty("midi").GetInt32());
  }
  [Theory]
  [InlineData("pitch")]
  [InlineData("spelling")]
  [InlineData("root")]
  [InlineData("range")]
  [InlineData("reference")]
  [InlineData("duration")]
  [InlineData("overlap")]
  [InlineData("meter")]
  public void MalformedRichContentIsRefused(string kind)
  {
    var node = JsonNode.Parse(Fixture("library-v2").GetRawText())!;
    var song = node["songs"]![0]!; var section = song["sections"]![0]!; var arrangement = song["arrangements"]![0]!;
    switch (kind)
    {
      case "pitch": arrangement["parts"]![0]!["events"]![0]!["pitch"]!["midi"] = 128; break;
      case "spelling": arrangement["parts"]![0]!["events"]![0]!["pitch"]!["spelling"] = "C\n"; break;
      case "root": section["chords"]![0]!["root"] = "C\n"; break;
      case "range": arrangement["bindings"]![0]!["range"] = new JsonArray(50, 60); break;
      case "reference": arrangement["bindings"]![1]!["eventIds"] = new JsonArray("c2"); break;
      case "duration": section["chords"]![0]!["duration"]!["n"] = 0; break;
      case "overlap": section["chords"]![1]!["start"] = new JsonObject { ["n"] = 1, ["d"] = 2 }; break;
      case "meter": section["measures"]![0]!["meter"]!["denominator"] = 3; break;
    }
    Assert.Throws<ArgumentException>(() => new LibraryDocument(JsonSerializer.SerializeToElement(node)));
  }
}
