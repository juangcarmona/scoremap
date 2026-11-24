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
        facts: Map<String, List<PdfFacts>> = emptyMap(),
    ): Outcome<Library> =
        guarded(mode) {
            validate(graph, facts)?.let { return@guarded refused(it) }
            val fresh = mutableListOf<String>()
            val next = {
                ids.next().also { fresh += it }
            }
            val songs =
                graph.songs.map { song ->
                    Song(
                        SongId(next()),
                        song.name.trim(),
                        song.sections.map { section(it, next()) },
                        attachments = attachments(song, facts[song.key].orEmpty(), next),
                        key = SongKey.parse(song.songKey),
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

    private fun section(
        source: GraphSection,
        id: String,
    ): Section =
        Section(
            SectionId(id),
            source.name.trim(),
            source.repeats,
            SheetCommands.normalised(source.lyrics),
            SheetCommands.normalised(source.cue),
        )

    private fun sheetRefusal(song: GraphSong): Refusal? =
        when {
            song.songKey != null && SongKey.parse(song.songKey) == null -> Refusal.INVALID_KEY

            song.sections.any {
                SheetCommands.normalised(it.lyrics).length > SheetCommands.MAX_LYRICS ||
                    SheetCommands.normalised(it.cue).length > SheetCommands.MAX_CUE
            } -> Refusal.TEXT_TOO_LONG

            else -> null
        }

    private fun attachments(
        song: GraphSong,
        facts: List<PdfFacts>,
        next: () -> String,
    ): List<Attachment> =
        song.attachments.zip(facts) { attachment, fact ->
            Attachment(AttachmentId(next()), attachment.name.trim(), fact.sha256, fact.bytes, fact.pages, 1)
        }

    private fun apply(
        library: Library,
        songs: List<Song>,
        set: MusicSet?,
    ): Library {
        val withHistory = songs.fold(library) { current, song -> current.recordRevision(song) }
        return withHistory.copy(songs = library.songs + songs, sets = library.sets + listOfNotNull(set))
    }

    private fun validate(
        graph: TransferGraph,
        facts: Map<String, List<PdfFacts>>,
    ): Refusal? {
        val keys = graph.songs.map { it.key }
        val names =
            graph.songs.map { it.name } + graph.songs.flatMap { s -> s.sections.map { it.name } } +
                graph.songs.flatMap { s -> s.attachments.map { it.name } } + listOfNotNull(graph.set?.name)
        return when {
            names.any { it.isBlank() } -> {
                Refusal.INVALID_NAME
            }

            graph.songs.any { s ->
                s.sections.any { it.repeats !in MIN_REPEATS..MAX_REPEATS }
            } -> {
                Refusal.INVALID_REPEATS
            }

            graph.songs.any { sheetRefusal(it) != null } -> {
                graph.songs.firstNotNullOf { sheetRefusal(it) }
            }

            graph.songs.any { pdfRefusal(it, facts[it.key].orEmpty()) != null } -> {
                graph.songs.firstNotNullOf { pdfRefusal(it, facts[it.key].orEmpty()) }
            }

            keys.toSet().size != keys.size -> {
                Refusal.DUPLICATE_KEY
            }

            graph.set != null && !keys.containsAll(graph.set.songKeys) -> {
                Refusal.DANGLING_REFERENCE
            }

            graph.set != null && graph.set.songKeys
                .toSet()
                .size != graph.set.songKeys.size -> {
                Refusal.DUPLICATE_MEMBER
            }

            else -> {
                null
            }
        }
    }

    /** Every attached PDF needs inspected facts within the same admission limits as a direct attach. */
    private fun pdfRefusal(
        song: GraphSong,
        facts: List<PdfFacts>,
    ): Refusal? =
        when {
            song.attachments.size != facts.size -> Refusal.PDF_UNSUPPORTED
            facts.any { it.bytes > PdfLimits.MAX_BYTES } -> Refusal.PDF_TOO_LARGE
            facts.any { it.bytes <= 0 || it.pages !in 1..PdfLimits.MAX_PAGES } -> Refusal.PDF_UNSUPPORTED
            else -> null
        }
}
