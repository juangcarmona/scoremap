package scoremap.library

private const val MIN_REPEATS = 1
private const val MAX_REPEATS = 99

/** Imports a validated transfer graph as new local content with fresh, mutually consistent identities. */
public object ImportCommands {
    public fun importGraph(
        library: Library,
        mode: Mode,
        graph: TransferGraph,
        ids: IdSource,
    ): Outcome<Library> =
        guarded(mode) {
            validate(graph)?.let { return@guarded refused(it) }
            val fresh = mutableListOf<String>()
            val next = {
                ids.next().also { fresh += it }
            }
            val songs =
                graph.songs.map { song ->
                    Song(
                        SongId(next()),
                        song.name.trim(),
                        song.sections.map { Section(SectionId(next()), it.name.trim(), it.repeats) },
                    )
                }
            val keyToId =
                graph.songs
                    .map { it.key }
                    .zip(songs.map { it.id })
                    .toMap()
            val set =
                graph.set?.let { MusicSet(SetId(next()), it.name.trim(), it.songKeys.map(keyToId::getValue)) }
            when {
                fresh.any { it in library.purged } -> refused(Refusal.PURGED)

                fresh.size != fresh.toSet().size ||
                    fresh.any {
                        library.identityInUse(
                            it,
                        )
                    }
                -> refused(Refusal.DUPLICATE_ID)

                else -> accepted(apply(library, songs, set))
            }
        }

    private fun apply(
        library: Library,
        songs: List<Song>,
        set: MusicSet?,
    ): Library {
        val withHistory = songs.fold(library) { current, song -> current.recordRevision(song) }
        return withHistory.copy(songs = library.songs + songs, sets = library.sets + listOfNotNull(set))
    }

    private fun validate(graph: TransferGraph): Refusal? {
        val keys = graph.songs.map { it.key }
        val names =
            graph.songs.map { it.name } + graph.songs.flatMap { s -> s.sections.map { it.name } } +
                listOfNotNull(graph.set?.name)
        return when {
            names.any { it.isBlank() } -> Refusal.INVALID_NAME

            graph.songs.any { s ->
                s.sections.any { it.repeats !in MIN_REPEATS..MAX_REPEATS }
            } -> Refusal.INVALID_REPEATS

            keys.toSet().size != keys.size -> Refusal.DUPLICATE_KEY

            graph.set != null && !keys.containsAll(graph.set.songKeys) -> Refusal.DANGLING_REFERENCE

            graph.set != null && graph.set.songKeys
                .toSet()
                .size != graph.set.songKeys.size -> Refusal.DUPLICATE_MEMBER

            else -> null
        }
    }
}
