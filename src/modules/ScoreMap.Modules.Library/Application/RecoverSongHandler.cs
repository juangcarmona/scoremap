using JuanGCarmona.Lighthouse.Cqrs;
using JuanGCarmona.ScoreMap.Modules.Library.Contracts;
using JuanGCarmona.ScoreMap.Modules.Library.Domain;
namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed class RecoverSongHandler(ILibraryRepository repository) : ICommandHandler<RecoverSong, RecoveryAcknowledgement>
{
  public Task<RecoveryAcknowledgement> Handle(RecoverSong command, CancellationToken cancellationToken)
  {
    LibraryDocument.Require(string.Equals(command.Request.Mode, "edit", StringComparison.Ordinal), "Switch to edit mode before restoring or purging music.");
    LibraryDocument.Require(command.Request.Confirmed && command.Request.CommandId != Guid.Empty, "Explicit confirmation and a command identity are required.");
    LibraryDocument.Require(command.Operation is "restore" or "purge", "Unknown recovery operation.");
    return repository.Recover(command.Principal, command.SongId, command.Operation, command.Request, cancellationToken);
  }
}
