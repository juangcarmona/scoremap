using System.Text.Json;
using JuanGCarmona.Lighthouse.Cqrs;

namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed class PresetQueryHandler(ILibraryRepository repository) : IQueryHandler<PresetQuery, JsonElement>
{
  public Task<JsonElement> Handle(PresetQuery query, CancellationToken cancellationToken) => repository.ReadPresets(query.Principal, cancellationToken);
}
