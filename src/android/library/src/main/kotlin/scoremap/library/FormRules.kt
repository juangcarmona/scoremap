package scoremap.library

/** The BR-STRUCTURE checks for a section's form as carried by a package, applied before anything is imported. */
internal object FormRules {
    fun refusal(section: GraphSection): Refusal? {
        val lyricsLength = SheetCommands.normalised(section.lyrics).length
        return section.measures.firstNotNullOfOrNull { measure(it, lyricsLength) }
    }

    private fun measure(
        measure: GraphMeasure,
        lyricsLength: Int,
    ): Refusal? {
        val events = measure.events.sortedBy { it.start }
        return when {
            events.any { badTime(it, measure.meter) } -> Refusal.INVALID_TIME
            events.zipWithNext().any { (a, b) -> b.start < a.start + a.duration } -> Refusal.OVERLAP
            events.any { it.lyricIndex != null && it.lyricIndex !in 0..lyricsLength } -> Refusal.INVALID_LYRIC_LINK
            else -> null
        }
    }

    private fun badTime(
        event: GraphEvent,
        meter: Meter,
    ): Boolean =
        event.start < Fraction.ZERO || event.duration <= Fraction.ZERO || event.start >= meter.length ||
            event.start + event.duration > meter.length
}
