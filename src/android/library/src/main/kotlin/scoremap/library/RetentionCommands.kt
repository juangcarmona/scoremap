package scoremap.library

/** Retained history and recoverable song deletion, restore and purge, guarded by edit mode and revision. */
public object RetentionCommands {
    /** Reading retained history is not a mutation and creates no revision. */
    public fun history(
        library: Library,
        songId: SongId,
    ): List<SongRevision> = library.histories[songId].orEmpty()

    public fun deleteSong(
        library: Library,
        mode: Mode,
        songId: SongId,
        expectedRevision: Long,
    ): Outcome<Library> =
        guarded(mode) {
            val song = library.songs.firstOrNull { it.id == songId } ?: return@guarded refused(Refusal.UNKNOWN_SONG)
            if (song.revision != expectedRevision) return@guarded refused(Refusal.STALE_REVISION)
            val sets =
                library.sets.map { set ->
                    if (songId in set.songIds) {
                        set.copy(songIds = set.songIds - songId, revision = set.revision + 1)
                    } else {
                        set
                    }
                }
            accepted(
                library.copy(songs = library.songs - song, deletedSongs = library.deletedSongs + song, sets = sets),
            )
        }

    /** Restoring never recreates former set memberships; it retains identities and creates a new revision. */
    public fun restoreSong(
        library: Library,
        mode: Mode,
        songId: SongId,
        expectedRevision: Long,
        confirmation: Confirmation,
    ): Outcome<Library> =
        guarded(mode) {
            val song = deletedSong(library, songId) ?: return@guarded refused(missingSong(library, songId))
            refusalFor(confirmation, needsName = null)?.let { return@guarded refused(it) }
            if (song.revision != expectedRevision) return@guarded refused(Refusal.STALE_REVISION)
            val revised = song.copy(revision = song.revision + 1)
            accepted(
                library
                    .copy(deletedSongs = library.deletedSongs - song, songs = library.songs + revised)
                    .recordRevision(revised),
            )
        }

    public fun purgeSong(
        library: Library,
        mode: Mode,
        songId: SongId,
        expectedRevision: Long,
        confirmation: Confirmation,
    ): Outcome<Library> =
        guarded(mode) {
            val song = deletedSong(library, songId) ?: return@guarded refused(missingSong(library, songId))
            refusalFor(confirmation, needsName = song.name)?.let { return@guarded refused(it) }
            if (song.revision != expectedRevision) return@guarded refused(Refusal.STALE_REVISION)
            accepted(
                library.copy(
                    deletedSongs = library.deletedSongs - song,
                    purged = library.purged + songId.value,
                    histories = library.histories - songId,
                ),
            )
        }

    /** Restoring a revision creates a new one; the intervening history is preserved. */
    public fun restoreRevision(
        library: Library,
        mode: Mode,
        songId: SongId,
        number: Long,
        expectedRevision: Long,
    ): Outcome<Library> =
        guarded(mode) {
            val song = library.songs.firstOrNull { it.id == songId } ?: return@guarded refused(Refusal.UNKNOWN_SONG)
            if (song.revision != expectedRevision) return@guarded refused(Refusal.STALE_REVISION)
            val target =
                history(library, songId).firstOrNull { it.number == number }
                    ?: return@guarded refused(Refusal.UNKNOWN_REVISION)
            accepted(library.revise(song.copy(name = target.name, sections = target.sections)))
        }

    private fun deletedSong(
        library: Library,
        id: SongId,
    ): Song? = library.deletedSongs.firstOrNull { it.id == id }

    private fun missingSong(
        library: Library,
        id: SongId,
    ): Refusal =
        when {
            id.value in library.purged -> Refusal.PURGED
            library.songs.any { it.id == id } -> Refusal.NOT_DELETED
            else -> Refusal.UNKNOWN_SONG
        }
}
