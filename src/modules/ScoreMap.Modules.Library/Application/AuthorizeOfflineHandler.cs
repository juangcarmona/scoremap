using System.Text.Json;
using JuanGCarmona.Lighthouse.Cqrs;
using JuanGCarmona.ScoreMap.Modules.Library.Domain;

namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed class AuthorizeOfflineHandler(ILibraryRepository repository) : ICommandHandler<AuthorizeOffline, JsonElement>
{
  public Task<JsonElement> Handle(AuthorizeOffline command, CancellationToken cancellationToken)
  {
    LibraryDocument.Require(!string.IsNullOrWhiteSpace(command.SessionId), "A current authenticated session is required.");
    LibraryDocument.Require(command.ConfiguredMinutes is >= 1 and <= 480, "Private offline access is disabled or invalid.");
    LibraryDocument.Require(command.Request.SongIds is not null && command.Request.SongIds.All(id => !string.IsNullOrWhiteSpace(id)) && command.Request.SongIds.Distinct(StringComparer.Ordinal).Count() == command.Request.SongIds.Length, "Select complete distinct authorized song identities.");
    return repository.AuthorizeOffline(command, cancellationToken);
  }
}
