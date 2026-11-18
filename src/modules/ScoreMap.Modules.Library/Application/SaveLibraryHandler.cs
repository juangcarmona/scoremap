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
    if (command.Request.Source is { } source)
    {
      LibraryDocument.Require(command.Request.Import, "Source provenance is only valid for a confirmed import.");
      LibraryDocument.Require(source.Kind is "backup" or "anonymous" && source.SchemaVersion is 1 or 2 && source.Revision is >= 0 and <= 9007199254740991 && source.SongCount >= 0 && source.RepertoireCount >= 0, "The declared import source is unsupported. Keep the original source unchanged.");
    }
    var document = new LibraryDocument(command.Request.Library);
    return repository.Commit(command.Principal, document, command.Request, cancellationToken);
  }
}
