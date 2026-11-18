using JuanGCarmona.ScoreMap.Modules.Library.Domain;
using Xunit;

namespace JuanGCarmona.ScoreMap.Tests;

public sealed class OfflinePolicyTests
{
  private static readonly DateTimeOffset Anchor = new(2026, 11, 17, 10, 0, 0, TimeSpan.Zero);
  [Fact]
  public void ExpiryUsesTheEarlierConfiguredOrKnownAuthorizationBoundary()
  {
    Assert.Equal(Anchor.AddHours(8), OfflinePolicy.Expiry(Anchor, Anchor.AddHours(12), 480));
    Assert.Equal(Anchor.AddMinutes(5), OfflinePolicy.Expiry(Anchor, Anchor.AddMinutes(5), 480));
    Assert.Equal(Anchor.AddMinutes(1), OfflinePolicy.Expiry(Anchor, Anchor.AddHours(12), 1));
  }
  [Theory]
  [InlineData(-1)]
  [InlineData(0)]
  [InlineData(481)]
  public void DisabledOrOverlongConfigurationCannotCreateAuthority(int minutes) => Assert.Throws<ArgumentException>(() => OfflinePolicy.Expiry(Anchor, Anchor.AddHours(12), minutes));
  [Fact]
  public void AnExpiredAuthorizationCannotCreateAuthority() => Assert.Throws<ArgumentException>(() => OfflinePolicy.Expiry(Anchor, Anchor, 480));
}
