namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal interface IRecoveryKeyRepository
{
  Task<object> Create(string principal, string purpose, CancellationToken cancellationToken);
  Task<object> Unlock(string principal, Guid id, string purpose, CancellationToken cancellationToken);
  Task Delete(string principal, Guid id, string purpose, CancellationToken cancellationToken);
}
