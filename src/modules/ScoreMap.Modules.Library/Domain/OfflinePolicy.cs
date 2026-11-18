namespace JuanGCarmona.ScoreMap.Modules.Library.Domain;

internal static class OfflinePolicy
{
  internal static DateTimeOffset Expiry(DateTimeOffset checkedAt, DateTimeOffset authorizationExpiresAt, int configuredMinutes)
  {
    LibraryDocument.Require(configuredMinutes is >= 1 and <= 480, "Private offline access is disabled or its configured duration exceeds eight hours.");
    LibraryDocument.Require(authorizationExpiresAt > checkedAt, "Current authorization has expired. Check online again.");
    var configuredExpiry = checkedAt.AddMinutes(configuredMinutes);
    return authorizationExpiresAt < configuredExpiry ? authorizationExpiresAt : configuredExpiry;
  }
}
