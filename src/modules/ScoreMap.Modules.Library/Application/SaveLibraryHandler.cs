using JuanGCarmona.Lighthouse.Cqrs;
using JuanGCarmona.ScoreMap.Modules.Library.Contracts;
using JuanGCarmona.ScoreMap.Modules.Library.Domain;

namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed class SaveLibraryHandler(ILibraryRepository repository) : ICommandHandler<SaveLibrary, LibraryView>
{
  public Task<LibraryView> Handle(SaveLibrary command, CancellationToken cancellationToken)
  {
    LibraryDocument.Require(string.Equals(command.Request.Mode, "edit", StringComparison.Ordinal), "Switch to edit mode before changing private content.");
    LibraryDocument.Require(command.Request.CommandId != Guid.Empty, "A command identity is required.");
    var document = new LibraryDocument(command.Request.Library);
    return repository.Commit(command.Principal, document, command.Request, cancellationToken);
  }
}
