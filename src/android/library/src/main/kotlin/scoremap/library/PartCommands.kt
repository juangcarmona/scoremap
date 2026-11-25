package scoremap.library

private const val LOWEST_PITCH = 0
private const val HIGHEST_PITCH = 127

/** What one command acts on: a song, one of its parts and optionally one harmonic event. */
public data class PartRef(
    val songId: SongId,
    val partId: PartId,
)

/**
 * Independent performed parts and the exact voicings they play for the shared harmonic events.
 * The edit-mode guard runs first and a refusal never changes the library it was given.
 */
public object PartCommands {
    public fun addPart(
        library: Library,
        mode: Mode,
        songId: SongId,
        rawName: String,
        ids: IdSource,
    ): Outcome<Library> =
        SongEdit.run(library, mode, songId) { song ->
            val name = rawName.trim()
            val id = ids.next()
            when {
                name.isEmpty() -> refuse(Refusal.INVALID_NAME)
                id in library.purged -> refuse(Refusal.PURGED)
                library.identityInUse(id) -> refuse(Refusal.DUPLICATE_ID)
                else -> accept(song.copy(parts = song.parts + Part(PartId(id), name)))
            }
        }

    public fun renamePart(
        library: Library,
        mode: Mode,
        ref: PartRef,
        rawName: String,
    ): Outcome<Library> =
        SongEdit.run(library, mode, ref.songId) { song ->
            val name = rawName.trim()
            when {
                song.parts.none { it.id == ref.partId } -> {
                    refuse(Refusal.UNKNOWN_PART)
                }

                name.isEmpty() -> {
                    refuse(Refusal.INVALID_NAME)
                }

                else -> {
                    accept(
                        song.copy(
                            parts =
                                song.parts.map {
                                    if (it.id ==
                                        ref.partId
                                    ) {
                                        it.copy(name = name)
                                    } else {
                                        it
                                    }
                                },
                        ),
                    )
                }
            }
        }

    /** Removing a part removes its voicings, so the musician confirms it; without [confirmed] it is refused. */
    public fun removePart(
        library: Library,
        mode: Mode,
        ref: PartRef,
        confirmed: Boolean,
    ): Outcome<Library> =
        SongEdit.run(library, mode, ref.songId) { song ->
            val part = song.parts.firstOrNull { it.id == ref.partId }
            when {
                part == null -> refuse(Refusal.UNKNOWN_PART)
                part.voicings.isNotEmpty() && !confirmed -> refuse(Refusal.IN_USE)
                else -> accept(song.copy(parts = song.parts - part))
            }
        }

    /** Sets the exact notes a part plays for an event; no notes removes the voicing. Duplicates are not kept. */
    public fun setVoicing(
        library: Library,
        mode: Mode,
        ref: PartRef,
        eventId: EventId,
        notes: List<PerformedNote>,
    ): Outcome<Library> =
        SongEdit.run(library, mode, ref.songId) { song ->
            when {
                song.parts.none { it.id == ref.partId } -> {
                    refuse(Refusal.UNKNOWN_PART)
                }

                song.sections.none { s -> s.measures.any { m -> m.events.any { it.id == eventId } } } -> {
                    refuse(Refusal.UNKNOWN_EVENT)
                }

                notes.any { it.midi !in LOWEST_PITCH..HIGHEST_PITCH } -> {
                    refuse(Refusal.INVALID_PITCH)
                }

                else -> {
                    accept(
                        song.copy(
                            parts =
                                song.parts.map {
                                    if (it.id ==
                                        ref.partId
                                    ) {
                                        voiced(it, eventId, notes)
                                    } else {
                                        it
                                    }
                                },
                        ),
                    )
                }
            }
        }

    private fun voiced(
        part: Part,
        eventId: EventId,
        notes: List<PerformedNote>,
    ): Part {
        val sorted = notes.distinct().sortedWith(compareBy({ it.midi }, { it.hand }))
        val others = part.voicings.filterNot { it.eventId == eventId }
        return part.copy(voicings = if (sorted.isEmpty()) others else others + Voicing(eventId, sorted))
    }

    private fun accept(song: Song): Outcome<Song> = Outcome.Accepted(song)

    private fun refuse(refusal: Refusal): Outcome<Song> = Outcome.Refused(refusal)
}

/** Shared plumbing for commands that replace one song as a single new revision. */
internal object SongEdit {
    fun run(
        library: Library,
        mode: Mode,
        songId: SongId,
        change: (Song) -> Outcome<Song>,
    ): Outcome<Library> {
        val song = library.songs.firstOrNull { it.id == songId }
        val outcome =
            when {
                mode != Mode.EDIT -> Outcome.Refused(Refusal.PERFORMANCE_MODE)
                song == null -> Outcome.Refused(Refusal.UNKNOWN_SONG)
                else -> change(song)
            }
        return when (outcome) {
            is Outcome.Refused -> {
                outcome
            }

            is Outcome.Accepted -> {
                Outcome.Accepted(
                    if (outcome.value ==
                        song
                    ) {
                        library
                    } else {
                        library.revise(outcome.value)
                    },
                )
            }
        }
    }
}
