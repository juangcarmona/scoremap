package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

public class SheetImportTest {
    private val ids = SequentialIds()

    private fun graph(
        key: String? = "Bb major",
        section: GraphSection = GraphSection("Verse", 1, "  la la\r\nla  ", " Softly "),
    ) = TransferGraph(listOf(GraphSong("a", "Song", listOf(section), songKey = key)), null)

    @Test
    public fun importsKeyLyricsAndCuesNormalisedLikeADirectEdit() {
        val library = ok(ImportCommands.importGraph(Library.empty(), Mode.EDIT, graph(), ids))
        val song = library.songs.single()
        assertEquals("Bb major", song.key?.label)
        assertEquals("la la\nla", song.sections.single().lyrics)
        assertEquals("Softly", song.sections.single().cue)
        assertEquals(
            song.key,
            library.histories
                .getValue(song.id)
                .single()
                .key,
        )
    }

    @Test
    public fun anAbsentKeyStaysUnknown() {
        val library = ok(ImportCommands.importGraph(Library.empty(), Mode.EDIT, graph(key = null), ids))
        assertNull(library.songs.single().key)
    }

    @Test
    public fun refusesAnInvalidKeyOrTooLongTextAndChangesNothing() {
        val start = Library.empty()
        assertEquals(
            Refusal.INVALID_KEY,
            refusal(ImportCommands.importGraph(start, Mode.EDIT, graph(key = "H major"), ids)),
        )
        val longLyrics = graph(section = GraphSection("V", 1, "x".repeat(SheetCommands.MAX_LYRICS + 1)))
        assertEquals(Refusal.TEXT_TOO_LONG, refusal(ImportCommands.importGraph(start, Mode.EDIT, longLyrics, ids)))
        val longCue = graph(section = GraphSection("V", 1, cue = "x".repeat(SheetCommands.MAX_CUE + 1)))
        assertEquals(Refusal.TEXT_TOO_LONG, refusal(ImportCommands.importGraph(start, Mode.EDIT, longCue, ids)))
        assertEquals(emptyList<Song>(), start.songs)
    }

    @Test
    public fun exportingASongCarriesItsSheetContent() {
        var library = ok(ImportCommands.importGraph(Library.empty(), Mode.EDIT, graph(), ids))
        val exported = TransferGraph.ofSong(library.songs.single())
        assertEquals("Bb major", exported.songs.single().songKey)
        assertEquals(
            GraphSection("Verse", 1, "la la\nla", "Softly"),
            exported.songs
                .single()
                .sections
                .single(),
        )
        library = ok(ImportCommands.importGraph(library, Mode.EDIT, exported, ids))
        assertEquals(2, library.songs.size)
    }

    private fun ok(outcome: Outcome<Library>): Library =
        (outcome as? Outcome.Accepted)?.value ?: error("Expected acceptance but got $outcome")

    private fun refusal(outcome: Outcome<Library>): Refusal =
        (outcome as? Outcome.Refused)?.refusal ?: error("Expected a refusal but got $outcome")

    private class SequentialIds : IdSource {
        private var next = 0

        override fun next(): String = "new-${next++}"
    }
}
