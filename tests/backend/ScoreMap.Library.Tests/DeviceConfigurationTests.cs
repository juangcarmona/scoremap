using System.Text.Json;
using JuanGCarmona.ScoreMap.Modules.Library.Domain;
using Xunit;

namespace JuanGCarmona.ScoreMap.Tests;

public sealed class DeviceConfigurationTests
{
  private static readonly int[] DefaultRange = [21, 108];
  [Fact]
  public void CompleteConfigurationPreservesPhysicalRangeAndInstrument()
  {
    var value = JsonSerializer.SerializeToElement(new { id = "configuration", name = "Lower manual", instrument = "keyboard", range = DefaultRange });
    Assert.True(JsonElement.DeepEquals(value, new DeviceConfigurationDocument(value).Value));
  }
  [Theory]
  [InlineData(-1, 108)]
  [InlineData(21, 128)]
  [InlineData(108, 21)]
  public void InvalidPhysicalRangeRefusesBeforeActivation(int lower, int upper)
  {
    var value = JsonSerializer.SerializeToElement(new { id = "configuration", name = "Lower manual", instrument = "keyboard", range = new[] { lower, upper } });
    Assert.Throws<ArgumentException>(() => new DeviceConfigurationDocument(value));
  }
}
