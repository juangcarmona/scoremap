using JuanGCarmona.Lighthouse.Cqrs;
namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed class GrantSongHandler(ILibraryRepository repository) : ICommandHandler<GrantSong, bool>
{
  public async Task<bool> Handle(GrantSong command, CancellationToken cancellationToken)
  {
    await repository.Grant(command.Principal, command.SongId, command.Request, cancellationToken).ConfigureAwait(false);
    return true;
  }
}
