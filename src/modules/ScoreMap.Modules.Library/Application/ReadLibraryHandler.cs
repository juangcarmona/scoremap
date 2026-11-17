using JuanGCarmona.Lighthouse.Cqrs;
using JuanGCarmona.ScoreMap.Modules.Library.Contracts;
using JuanGCarmona.ScoreMap.Modules.Library.Domain;

namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed class ReadLibraryHandler(ILibraryRepository repository) : IQueryHandler<ReadLibrary, LibraryView>
{
  public Task<LibraryView> Handle(ReadLibrary query, CancellationToken cancellationToken) => repository.Read(query.Principal, cancellationToken);
}
