using JuanGCarmona.Lighthouse.Cqrs;
using JuanGCarmona.ScoreMap.Modules.Library.Contracts;
using JuanGCarmona.ScoreMap.Modules.Library.Domain;

namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal interface ILibraryRepository
{
  Task Grant(string owner, string song, GrantRequest request, CancellationToken cancellationToken);
  Task<LibraryView> Read(string principal, CancellationToken cancellationToken);
  Task<LibraryView> Commit(string principal, LibraryDocument document, CommitLibrary request, CancellationToken cancellationToken);
}
