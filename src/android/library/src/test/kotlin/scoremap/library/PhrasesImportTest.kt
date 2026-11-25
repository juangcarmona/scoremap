package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Test

public class PhrasesImportTest {
    private val ids = SequentialIds()
    private val items = listOf(PhraseItem(PerformedNote(72, Hand.RIGHT)), PhraseItem(null, Fraction.ONE))

    private fun graph(vararg phrases: GraphPhrase) =
        TransferGraph(
            listOf(
                GraphSong(
                    "a",
                    "Song",
                    listOf(GraphSection("Verse", 1), GraphSection("Chorus", 1)),
                    parts = listOf(GraphPart(" Melody ", phrases = phrases.toList())),
                ),
            ),
            null,
        )

    @Test
    public fun importsPhrasesKeepingOrderTimingAndTheSectionTheyAreFor() {
        val library =
            ok(ImportCommands.importGraph(Library.empty(), Mode.EDIT, graph(GraphPhrase(" Theme ", 1, items)), ids))
        val song = library.songs.single()
        val phrase =
            song.parts
                .single()
                .phrases
                .single()
        assertEquals("Theme", phrase.name)
        assertEquals(song.sections[1].id, phrase.section)
        assertEquals(items, phrase.items)
        assertEquals(
            setOf(
                song.parts
                    .single()
                    .id.value,
                phrase.id.value,
            ).size,
            2,
        )
    }

    @Test
    public fun refusesAnUnknownSectionAnInvalidPitchAndABlankName() {
        val cases =
            listOf(
                Refusal.DANGLING_REFERENCE to graph(GraphPhrase("P", 5, items)),
                Refusal.INVALID_PITCH to
                    graph(GraphPhrase("P", null, listOf(PhraseItem(PerformedNote(128, Hand.LEFT))))),
                Refusal.INVALID_NAME to graph(GraphPhrase(" ", null, items)),
            )
        for ((refusal, g) in cases) {
            assertEquals(
                refusal,
                (ImportCommands.importGraph(Library.empty(), Mode.EDIT, g, ids) as Outcome.Refused).refusal,
            )
        }
    }

    @Test
    public fun exportAndImportAgainKeepsThePhrases() {
        val g = graph(GraphPhrase("Theme", 0, items), GraphPhrase("Free", null))
        val first = ok(ImportCommands.importGraph(Library.empty(), Mode.EDIT, g, ids))
        val exported = TransferGraph.ofSong(first.songs.single())
        assertEquals(
            g.songs
                .single()
                .parts
                .single()
                .phrases,
            exported.songs
                .single()
                .parts
                .single()
                .phrases,
        )
        assertEquals(2, ok(ImportCommands.importGraph(first, Mode.EDIT, exported, ids)).songs.size)
    }

    private fun ok(outcome: Outcome<Library>): Library =
        (outcome as? Outcome.Accepted)?.value ?: error("Expected acceptance but got $outcome")

    private class SequentialIds : IdSource {
        private var next = 0

        override fun next(): String = "new-${next++}"
    }
}
