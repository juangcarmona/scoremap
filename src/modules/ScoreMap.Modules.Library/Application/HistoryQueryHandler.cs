using System.Text.Json;
using JuanGCarmona.Lighthouse.Cqrs;
namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed class HistoryQueryHandler(ILibraryRepository repository) : IQueryHandler<HistoryQuery, JsonElement>
{
  public Task<JsonElement> Handle(HistoryQuery query, CancellationToken cancellationToken) => query.SongId is null ? repository.Trash(query.Principal, cancellationToken) : repository.History(query.Principal, query.SongId, cancellationToken);
}
