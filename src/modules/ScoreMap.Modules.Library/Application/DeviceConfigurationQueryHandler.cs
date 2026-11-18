using System.Text.Json;
using JuanGCarmona.Lighthouse.Cqrs;

namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed class DeviceConfigurationQueryHandler(ILibraryRepository repository) : IQueryHandler<DeviceConfigurationQuery, JsonElement>
{
  public Task<JsonElement> Handle(DeviceConfigurationQuery query, CancellationToken cancellationToken) => repository.ReadDeviceConfigurations(query.Principal, cancellationToken);
}
