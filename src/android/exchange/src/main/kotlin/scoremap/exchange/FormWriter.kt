package scoremap.exchange

import scoremap.library.GraphEvent
import scoremap.library.GraphMeasure

/** Writes the form of a section: measures with exact-time chord events. */
internal object FormWriter {
    fun measure(measure: GraphMeasure): String =
        "{\"meter\":${JsonWriter.quote(measure.meter.label)},\"events\":" +
            measure.events.joinToString(",", "[", "]") { event(it) } + "}"

    private fun event(event: GraphEvent): String {
        val chord = event.chord
        val alterations = chord.alterations.joinToString(",", "[", "]") { JsonWriter.quote(it) }
        val bass = chord.bass?.let { ",\"bass\":${JsonWriter.quote(it)}" }.orEmpty()
        val link = event.lyricIndex?.let { ",\"lyricIndex\":$it" }.orEmpty()
        return "{\"start\":${JsonWriter.quote(event.start.toString())}," +
            "\"duration\":${JsonWriter.quote(event.duration.toString())}," +
            "\"chord\":{\"root\":${JsonWriter.quote(chord.root)},\"quality\":${JsonWriter.quote(chord.quality)}," +
            "\"alterations\":$alterations$bass}$link}"
    }
}
