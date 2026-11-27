package scoremap.library

/** Ordered sets and their recoverable deletion, restore and purge; membership only ever names active songs. */
public object SetCommands {
    public fun createSet(
        library: Library,
        mode: Mode,
        rawName: String,
        ids: IdSource,
    ): Outcome<Library> =
        guarded(mode) {
            val name = rawName.trim().takeIf { it.isNotEmpty() } ?: return@guarded refused(Refusal.INVALID_NAME)
            val id = ids.next()
            if (id in library.purged) return@guarded refused(Refusal.PURGED)
            if (library.identityInUse(id)) return@guarded refused(Refusal.DUPLICATE_ID)
            accepted(library.copy(sets = library.sets + MusicSet(SetId(id), name, emptyList())))
        }

    public fun setMembers(
        library: Library,
        mode: Mode,
        setId: SetId,
        expectedRevision: Long,
        songIds: List<SongId>,
    ): Outcome<Library> =
        guarded(mode) {
            val set = library.sets.firstOrNull { it.id == setId } ?: return@guarded refused(Refusal.UNKNOWN_SET)
            if (set.revision != expectedRevision) return@guarded refused(Refusal.STALE_REVISION)
            if (songIds.toSet().size != songIds.size) return@guarded refused(Refusal.DUPLICATE_MEMBER)
            val active = library.songs.map { it.id }.toSet()
            if (!active.containsAll(songIds)) return@guarded refused(Refusal.UNKNOWN_SONG)
            accepted(updateSet(library, set.copy(songIds = songIds, revision = set.revision + 1)))
        }

    public fun deleteSet(
        library: Library,
        mode: Mode,
        setId: SetId,
        expectedRevision: Long,
    ): Outcome<Library> =
        guarded(mode) {
            val set = library.sets.firstOrNull { it.id == setId } ?: return@guarded refused(Refusal.UNKNOWN_SET)
            if (set.revision != expectedRevision) return@guarded refused(Refusal.STALE_REVISION)
            accepted(library.copy(sets = library.sets - set, deletedSets = library.deletedSets + set))
        }

    /** A set returns with its retained order only when every referenced song is active again. */
    public fun restoreSet(
        library: Library,
        mode: Mode,
        setId: SetId,
        expectedRevision: Long,
        confirmation: Confirmation,
    ): Outcome<Library> =
        guarded(mode) {
            val set = deletedSet(library, setId) ?: return@guarded refused(missingSet(library, setId))
            refusalFor(confirmation, needsName = null)?.let { return@guarded refused(it) }
            if (set.revision != expectedRevision) return@guarded refused(Refusal.STALE_REVISION)
            if (!library.songs.map { it.id }.toSet().containsAll(
                    set.songIds,
                )
            ) {
                return@guarded refused(Refusal.MISSING_DEPENDENCY)
            }
            accepted(
                library.copy(
                    deletedSets = library.deletedSets - set,
                    sets = library.sets + set.copy(revision = set.revision + 1),
                ),
            )
        }

    public fun purgeSet(
        library: Library,
        mode: Mode,
        setId: SetId,
        expectedRevision: Long,
        confirmation: Confirmation,
    ): Outcome<Library> =
        guarded(mode) {
            val set = deletedSet(library, setId) ?: return@guarded refused(missingSet(library, setId))
            refusalFor(confirmation, needsName = set.name)?.let { return@guarded refused(it) }
            if (set.revision != expectedRevision) return@guarded refused(Refusal.STALE_REVISION)
            accepted(library.copy(deletedSets = library.deletedSets - set, purged = library.purged + setId.value))
        }

    private fun deletedSet(
        library: Library,
        id: SetId,
    ): MusicSet? = library.deletedSets.firstOrNull { it.id == id }

    private fun missingSet(
        library: Library,
        id: SetId,
    ): Refusal =
        when {
            id.value in library.purged -> Refusal.PURGED
            library.sets.any { it.id == id } -> Refusal.NOT_DELETED
            else -> Refusal.UNKNOWN_SET
        }

    private fun updateSet(
        library: Library,
        set: MusicSet,
    ): Library = library.copy(sets = library.sets.map { if (it.id == set.id) set else it })
}
