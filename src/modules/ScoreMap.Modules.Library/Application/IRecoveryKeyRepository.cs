namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal interface IRecoveryKeyRepository
{
  Task<object> Create(string principal, CancellationToken cancellationToken);
  Task<object> Unlock(string principal, Guid id, CancellationToken cancellationToken);
  Task Delete(string principal, Guid id, CancellationToken cancellationToken);
}
