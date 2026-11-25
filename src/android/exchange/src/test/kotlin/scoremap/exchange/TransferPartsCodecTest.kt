package scoremap.exchange

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import scoremap.library.ChordSpec
import scoremap.library.EventPosition
import scoremap.library.Fraction
import scoremap.library.GraphEvent
import scoremap.library.GraphMeasure
import scoremap.library.GraphPart
import scoremap.library.GraphSection
import scoremap.library.GraphSong
import scoremap.library.GraphVoicing
import scoremap.library.Hand
import scoremap.library.Meter
import scoremap.library.PerformedNote
import scoremap.library.TransferGraph

public class TransferPartsCodecTest {
    private val graph =
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
                                        listOf(GraphEvent(Fraction.ZERO, Fraction.of(4, 1), ChordSpec("C", "major"))),
                                    ),
                                ),
                        ),
                    ),
                    parts =
                        listOf(
                            GraphPart(
                                "Right hand",
                                listOf(
                                    GraphVoicing(
                                        EventPosition(0, 0, 0),
                                        listOf(PerformedNote(48, Hand.LEFT), PerformedNote(64, Hand.RIGHT)),
                                    ),
                                ),
                            ),
                            GraphPart("Empty"),
                        ),
                ),
            ),
            null,
        )

    private val literal =
        "{\"format\":\"scoremap-transfer\",\"version\":5,\"songs\":[{\"key\":\"a\",\"name\":\"Song\"," +
            "\"sections\":[{\"name\":\"Verse\",\"repeats\":1,\"measures\":[{\"meter\":\"4/4\",\"events\":[" +
            "{\"start\":\"0\",\"duration\":\"4\"," +
            "\"chord\":{\"root\":\"C\",\"quality\":\"major\",\"alterations\":[]}}]}]}]," +
            "\"parts\":[{\"name\":\"Right hand\",\"voicings\":[{\"at\":[0,0,0],\"notes\":[" +
            "{\"midi\":48,\"hand\":\"L\"},{\"midi\":64,\"hand\":\"R\"}]}]},{\"name\":\"Empty\",\"voicings\":[]}]}]}"

    @Test
    public fun writesVersionFiveOnlyWhenThereAreParts() {
        assertEquals(literal, TransferCodec.encode(graph))
        val without = TransferCodec.encode(graph.copy(songs = graph.songs.map { it.copy(parts = emptyList()) }))
        assertTrue(without, without.contains("\"version\":4") && !without.contains("parts"))
    }

    @Test
    public fun decodesExactlyWhatWasWritten() {
        assertEquals(DecodeOutcome.Decoded(graph), TransferCodec.decode(literal))
        assertEquals(DecodeOutcome.Decoded(graph), TransferCodec.decode(TransferCodec.encode(graph)))
    }

    @Test
    public fun earlierVersionsRefuseParts() {
        val invalid = DecodeOutcome.Rejected(Rejection.INVALID_STRUCTURE)
        for (older in listOf(1, 2, 3, 4)) {
            assertEquals(invalid, TransferCodec.decode(literal.replace("\"version\":5", "\"version\":$older")))
        }
        assertEquals(
            DecodeOutcome.Rejected(Rejection.UNSUPPORTED_VERSION),
            TransferCodec.decode(literal.replace("\"version\":5", "\"version\":7")),
        )
    }

    @Test
    public fun rejectsShapesThatAreNotParts() {
        val invalid = DecodeOutcome.Rejected(Rejection.INVALID_STRUCTURE)
        val bad =
            listOf(
                "\"hand\":\"L\"" to "\"hand\":\"X\"",
                "\"hand\":\"L\"" to "\"hand\":1",
                "\"midi\":48" to "\"midi\":\"48\"",
                "\"at\":[0,0,0]" to "\"at\":[0,0]",
                "\"at\":[0,0,0]" to "\"at\":[0,0,-1]",
                "\"at\":[0,0,0]" to "\"at\":[0,0,\"0\"]",
                "\"voicings\":[]" to "\"voicings\":{}",
                "\"name\":\"Empty\"," to "",
            )
        for ((from, to) in bad) assertEquals(from, invalid, TransferCodec.decode(literal.replace(from, to)))
    }

    @Test
    public fun refusesTooManyPartsVoicingsOrNotes() {
        val oversized = DecodeOutcome.Rejected(Rejection.OVERSIZED)
        assertEquals(oversized, TransferCodec.decode(literal, TransferLimits(maxPartsPerSong = 1)))
        assertEquals(oversized, TransferCodec.decode(literal, TransferLimits(maxNotesPerVoicing = 1)))
        val noVoicings = TransferLimits(maxVoicingsPerPart = 0)
        assertEquals(oversized, TransferCodec.decode(literal, noVoicings))
        assertTrue(TransferCodec.decode(literal) is DecodeOutcome.Decoded)
    }
}
