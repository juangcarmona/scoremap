package scoremap.library

import java.net.URLDecoder
import java.net.URLEncoder

/**
 * A compact, lossless text form of a section's measures for adapters that store them in one column.
 * Identities are percent-encoded, so no separator can occur inside a field.
 */
public object MeasuresText {
    public fun encode(measures: List<Measure>): String =
        measures.joinToString("\n") { m ->
            listOf(escape(m.id.value), m.meter.label, m.events.joinToString(";") { event(it) }).joinToString("|")
        }

    /** Reads text written by [encode]; text that is not valid is a corrupt store and is never half-read. */
    public fun decode(text: String): List<Measure> =
        if (text.isEmpty()) {
            emptyList()
        } else {
            text.split('\n').map { line ->
                val (id, meter, events) =
                    line
                        .split(
                            '|',
                        ).also { check(it.size == FIELDS_PER_MEASURE) { "Corrupt measure" } }
                Measure(
                    MeasureId(unescape(id)),
                    checkNotNull(Meter.parse(meter)) { "Corrupt meter" },
                    if (events.isEmpty()) emptyList() else events.split(';').map(::readEvent),
                )
            }
        }

    private fun event(event: ChordEvent): String =
        listOf(
            escape(event.id.value),
            event.start.toString(),
            event.duration.toString(),
            event.chord.root,
            event.chord.quality,
            event.chord.alterations.joinToString("+"),
            event.chord.bass.orEmpty(),
            event.lyricIndex?.toString().orEmpty(),
        ).joinToString(",")

    private fun readEvent(text: String): ChordEvent {
        val f = text.split(',').also { check(it.size == FIELDS_PER_EVENT) { "Corrupt event" } }
        return ChordEvent(
            EventId(unescape(f[ID])),
            checkNotNull(Fraction.parse(f[START])) { "Corrupt start" },
            checkNotNull(Fraction.parse(f[DURATION])) { "Corrupt duration" },
            ChordSpec(
                f[ROOT],
                f[QUALITY],
                f[ALTERATIONS].split('+').filter { it.isNotEmpty() },
                f[BASS].ifEmpty { null },
            ),
            f[LYRIC].ifEmpty { null }?.toInt(),
        )
    }

    private fun escape(value: String): String = URLEncoder.encode(value, "UTF-8")

    private fun unescape(value: String): String = URLDecoder.decode(value, "UTF-8")

    private const val FIELDS_PER_MEASURE = 3
    private const val FIELDS_PER_EVENT = 8
    private const val ID = 0
    private const val START = 1
    private const val DURATION = 2
    private const val ROOT = 3
    private const val QUALITY = 4
    private const val ALTERATIONS = 5
    private const val BASS = 6
    private const val LYRIC = 7
}
