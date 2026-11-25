package scoremap.exchange

import scoremap.library.EventPosition
import scoremap.library.Fraction
import scoremap.library.GraphPart
import scoremap.library.GraphPhrase
import scoremap.library.GraphVoicing
import scoremap.library.Hand
import scoremap.library.PerformedNote
import scoremap.library.PhraseItem

/** Reads the performed parts of a song within the declared bounds. */
internal class PartsReader(
    private val limits: TransferLimits,
    private val carriesPhrases: Boolean,
) {
    fun read(value: Json): List<GraphPart> {
        val items = (value as? Json.Array ?: invalid()).items
        need(items.size <= limits.maxPartsPerSong, Rejection.OVERSIZED)
        return items.map(::part)
    }

    private fun part(value: Json): GraphPart {
        val obj = value as? Json.Obj ?: invalid()
        exactly(obj, setOf("name", "voicings"), optional = if (carriesPhrases) setOf("phrases") else emptySet())
        val voicings = (obj.fields["voicings"] as? Json.Array ?: invalid()).items
        need(voicings.size <= limits.maxVoicingsPerPart, Rejection.OVERSIZED)
        return GraphPart(text(obj, "name"), voicings.map(::voicing), obj.fields["phrases"]?.let(::phrases).orEmpty())
    }

    private fun phrases(value: Json): List<GraphPhrase> {
        val items = (value as? Json.Array ?: invalid()).items
        need(items.size <= limits.maxPhrasesPerPart, Rejection.OVERSIZED)
        return items.map(::phrase)
    }

    private fun phrase(value: Json): GraphPhrase {
        val obj = value as? Json.Obj ?: invalid()
        exactly(obj, setOf("name", "items"), optional = setOf("section"))
        val items = (obj.fields["items"] as? Json.Array ?: invalid()).items
        need(items.size <= limits.maxItemsPerPhrase, Rejection.OVERSIZED)
        return GraphPhrase(text(obj, "name"), obj.fields["section"]?.let(::index), items.map(::item))
    }

    private fun item(value: Json): PhraseItem {
        val obj = value as? Json.Obj ?: invalid()
        val duration =
            obj.fields["duration"]?.let {
                Fraction.parse(
                    (it as? Json.Text ?: invalid()).value,
                ) ?: invalid()
            }
        return when (text(obj, "kind")) {
            "rest" -> {
                exactly(obj, setOf("kind"), optional = setOf("duration"))
                phraseItem(null, duration)
            }

            "note" -> {
                exactly(obj, setOf("kind", "midi", "hand"), optional = setOf("duration"))
                phraseItem(note(Json.Obj(obj.fields - "kind" - "duration")), duration)
            }

            else -> {
                invalid()
            }
        }
    }

    private fun phraseItem(
        pitch: PerformedNote?,
        duration: Fraction?,
    ): PhraseItem = runCatching { PhraseItem(pitch, duration) }.getOrNull() ?: invalid()

    private fun voicing(value: Json): GraphVoicing {
        val obj = value as? Json.Obj ?: invalid()
        exactly(obj, setOf("at", "notes"))
        val notes = (obj.fields["notes"] as? Json.Array ?: invalid()).items
        need(notes.size <= limits.maxNotesPerVoicing, Rejection.OVERSIZED)
        return GraphVoicing(position(obj.fields["at"] ?: invalid()), notes.map(::note))
    }

    private fun position(value: Json): EventPosition {
        val items = (value as? Json.Array ?: invalid()).items
        if (items.size != POSITION_PARTS) invalid()
        val numbers = items.map { index(it) }
        return EventPosition(numbers[0], numbers[1], numbers[2])
    }

    private fun index(value: Json): Int {
        val number = (value as? Json.Integer ?: invalid()).value
        if (number !in 0..Int.MAX_VALUE) invalid()
        return number.toInt()
    }

    private fun note(value: Json): PerformedNote {
        val obj = value as? Json.Obj ?: invalid()
        exactly(obj, setOf("midi", "hand"))
        val midi = (obj.fields["midi"] as? Json.Integer ?: invalid()).value
        if (midi !in Int.MIN_VALUE..Int.MAX_VALUE) invalid()
        val hand =
            when (text(obj, "hand")) {
                "L" -> Hand.LEFT
                "R" -> Hand.RIGHT
                else -> invalid()
            }
        return PerformedNote(midi.toInt(), hand)
    }

    private companion object {
        const val POSITION_PARTS = 3
    }
}
