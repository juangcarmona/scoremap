package scoremap.library

import java.net.URLDecoder
import java.net.URLEncoder

/** A lossless text form of a song's parts and voicings for adapters that store them in one column. */
public object PartsText {
    public fun encode(parts: List<Part>): String =
        parts.joinToString("\n") { part ->
            listOf(escape(part.id.value), escape(part.name), part.voicings.joinToString(";") { voicing(it) })
                .joinToString("|")
        }

    /** Reads text written by [encode]; text that is not valid is a corrupt store and is never half-read. */
    public fun decode(text: String): List<Part> =
        if (text.isEmpty()) {
            emptyList()
        } else {
            text.split('\n').map { line ->
                val fields = line.split('|')
                check(fields.size == FIELDS_PER_PART) { "Corrupt part" }
                val voicings =
                    if (fields[VOICINGS].isEmpty()) {
                        emptyList()
                    } else {
                        fields[VOICINGS]
                            .split(
                                ';',
                            ).map(::readVoicing)
                    }
                Part(PartId(unescape(fields[ID])), unescape(fields[NAME]), voicings)
            }
        }

    private fun voicing(voicing: Voicing): String =
        escape(voicing.eventId.value) + ":" +
            voicing.notes.joinToString(",") { "${it.midi}${if (it.hand == Hand.LEFT) 'L' else 'R'}" }

    private fun readVoicing(text: String): Voicing {
        val (event, notes) = text.split(':').also { check(it.size == 2) { "Corrupt voicing" } }
        return Voicing(EventId(unescape(event)), notes.split(',').map(::readNote))
    }

    private fun readNote(text: String): PerformedNote {
        val hand =
            when (text.lastOrNull()) {
                'L' -> Hand.LEFT
                'R' -> Hand.RIGHT
                else -> error("Corrupt note")
            }
        return PerformedNote(checkNotNull(text.dropLast(1).toIntOrNull()) { "Corrupt pitch" }, hand)
    }

    private fun escape(value: String): String = URLEncoder.encode(value, "UTF-8")

    private fun unescape(value: String): String = URLDecoder.decode(value, "UTF-8")

    private const val FIELDS_PER_PART = 3
    private const val ID = 0
    private const val NAME = 1
    private const val VOICINGS = 2
}
