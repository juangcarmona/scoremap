package scoremap.exchange

import scoremap.library.GraphPart
import scoremap.library.GraphPhrase
import scoremap.library.GraphVoicing
import scoremap.library.Hand
import scoremap.library.PhraseItem

/** Writes the performed parts of a song with positions instead of identities. */
internal object PartsWriter {
    fun part(part: GraphPart): String =
        "{\"name\":${JsonWriter.quote(part.name)},\"voicings\":" +
            part.voicings.joinToString(",", "[", "]") { voicing(it) } + phrases(part) + "}"

    private fun phrases(part: GraphPart): String =
        if (part.phrases.isEmpty()) "" else part.phrases.joinToString(",", ",\"phrases\":[", "]") { phrase(it) }

    private fun phrase(phrase: GraphPhrase): String {
        val section = phrase.section?.let { ",\"section\":$it" }.orEmpty()
        return "{\"name\":${JsonWriter.quote(phrase.name)}$section,\"items\":" +
            phrase.items.joinToString(",", "[", "]") { item(it) } + "}"
    }

    private fun item(item: PhraseItem): String {
        val duration = item.duration?.let { ",\"duration\":${JsonWriter.quote(it.toString())}" }.orEmpty()
        val pitch = item.pitch
        return if (pitch == null) {
            "{\"kind\":\"rest\"$duration}"
        } else {
            "{\"kind\":\"note\",\"midi\":${pitch.midi},\"hand\":\"${handCode(pitch.hand)}\"$duration}"
        }
    }

    private fun handCode(hand: Hand): String = if (hand == Hand.LEFT) "L" else "R"

    private fun voicing(voicing: GraphVoicing): String {
        val at = voicing.at
        val notes =
            voicing.notes.joinToString(",", "[", "]") {
                "{\"midi\":${it.midi},\"hand\":\"${if (it.hand == Hand.LEFT) "L" else "R"}\"}"
            }
        return "{\"at\":[${at.section},${at.measure},${at.event}],\"notes\":$notes}"
    }
}
