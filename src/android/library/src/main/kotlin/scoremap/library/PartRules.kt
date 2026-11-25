package scoremap.library

private const val LOWEST_PITCH = 0
private const val HIGHEST_PITCH = 127

/** Checks the parts a package carries: every voicing must name an existing chord and valid pitches. */
internal object PartRules {
    fun refusal(song: GraphSong): Refusal? =
        song.parts.firstNotNullOfOrNull { part ->
            part.voicings.firstNotNullOfOrNull { voicing ->
                when {
                    !exists(song, voicing.at) -> Refusal.DANGLING_REFERENCE
                    voicing.notes.any { it.midi !in LOWEST_PITCH..HIGHEST_PITCH } -> Refusal.INVALID_PITCH
                    else -> null
                }
            }
        } ?: duplicatedEvent(song) ?: phraseRefusal(song)

    private fun phraseRefusal(song: GraphSong): Refusal? =
        song.parts.flatMap { it.phrases }.firstNotNullOfOrNull { phrase ->
            when {
                phrase.section != null && song.sections.getOrNull(phrase.section) == null -> {
                    Refusal.DANGLING_REFERENCE
                }

                phrase.items.any { it.pitch != null && it.pitch.midi !in LOWEST_PITCH..HIGHEST_PITCH } -> {
                    Refusal.INVALID_PITCH
                }

                else -> {
                    null
                }
            }
        }

    private fun duplicatedEvent(song: GraphSong): Refusal? =
        if (song.parts.any { p -> p.voicings.map { it.at }.let { it.size != it.toSet().size } }) {
            Refusal.DUPLICATE_KEY
        } else {
            null
        }

    private fun exists(
        song: GraphSong,
        at: EventPosition,
    ): Boolean =
        song.sections
            .getOrNull(at.section)
            ?.measures
            ?.getOrNull(at.measure)
            ?.events
            ?.getOrNull(at.event) != null
}
