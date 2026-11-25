package scoremap.library

private const val LOWEST_PITCH = 0
private const val HIGHEST_PITCH = 127

/** Where a phrase command acts: one part of one song and, when it exists, one phrase. */
public data class PhraseRef(
    val part: PartRef,
    val phraseId: PhraseId,
)

/** A phrase to create: its part, name and optionally the section it is prepared for. */
public data class PhraseTarget(
    val part: PartRef,
    val name: String,
    val section: SectionId? = null,
)

/**
 * Prepared melodic phrases of a part. The edit-mode guard runs first; a refusal never changes the library.
 * Timing is optional and is never filled in on the musician's behalf.
 */
public object PhraseCommands {
    public fun addPhrase(
        library: Library,
        mode: Mode,
        target: PhraseTarget,
        ids: IdSource,
    ): Outcome<Library> =
        PartEdit.run(library, mode, target.part) { song, part ->
            val rawName = target.name
            val section = target.section
            val name = rawName.trim()
            val id = ids.next()
            when {
                name.isEmpty() -> PartEdit.refuse(Refusal.INVALID_NAME)
                section != null && song.sections.none { it.id == section } -> PartEdit.refuse(Refusal.UNKNOWN_SECTION)
                id in library.purged -> PartEdit.refuse(Refusal.PURGED)
                library.identityInUse(id) -> PartEdit.refuse(Refusal.DUPLICATE_ID)
                else -> PartEdit.accept(part.copy(phrases = part.phrases + Phrase(PhraseId(id), name, section)))
            }
        }

    public fun renamePhrase(
        library: Library,
        mode: Mode,
        ref: PhraseRef,
        rawName: String,
    ): Outcome<Library> =
        PartEdit.run(library, mode, ref.part) { _, part ->
            val name = rawName.trim()
            when {
                part.phrases.none { it.id == ref.phraseId } -> PartEdit.refuse(Refusal.UNKNOWN_PHRASE)
                name.isEmpty() -> PartEdit.refuse(Refusal.INVALID_NAME)
                else -> PartEdit.accept(withPhrase(part, ref.phraseId) { it.copy(name = name) })
            }
        }

    public fun removePhrase(
        library: Library,
        mode: Mode,
        ref: PhraseRef,
    ): Outcome<Library> =
        PartEdit.run(library, mode, ref.part) { _, part ->
            if (part.phrases.none { it.id == ref.phraseId }) {
                PartEdit.refuse(Refusal.UNKNOWN_PHRASE)
            } else {
                PartEdit.accept(part.copy(phrases = part.phrases.filterNot { it.id == ref.phraseId }))
            }
        }

    /** Replaces the whole ordered content of a phrase; the order given is the order kept. */
    public fun setItems(
        library: Library,
        mode: Mode,
        ref: PhraseRef,
        items: List<PhraseItem>,
    ): Outcome<Library> =
        PartEdit.run(library, mode, ref.part) { _, part ->
            when {
                part.phrases.none { it.id == ref.phraseId } -> {
                    PartEdit.refuse(Refusal.UNKNOWN_PHRASE)
                }

                items.any { it.pitch != null && it.pitch.midi !in LOWEST_PITCH..HIGHEST_PITCH } -> {
                    PartEdit.refuse(Refusal.INVALID_PITCH)
                }

                else -> {
                    PartEdit.accept(withPhrase(part, ref.phraseId) { it.copy(items = items) })
                }
            }
        }

    private fun withPhrase(
        part: Part,
        id: PhraseId,
        change: (Phrase) -> Phrase,
    ): Part = part.copy(phrases = part.phrases.map { if (it.id == id) change(it) else it })
}

/** Shared plumbing for commands that replace one part of one song as a single new revision. */
internal object PartEdit {
    fun run(
        library: Library,
        mode: Mode,
        ref: PartRef,
        change: (Song, Part) -> Outcome<Part>,
    ): Outcome<Library> =
        SongEdit.run(library, mode, ref.songId) { song ->
            val part = song.parts.firstOrNull { it.id == ref.partId }
            if (part == null) {
                Outcome.Refused(Refusal.UNKNOWN_PART)
            } else {
                when (val outcome = change(song, part)) {
                    is Outcome.Refused -> {
                        outcome
                    }

                    is Outcome.Accepted -> {
                        Outcome.Accepted(
                            song.copy(
                                parts =
                                    song.parts.map {
                                        if (it.id ==
                                            part.id
                                        ) {
                                            outcome.value
                                        } else {
                                            it
                                        }
                                    },
                            ),
                        )
                    }
                }
            }
        }

    fun accept(part: Part): Outcome<Part> = Outcome.Accepted(part)

    fun refuse(refusal: Refusal): Outcome<Part> = Outcome.Refused(refusal)
}
