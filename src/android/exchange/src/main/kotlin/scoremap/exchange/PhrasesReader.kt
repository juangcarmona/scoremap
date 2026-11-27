package scoremap.exchange

import scoremap.library.Fraction
import scoremap.library.GraphPhrase
import scoremap.library.PerformedNote
import scoremap.library.PhraseItem

/** Reads the prepared phrases of a part within the declared bounds. */
internal class PhrasesReader(
    private val limits: TransferLimits,
) {
    fun read(value: Json): List<GraphPhrase> {
        val items = (value as? Json.Array ?: invalid()).items
        need(items.size <= limits.maxPhrasesPerPart, Rejection.OVERSIZED)
        return items.map(::phrase)
    }

    private fun phrase(value: Json): GraphPhrase {
        val obj = value as? Json.Obj ?: invalid()
        exactly(obj, setOf("name", "items"), optional = setOf("section"))
        val items = (obj.fields["items"] as? Json.Array ?: invalid()).items
        need(items.size <= limits.maxItemsPerPhrase, Rejection.OVERSIZED)
        return GraphPhrase(text(obj, "name"), obj.fields["section"]?.let(::indexFrom), items.map(::item))
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
                phraseItem(noteFrom(Json.Obj(obj.fields - "kind" - "duration")), duration)
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
}
