using JuanGCarmona.Lighthouse.Cqrs;
using JuanGCarmona.ScoreMap.Modules.Library.Contracts;
using JuanGCarmona.ScoreMap.Modules.Library.Domain;

namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed class SaveNotationHandler(ILibraryRepository repository) : ICommandHandler<SaveNotation, NotationSettings>
{
  public Task<NotationSettings> Handle(SaveNotation command, CancellationToken cancellationToken)
  {
    var request = command.Request;
    LibraryDocument.Require(request.CommandId != Guid.Empty && request.ExpectedRevision >= 0, "A valid preference revision and command identity are required.");
    LibraryDocument.Require(request.Mode is "anglo" or "latin" or "dual" && request.Primary is "anglo" or "latin" && (string.Equals(request.Mode, "dual", StringComparison.Ordinal) || string.Equals(request.Mode, request.Primary, StringComparison.Ordinal)), "Choose a supported notation mode and primary.");
    return repository.SaveNotation(command.Principal, request, cancellationToken);
  }
}
