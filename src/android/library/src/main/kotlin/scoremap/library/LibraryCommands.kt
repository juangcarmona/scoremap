package scoremap.library

private const val MIN_REPEATS = 1
private const val MAX_REPEATS = 99

/**
 * Every content mutation of the library. The edit-mode guard runs first, so a protected mode refuses
 * even an invalid command for the mode, and no refusal changes the library it was given.
 */
public object LibraryCommands {
    public fun createSong(
        library: Library,
        mode: Mode,
        rawName: String,
        ids: IdSource,
    ): Outcome<Library> =
        guarded(mode) {
            val name = validName(rawName) ?: return@guarded refused(Refusal.INVALID_NAME)
            val id = ids.next()
            if (id in library.purged) return@guarded refused(Refusal.PURGED)
            if (library.identityInUse(id)) return@guarded refused(Refusal.DUPLICATE_ID)
            val created = Song(SongId(id), name, emptyList())
            accepted(library.recordRevision(created).copy(songs = library.songs + created))
        }

    public fun renameSong(
        library: Library,
        mode: Mode,
        songId: SongId,
        rawName: String,
        expectedRevision: Long,
    ): Outcome<Library> =
        guarded(mode) {
            val song = library.songs.firstOrNull { it.id == songId } ?: return@guarded refused(Refusal.UNKNOWN_SONG)
            val name = validName(rawName) ?: return@guarded refused(Refusal.INVALID_NAME)
            if (song.revision != expectedRevision) return@guarded refused(Refusal.STALE_REVISION)
            accepted(library.revise(song.copy(name = name)))
        }

    public fun insertSection(
        library: Library,
        mode: Mode,
        songId: SongId,
        rawName: String,
        ids: IdSource,
    ): Outcome<Library> =
        guarded(mode) {
            val song = library.songs.firstOrNull { it.id == songId } ?: return@guarded refused(Refusal.UNKNOWN_SONG)
            val name = validName(rawName) ?: return@guarded refused(Refusal.INVALID_NAME)
            val id = ids.next()
            if (id in library.purged) return@guarded refused(Refusal.PURGED)
            if (library.identityInUse(id)) return@guarded refused(Refusal.DUPLICATE_ID)
            accepted(library.revise(song.copy(sections = song.sections + Section(SectionId(id), name, MIN_REPEATS))))
        }

    public fun setRepeats(
        library: Library,
        mode: Mode,
        songId: SongId,
        sectionId: SectionId,
        repeats: Int,
    ): Outcome<Library> =
        guarded(mode) {
            val song = library.songs.firstOrNull { it.id == songId } ?: return@guarded refused(Refusal.UNKNOWN_SONG)
            if (song.sections.none { it.id == sectionId }) return@guarded refused(Refusal.UNKNOWN_SECTION)
            if (repeats !in MIN_REPEATS..MAX_REPEATS) return@guarded refused(Refusal.INVALID_REPEATS)
            val sections = song.sections.map { if (it.id == sectionId) it.copy(repeats = repeats) else it }
            accepted(library.revise(song.copy(sections = sections)))
        }

    /** Reordering changes position only: identity, content and repeats of each section are retained. */
    public fun reorderSections(
        library: Library,
        mode: Mode,
        songId: SongId,
        order: List<SectionId>,
    ): Outcome<Library> =
        guarded(mode) {
            val song = library.songs.firstOrNull { it.id == songId } ?: return@guarded refused(Refusal.UNKNOWN_SONG)
            val current = song.sections.associateBy { it.id }
            if (order.size != current.size ||
                order.toSet() != current.keys
            ) {
                return@guarded refused(Refusal.NOT_A_PERMUTATION)
            }
            accepted(library.revise(song.copy(sections = order.map { current.getValue(it) })))
        }

    private fun guarded(
        mode: Mode,
        command: () -> Outcome<Library>,
    ): Outcome<Library> = if (mode == Mode.EDIT) command() else refused(Refusal.PERFORMANCE_MODE)

    private fun validName(raw: String): String? =
        raw.trim().takeIf {
            it.isNotEmpty() &&
                it.any { c -> !c.isWhitespace() }
        }

    private fun accepted(library: Library): Outcome<Library> = Outcome.Accepted(library)

    private fun refused(refusal: Refusal): Outcome<Library> = Outcome.Refused(refusal)
}
