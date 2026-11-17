using JuanGCarmona.Lighthouse.Cqrs;
using JuanGCarmona.ScoreMap.Modules.Library.Contracts;
using JuanGCarmona.ScoreMap.Modules.Library.Domain;

namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal interface ILibraryRepository
{
  Task<System.Text.Json.JsonElement> ReadDeviceConfigurations(string principal, CancellationToken cancellationToken);
  Task<System.Text.Json.JsonElement> MutateDeviceConfiguration(string principal, DeviceConfigurationRequest request, CancellationToken cancellationToken);
  Task<System.Text.Json.JsonElement> ReadPresets(string principal, CancellationToken cancellationToken);
  Task<System.Text.Json.JsonElement> MutatePreset(string principal, PresetRequest request, CancellationToken cancellationToken);
  Task<NotationSettings> ReadNotation(string principal, CancellationToken cancellationToken);
  Task<NotationSettings> SaveNotation(string principal, NotationRequest request, CancellationToken cancellationToken);
  Task<System.Text.Json.JsonElement> Trash(string principal, CancellationToken cancellationToken);
  Task<System.Text.Json.JsonElement> History(string principal, string song, CancellationToken cancellationToken);
  Task<RecoveryAcknowledgement> Recover(string principal, string song, string operation, RestoreRequest request, CancellationToken cancellationToken);
  Task Grant(string owner, string song, GrantRequest request, CancellationToken cancellationToken);
  Task<LibraryView> Read(string principal, CancellationToken cancellationToken);
  Task<LibraryView> Commit(string principal, LibraryDocument document, CommitLibrary request, CancellationToken cancellationToken);
}
