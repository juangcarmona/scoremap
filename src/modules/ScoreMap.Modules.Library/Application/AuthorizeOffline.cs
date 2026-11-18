using JuanGCarmona.ScoreMap.Modules.Library.Contracts;

namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed record AuthorizeOffline(string Principal, string SessionId, DateTimeOffset AuthorizationExpiresAt, int ConfiguredMinutes, OfflineLeaseRequest Request);
