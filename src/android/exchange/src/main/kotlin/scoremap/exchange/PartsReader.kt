package scoremap.exchange

import scoremap.library.EventPosition
import scoremap.library.GraphPart
import scoremap.library.GraphVoicing
import scoremap.library.HandRole

/** Reads the performed parts of a song within the declared bounds. */
internal class PartsReader(
    private val limits: TransferLimits,
    private val carriesPhrases: Boolean,
    private val carriesHands: Boolean,
) {
    private val phrases = PhrasesReader(limits)

    fun read(value: Json): List<GraphPart> {
        val items = (value as? Json.Array ?: invalid()).items
        need(items.size <= limits.maxPartsPerSong, Rejection.OVERSIZED)
        return items.map(::part)
    }

    private fun part(value: Json): GraphPart {
        val obj = value as? Json.Obj ?: invalid()
        exactly(obj, setOf("name", "voicings"), optional = optional())
        val voicings = (obj.fields["voicings"] as? Json.Array ?: invalid()).items
        need(voicings.size <= limits.maxVoicingsPerPart, Rejection.OVERSIZED)
        val hand = obj.fields["hand"]?.let { handRole((it as? Json.Text ?: invalid()).value) }
        return GraphPart(
            text(obj, "name"),
            voicings.map(::voicing),
            obj.fields["phrases"]?.let(phrases::read).orEmpty(),
            hand,
        )
    }

    private fun optional(): Set<String> =
        (if (carriesPhrases) setOf("phrases") else emptySet()) + (if (carriesHands) setOf("hand") else emptySet())

    private fun handRole(name: String): HandRole = HandRole.entries.firstOrNull { it.name == name } ?: invalid()

    private fun voicing(value: Json): GraphVoicing {
        val obj = value as? Json.Obj ?: invalid()
        exactly(obj, setOf("at", "notes"))
        val notes = (obj.fields["notes"] as? Json.Array ?: invalid()).items
        need(notes.size <= limits.maxNotesPerVoicing, Rejection.OVERSIZED)
        return GraphVoicing(position(obj.fields["at"] ?: invalid()), notes.map(::noteFrom))
    }

    private fun position(value: Json): EventPosition {
        val items = (value as? Json.Array ?: invalid()).items
        if (items.size != POSITION_PARTS) invalid()
        val numbers = items.map { indexFrom(it) }
        return EventPosition(numbers[0], numbers[1], numbers[2])
    }

    private companion object {
        const val POSITION_PARTS = 3
    }
}
