using JuanGCarmona.Lighthouse.Cqrs;
using JuanGCarmona.ScoreMap.Modules.Library.Contracts;

namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed class ReadNotationHandler(ILibraryRepository repository) : IQueryHandler<ReadNotation, NotationSettings>
{
  public Task<NotationSettings> Handle(ReadNotation query, CancellationToken cancellationToken) => repository.ReadNotation(query.Principal, cancellationToken);
}
