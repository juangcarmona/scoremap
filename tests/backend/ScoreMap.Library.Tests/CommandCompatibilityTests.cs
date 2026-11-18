using System.Text.Json;
using JuanGCarmona.ScoreMap.Modules.Library.Contracts;
using Xunit;

namespace JuanGCarmona.ScoreMap.Tests;

public sealed class CommandCompatibilityTests
{
  [Fact]
  public void OptionalImportProvenancePreservesTheOriginalReceiptHashInput()
  {
    // Frozen e0e30cf wire-to-hash shape. Omitting Source is essential: writing
    // a new null property would reject already committed legacy command receipts.
    using var library = JsonDocument.Parse("{\"schemaVersion\":1,\"revision\":0,\"songs\":[],\"repertoires\":[]}");
    var command = new CommitLibrary(library.RootElement.Clone(), 12, new Dictionary<string, long>(StringComparer.Ordinal) { ["song"] = 7 }, Guid.Parse("11111111-2222-4333-8444-555555555555"), "edit");
    const string original = """
      {"Library":{"schemaVersion":1,"revision":0,"songs":[],"repertoires":[]},"ExpectedRevision":12,"Versions":{"song":7},"CommandId":"11111111-2222-4333-8444-555555555555","Mode":"edit","Import":false,"RecoveryKeyId":null}
      """;
    Assert.Equal(original, JsonSerializer.Serialize(command));
    var withSource = command with { Import = true, Source = new ImportSource("backup", 1, 91, 0, 0, false) };
    Assert.NotEqual(JsonSerializer.Serialize(command), JsonSerializer.Serialize(withSource));
    var restored = JsonSerializer.Deserialize<CommitLibrary>(JsonSerializer.Serialize(withSource))!;
    Assert.Equal(withSource.Source, restored.Source);
    Assert.True(JsonElement.DeepEquals(withSource.Library, restored.Library));
    Assert.Equal(withSource.Versions, restored.Versions);
  }
}
