package scoremap.exchange

import scoremap.library.ChordSpec
import scoremap.library.Fraction
import scoremap.library.GraphEvent
import scoremap.library.GraphMeasure
import scoremap.library.Meter

/** Reads the measures of a section; any value the domain cannot represent makes the package invalid. */
internal class FormReader(
    private val limits: TransferLimits,
) {
    fun read(value: Json): List<GraphMeasure> {
        val items = (value as? Json.Array ?: invalid()).items
        need(items.size <= limits.maxMeasuresPerSection, Rejection.OVERSIZED)
        return items.map(::measure)
    }

    private fun measure(value: Json): GraphMeasure {
        val obj = value as? Json.Obj ?: invalid()
        exactly(obj, setOf("meter", "events"))
        val events = (obj.fields["events"] as? Json.Array ?: invalid()).items
        need(events.size <= limits.maxEventsPerMeasure, Rejection.OVERSIZED)
        return GraphMeasure(Meter.parse(text(obj, "meter")) ?: invalid(), events.map(::event))
    }

    private fun event(value: Json): GraphEvent {
        val obj = value as? Json.Obj ?: invalid()
        exactly(obj, setOf("start", "duration", "chord"), optional = setOf("lyricIndex"))
        val link = obj.fields["lyricIndex"]?.let { (it as? Json.Integer ?: invalid()).value }
        if (link != null && link !in 0..Int.MAX_VALUE) invalid()
        return GraphEvent(
            Fraction.parse(text(obj, "start")) ?: invalid(),
            Fraction.parse(text(obj, "duration")) ?: invalid(),
            chord(obj.fields["chord"] ?: invalid()),
            link?.toInt(),
        )
    }

    private fun chord(value: Json): ChordSpec {
        val obj = value as? Json.Obj ?: invalid()
        exactly(obj, setOf("root", "quality", "alterations"), optional = setOf("bass"))
        val alterations =
            (obj.fields["alterations"] as? Json.Array ?: invalid()).items.map {
                (
                    it as? Json.Text
                        ?: invalid()
                ).value
            }
        val bass = obj.fields["bass"]?.let { (it as? Json.Text ?: invalid()).value }
        return runCatching { ChordSpec(text(obj, "root"), text(obj, "quality"), alterations, bass) }.getOrNull()
            ?: invalid()
    }
}
