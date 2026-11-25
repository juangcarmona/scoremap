package scoremap.library

/** A lossless text form of a song's parts and voicings for adapters that store them in one column. */
public object PartsText {
    public fun encode(parts: List<Part>): String =
        parts.joinToString("\n") { part ->
            listOf(
                escape(part.id.value),
                escape(part.name),
                part.voicings.joinToString(";") { voicing(it) },
                part.phrases.joinToString("&") { PhraseText.encode(it) },
                part.hand?.name.orEmpty(),
            ).joinToString("|")
        }

    /** Reads text written by [encode]; text that is not valid is a corrupt store and is never half-read. */
    public fun decode(text: String): List<Part> =
        if (text.isEmpty()) {
            emptyList()
        } else {
            text.split('\n').map { line ->
                val fields = line.split('|')
                // Text written before phrases existed has three fields and no phrases.
                check(fields.size in FIELDS_PER_PART..FIELDS_WITH_HAND) { "Corrupt part" }
                val voicings =
                    if (fields[VOICINGS].isEmpty()) {
                        emptyList()
                    } else {
                        fields[VOICINGS]
                            .split(
                                ';',
                            ).map(::readVoicing)
                    }
                val phrases =
                    if (fields
                            .getOrElse(
                                PHRASES,
                            ) { "" }
                            .isEmpty()
                    ) {
                        emptyList()
                    } else {
                        fields[PHRASES].split('&').map(PhraseText::decode)
                    }
                val hand = fields.getOrElse(HAND) { "" }.ifEmpty { null }?.let { HandRole.valueOf(it) }
                Part(PartId(unescape(fields[ID])), unescape(fields[NAME]), voicings, phrases, hand)
            }
        }

    private fun voicing(voicing: Voicing): String =
        escape(voicing.eventId.value) + ":" +
            voicing.notes.joinToString(",") { "${it.midi}${if (it.hand == Hand.LEFT) 'L' else 'R'}" }

    private fun readVoicing(text: String): Voicing {
        val (event, notes) = text.split(':').also { check(it.size == 2) { "Corrupt voicing" } }
        return Voicing(EventId(unescape(event)), notes.split(',').map(::readNote))
    }

    internal fun readNote(text: String): PerformedNote {
        val hand =
            when (text.lastOrNull()) {
                'L' -> Hand.LEFT
                'R' -> Hand.RIGHT
                else -> error("Corrupt note")
            }
        return PerformedNote(checkNotNull(text.dropLast(1).toIntOrNull()) { "Corrupt pitch" }, hand)
    }

    private fun escape(value: String): String = escapeText(value)

    private fun unescape(value: String): String = unescapeText(value)

    private const val FIELDS_PER_PART = 3
    private const val FIELDS_WITH_HAND = 5
    private const val HAND = 4
    private const val PHRASES = 3
    private const val ID = 0
    private const val NAME = 1
    private const val VOICINGS = 2
}
