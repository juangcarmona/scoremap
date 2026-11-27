package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

public class FormImportTest {
    private val ids = SequentialIds()
    private val c = ChordSpec("C", "major")

    private fun graph(
        lyrics: String = "Autumn leaves",
        measure: GraphMeasure,
    ) = TransferGraph(
        listOf(GraphSong("a", "Song", listOf(GraphSection("Verse", 1, lyrics, measures = listOf(measure))))),
        null,
    )

    private fun event(
        start: Long,
        duration: Long,
        link: Int? = null,
    ) = GraphEvent(Fraction.of(start, 1), Fraction.of(duration, 1), c, link)

    @Test
    public fun importsMeasuresAndEventsWithFreshIdentitiesAndKeepsTheirOrderAndTimes() {
        val measure = GraphMeasure(Meter(4, 4), listOf(event(2, 2, 13), event(0, 2, 0)))
        val library = ok(ImportCommands.importGraph(Library.empty(), Mode.EDIT, graph(measure = measure), ids))
        val imported =
            library.songs
                .single()
                .sections
                .single()
                .measures
                .single()
        assertEquals(Meter.COMMON, imported.meter)
        assertEquals(listOf(Fraction.of(2, 1), Fraction.ZERO), imported.events.map { it.start })
        assertEquals(listOf(13, 0), imported.events.map { it.lyricIndex })
        val identities = listOf(imported.id.value) + imported.events.map { it.id.value }
        assertTrue(identities.none { it == "a" } && identities.toSet().size == 3)
    }

    @Test
    public fun refusesInvalidTimesOverlapsAndDanglingLyricLinks() {
        val start = Library.empty()
        val expected =
            listOf(
                Refusal.INVALID_TIME to GraphMeasure(Meter.COMMON, listOf(event(4, 1))),
                Refusal.INVALID_TIME to GraphMeasure(Meter.COMMON, listOf(event(3, 2))),
                Refusal.INVALID_TIME to GraphMeasure(Meter.COMMON, listOf(event(0, 0))),
                Refusal.OVERLAP to GraphMeasure(Meter.COMMON, listOf(event(0, 2), event(1, 2))),
                Refusal.INVALID_LYRIC_LINK to GraphMeasure(Meter.COMMON, listOf(event(0, 1, 99))),
            )
        for ((refusal, measure) in expected) {
            val outcome = ImportCommands.importGraph(start, Mode.EDIT, graph(measure = measure), ids)
            assertEquals(refusal, (outcome as Outcome.Refused).refusal)
        }
        assertEquals(emptyList<Song>(), start.songs)
    }

    @Test
    public fun exportingASongCarriesItsFormAndImportingItAgainMatches() {
        val measure = GraphMeasure(Meter(3, 4), listOf(event(0, 3, 3)))
        val first = ok(ImportCommands.importGraph(Library.empty(), Mode.EDIT, graph(measure = measure), ids))
        val exported = TransferGraph.ofSong(first.songs.single())
        assertEquals(
            listOf(measure),
            exported.songs
                .single()
                .sections
                .single()
                .measures,
        )
        val second = ok(ImportCommands.importGraph(first, Mode.EDIT, exported, ids))
        assertEquals(2, second.songs.size)
    }

    private fun ok(outcome: Outcome<Library>): Library =
        (outcome as? Outcome.Accepted)?.value ?: error("Expected acceptance but got $outcome")

    private class SequentialIds : IdSource {
        private var next = 0

        override fun next(): String = "new-${next++}"
    }
}
