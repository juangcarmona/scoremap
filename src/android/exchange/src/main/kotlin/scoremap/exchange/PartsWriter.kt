package scoremap.exchange

import scoremap.library.GraphPart
import scoremap.library.GraphVoicing
import scoremap.library.Hand

/** Writes the performed parts of a song with positions instead of identities. */
internal object PartsWriter {
    fun part(part: GraphPart): String =
        "{\"name\":${JsonWriter.quote(part.name)},\"voicings\":" +
            part.voicings.joinToString(",", "[", "]") { voicing(it) } + "}"

    private fun voicing(voicing: GraphVoicing): String {
        val at = voicing.at
        val notes =
            voicing.notes.joinToString(",", "[", "]") {
                "{\"midi\":${it.midi},\"hand\":\"${if (it.hand == Hand.LEFT) "L" else "R"}\"}"
            }
        return "{\"at\":[${at.section},${at.measure},${at.event}],\"notes\":$notes}"
    }
}
