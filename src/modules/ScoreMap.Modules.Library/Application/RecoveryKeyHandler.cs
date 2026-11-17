using JuanGCarmona.Lighthouse.Cqrs;
namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed class RecoveryKeyHandler(IRecoveryKeyRepository repository) : ICommandHandler<RecoveryCommand, object?>
{
  public async Task<object?> Handle(RecoveryCommand command, CancellationToken cancellationToken)
  {
    if (string.Equals(command.Operation, "create", StringComparison.Ordinal)) return await repository.Create(command.Principal, cancellationToken).ConfigureAwait(false);
    if (string.Equals(command.Operation, "unlock", StringComparison.Ordinal)) return await repository.Unlock(command.Principal, command.KeyId, cancellationToken).ConfigureAwait(false);
    if (!string.Equals(command.Operation, "delete", StringComparison.Ordinal)) throw new ArgumentException("Unknown recovery operation.", nameof(command));
    await repository.Delete(command.Principal, command.KeyId, cancellationToken).ConfigureAwait(false);
    return null;
  }
}
