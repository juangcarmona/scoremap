package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Test

public class PartsImportTest {
    private val ids = SequentialIds()
    private val chord = ChordSpec("C", "major")

    private fun song(vararg parts: GraphPart) =
        TransferGraph(
            listOf(
                GraphSong(
                    "a",
                    "Song",
                    listOf(
                        GraphSection(
                            "Verse",
                            1,
                            measures =
                                listOf(
                                    GraphMeasure(
                                        Meter.COMMON,
                                        listOf(
                                            GraphEvent(Fraction.ZERO, Fraction.of(2, 1), chord),
                                            GraphEvent(Fraction.of(2, 1), Fraction.of(2, 1), chord),
                                        ),
                                    ),
                                ),
                        ),
                    ),
                    parts = parts.toList(),
                ),
            ),
            null,
        )

    private fun voicing(
        event: Int,
        vararg notes: PerformedNote,
    ) = GraphVoicing(EventPosition(0, 0, event), notes.toList())

    @Test
    public fun importsPartsBindingVoicingsToTheFreshChordIdentities() {
        val graph =
            song(GraphPart(" Right ", listOf(voicing(1, PerformedNote(64, Hand.RIGHT), PerformedNote(48, Hand.LEFT)))))
        val imported = ok(ImportCommands.importGraph(Library.empty(), Mode.EDIT, graph, ids)).songs.single()
        val events =
            imported.sections
                .single()
                .measures
                .single()
                .events
        val part = imported.parts.single()
        assertEquals("Right", part.name)
        assertEquals(events[1].id, part.voicings.single().eventId)
        assertEquals(
            listOf(48, 64),
            part.voicings
                .single()
                .notes
                .map { it.midi },
        )
        assertEquals(
            1,
            imported.parts
                .map { it.id }
                .toSet()
                .size,
        )
        assertEquals(setOf(events[0].id, events[1].id, part.id.value).size, 3)
    }

    @Test
    public fun refusesDanglingPositionsInvalidPitchesDuplicatesAndBlankNames() {
        val note = PerformedNote(60, Hand.RIGHT)
        val cases =
            listOf(
                Refusal.DANGLING_REFERENCE to song(GraphPart("P", listOf(voicing(5, note)))),
                Refusal.DANGLING_REFERENCE to
                    song(GraphPart("P", listOf(GraphVoicing(EventPosition(3, 0, 0), listOf(note))))),
                Refusal.INVALID_PITCH to song(GraphPart("P", listOf(voicing(0, PerformedNote(128, Hand.LEFT))))),
                Refusal.DUPLICATE_KEY to song(GraphPart("P", listOf(voicing(0, note), voicing(0, note)))),
                Refusal.INVALID_NAME to song(GraphPart("  ")),
            )
        for ((refusal, graph) in cases) {
            val outcome = ImportCommands.importGraph(Library.empty(), Mode.EDIT, graph, ids)
            assertEquals(refusal, (outcome as Outcome.Refused).refusal)
        }
    }

    @Test
    public fun exportAndImportAgainKeepsTheVoicingsOnTheSameChords() {
        val graph =
            song(
                GraphPart(
                    "Right",
                    listOf(voicing(0, PerformedNote(60, Hand.RIGHT)), voicing(1, PerformedNote(0, Hand.LEFT))),
                ),
            )
        val first = ok(ImportCommands.importGraph(Library.empty(), Mode.EDIT, graph, ids))
        val exported = TransferGraph.ofSong(first.songs.single())
        assertEquals(graph.songs.single().parts, exported.songs.single().parts)
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
