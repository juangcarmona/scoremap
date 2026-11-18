using System.Text.Json;
using JuanGCarmona.ScoreMap.Modules.Library.Domain;
using JuanGCarmona.ScoreMap.Modules.Library.Application;
using Xunit;

namespace JuanGCarmona.ScoreMap.Tests;

public sealed class LibraryBoundaryTests
{
  [Theory]
  [InlineData("{\"schemaVersion\":3,\"revision\":0,\"songs\":[],\"repertoires\":[]}")]
  [InlineData("{\"schemaVersion\":1,\"revision\":-1,\"songs\":[],\"repertoires\":[]}")]
  [InlineData("{\"schemaVersion\":1,\"revision\":0,\"songs\":[],\"repertoires\":[],\"owner\":\"forged\"}")]
  [InlineData("{\"schemaVersion\":1,\"schemaVersion\":1,\"revision\":0,\"songs\":[],\"repertoires\":[]}")]
  public void UntrustedLibraryRefusesUnsupportedOrAmbiguousData(string json)
  {
    using var document = JsonDocument.Parse(json);
    Assert.Throws<ArgumentException>(() => new LibraryDocument(document.RootElement));
  }
  [Fact]
  public void CompleteCurrentExportPreservesSongSectionSpellingAndMembership()
  {
    using var source = JsonDocument.Parse("""
            {"schemaVersion":1,"revision":12,"songs":[{"id":"song","title":"Synthetic","artist":"","notes":"cue","sections":[{"id":"section","name":"Verse","repeat":99,"chords":[{"root":"Db","quality":"minor"}],"notes":"held"}],"references":[]}],"repertoires":[{"id":"set","title":"Synthetic set","songIds":["song"]}]}
            """);
    var library = new LibraryDocument(source.RootElement);
    Assert.True(JsonElement.DeepEquals(source.RootElement, library.Value));
    Assert.Equal(12, library.Revision);
  }
  [Fact]
  public void ExportedModuleTypesDoNotExposeHandlersOrDomainEntities()
  {
    var assembly = typeof(JuanGCarmona.ScoreMap.Modules.Library.LibraryModule).Assembly;
    Assert.DoesNotContain(assembly.ExportedTypes, type => type.Namespace?.EndsWith(".Domain", StringComparison.Ordinal) == true || type.Name.EndsWith("Handler", StringComparison.Ordinal));
    Assert.All(assembly.GetTypes().Where(type => type.GetInterfaces().Any(i => i.IsGenericType && i.GetGenericTypeDefinition().Name is "ICommandHandler`2" or "IQueryHandler`2")), type => Assert.True(type.IsNotPublic && type.IsSealed));
  }
}
