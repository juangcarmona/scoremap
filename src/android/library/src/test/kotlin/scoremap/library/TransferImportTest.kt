package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

public class TransferImportTest {
    private val ids = SequentialIds("new")

    private fun graph(
        set: GraphSet? = GraphSet("Friday", listOf("a", "b")),
        songs: List<GraphSong> =
            listOf(
                GraphSong("a", "Autumn Leaves", listOf(GraphSection("Verse", 2), GraphSection("Chorus", 1))),
                GraphSong("b", "Blue Bossa", emptyList()),
            ),
    ) = TransferGraph(songs, set)

    @Test
    public fun importsACompleteGraphWithFreshConsistentIdentities() {
        val library = ok(ImportCommands.importGraph(Library.empty(), Mode.EDIT, graph(), ids))
        assertEquals(listOf("Autumn Leaves", "Blue Bossa"), library.songs.map { it.name })
        assertTrue(library.songs.none { it.id.value == "a" || it.id.value == "b" })
        assertEquals(
            listOf("Verse", "Chorus"),
            library.songs
                .first()
                .sections
                .map { it.name },
        )
        assertEquals(
            listOf(2, 1),
            library.songs
                .first()
                .sections
                .map { it.repeats },
        )
        val set = library.sets.single()
        assertEquals("Friday", set.name)
        assertEquals(library.songs.map { it.id }, set.songIds)
        val allIds =
            library.songs.map { it.id.value } + library.songs.flatMap { s -> s.sections.map { it.id.value } } +
                set.id.value
        assertEquals(allIds.size, allIds.toSet().size)
        assertEquals(listOf(1L), RetentionCommands.history(library, library.songs.first().id).map { it.number })
    }

    @Test
    public fun importingTwiceCreatesIndependentCopiesAndPreservesUnrelatedContent() {
        var library = ok(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "Mine", ids))
        val mine = library.songs.single()
        library = ok(ImportCommands.importGraph(library, Mode.EDIT, graph(), ids))
        library = ok(ImportCommands.importGraph(library, Mode.EDIT, graph(), ids))
        assertEquals(5, library.songs.size)
        assertEquals(mine, library.songs.first())
        assertEquals(2, library.sets.size)
        assertEquals(
            library.sets.size,
            library.sets
                .map { it.id }
                .toSet()
                .size,
        )
    }

    @Test
    public fun refusesDanglingDuplicateAndInvalidGraphsWithoutChangingTheLibrary() {
        val base = ok(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "Mine", ids))
        val cases =
            mapOf(
                Refusal.DANGLING_REFERENCE to graph(set = GraphSet("S", listOf("a", "missing"))),
                Refusal.DUPLICATE_KEY to
                    graph(songs = listOf(GraphSong("a", "A", emptyList()), GraphSong("a", "B", emptyList()))),
                Refusal.DUPLICATE_MEMBER to graph(set = GraphSet("S", listOf("a", "a"))),
                Refusal.INVALID_NAME to graph(songs = listOf(GraphSong("a", "  ", emptyList()))),
                Refusal.INVALID_REPEATS to graph(songs = listOf(GraphSong("a", "A", listOf(GraphSection("V", 100))))),
            )
        for ((expected, input) in cases) {
            val fixed =
                if (expected == Refusal.DANGLING_REFERENCE ||
                    expected == Refusal.DUPLICATE_MEMBER
                ) {
                    input
                } else {
                    input.copy(set = null)
                }
            assertEquals(expected.name, expected, refusal(ImportCommands.importGraph(base, Mode.EDIT, fixed, ids)))
        }
        assertEquals(listOf("Mine"), base.songs.map { it.name })
    }

    @Test
    public fun performanceModeRefusesImport() {
        assertEquals(
            Refusal.PERFORMANCE_MODE,
            refusal(ImportCommands.importGraph(Library.empty(), Mode.PERFORMANCE, graph(), ids)),
        )
    }

    @Test
    public fun exportsASongOrASetWithItsMemberSongsInOrder() {
        var library = ok(ImportCommands.importGraph(Library.empty(), Mode.EDIT, graph(), ids))
        val (a, b) = library.songs
        val song = TransferGraph.ofSong(a)
        assertEquals(listOf(a.name), song.songs.map { it.name })
        assertEquals(null, song.set)
        library = ok(SetCommands.setMembers(library, Mode.EDIT, library.sets.single().id, 1, listOf(b.id, a.id)))
        val set = TransferGraph.ofSet(library, library.sets.single())
        assertEquals(listOf("Blue Bossa", "Autumn Leaves"), set.songs.map { it.name })
        assertEquals(listOf(b.id.value, a.id.value), set.set?.songKeys)
    }

    @Test
    public fun importsAttachmentsFromInspectedFactsAndRefusesMissingOrInvalidOnes() {
        val pdf = GraphAttachment(" Score ", PdfBytes(ByteArray(10)))
        val withPdf = TransferGraph(listOf(GraphSong("a", "A", emptyList(), listOf(pdf))), null)
        val good = mapOf("a" to listOf(PdfFacts("c".repeat(64), 10, 4)))
        val library = ok(ImportCommands.importGraph(Library.empty(), Mode.EDIT, withPdf, ids, good))
        val attachment =
            library.songs
                .single()
                .attachments
                .single()
        assertEquals("Score", attachment.name)
        assertEquals(listOf(4, 1), listOf(attachment.pages, attachment.lastPage))
        assertEquals(setOf("c".repeat(64)), AttachmentCommands.referencedDigests(library))
        val none = emptyMap<String, List<PdfFacts>>()
        assertEquals(
            Refusal.PDF_UNSUPPORTED,
            refusal(ImportCommands.importGraph(Library.empty(), Mode.EDIT, withPdf, ids, none)),
        )
        val big = mapOf("a" to listOf(PdfFacts("c".repeat(64), PdfLimits.MAX_BYTES + 1, 1)))
        assertEquals(
            Refusal.PDF_TOO_LARGE,
            refusal(ImportCommands.importGraph(Library.empty(), Mode.EDIT, withPdf, ids, big)),
        )
        val pages = mapOf("a" to listOf(PdfFacts("c".repeat(64), 10, 0)))
        assertEquals(
            Refusal.PDF_UNSUPPORTED,
            refusal(ImportCommands.importGraph(Library.empty(), Mode.EDIT, withPdf, ids, pages)),
        )
        val blank = withPdf.copy(songs = listOf(GraphSong("a", "A", emptyList(), listOf(pdf.copy(name = " ")))))
        assertEquals(
            Refusal.INVALID_NAME,
            refusal(ImportCommands.importGraph(Library.empty(), Mode.EDIT, blank, ids, good)),
        )
    }

    private fun ok(outcome: Outcome<Library>): Library =
        (outcome as? Outcome.Accepted)?.value ?: error("Expected acceptance but got $outcome")

    private fun refusal(outcome: Outcome<Library>): Refusal =
        (outcome as? Outcome.Refused)?.refusal ?: error("Expected a refusal but got $outcome")

    private class SequentialIds(
        private val prefix: String,
    ) : IdSource {
        private var next = 0

        override fun next(): String = "$prefix-${next++}"
    }
}
