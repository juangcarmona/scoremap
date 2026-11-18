using System.Text.Json;
using JuanGCarmona.Lighthouse.Cqrs;
using JuanGCarmona.ScoreMap.Modules.Library.Contracts;
using JuanGCarmona.ScoreMap.Modules.Library.Domain;

namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed class PresetCommandHandler(ILibraryRepository repository) : ICommandHandler<PresetCommand, JsonElement>
{
  public Task<JsonElement> Handle(PresetCommand command, CancellationToken cancellationToken)
  {
    var request = command.Request;
    LibraryDocument.Require(string.Equals(request.Mode, "edit", StringComparison.Ordinal), "Switch to edit mode before changing reusable voicings.");
    LibraryDocument.Require(request.CommandId != Guid.Empty && request.ExpectedRevision is >= 0 and <= 9007199254740991 && !string.IsNullOrWhiteSpace(request.Id), "A current preset revision and command identity are required.");
    LibraryDocument.Require(request.Operation is "save" or "delete", "Unknown preset operation.");
    if (string.Equals(request.Operation, "save", StringComparison.Ordinal))
    {
      LibraryDocument.Require(request.Content.HasValue, "Supply the complete preset.");
      var document = new VoicingPresetDocument(request.Content.Value);
      LibraryDocument.Require(string.Equals(document.Value.GetProperty("id").GetString(), request.Id, StringComparison.Ordinal), "Keep the preset identity consistent.");
    }
    else LibraryDocument.Require(!request.Content.HasValue && request.ExpectedRevision > 0, "Delete only the current acknowledged preset after confirmation.");
    return repository.MutatePreset(command.Principal, request, cancellationToken);
  }
}
