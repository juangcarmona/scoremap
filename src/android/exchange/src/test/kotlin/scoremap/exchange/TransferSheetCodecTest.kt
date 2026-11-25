package scoremap.exchange

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import scoremap.library.GraphAttachment
import scoremap.library.GraphSection
import scoremap.library.GraphSong
import scoremap.library.PdfBytes
import scoremap.library.TransferGraph

public class TransferSheetCodecTest {
    private val graph =
        TransferGraph(
            listOf(
                GraphSong(
                    "a",
                    "Autumn Leaves",
                    listOf(
                        GraphSection("Verse", 2, "Line one\nLine \"two\"", "Softly"),
                        GraphSection("Chorus", 1),
                    ),
                    songKey = "F# minor",
                ),
                GraphSong("b", "Blue Bossa", emptyList()),
            ),
            null,
        )

    private val literal =
        "{\"format\":\"scoremap-transfer\",\"version\":3,\"songs\":[" +
            "{\"key\":\"a\",\"name\":\"Autumn Leaves\",\"songKey\":\"F# minor\",\"sections\":[" +
            "{\"name\":\"Verse\",\"repeats\":2,\"lyrics\":\"Line one\\nLine \\\"two\\\"\",\"cue\":\"Softly\"}," +
            "{\"name\":\"Chorus\",\"repeats\":1}]}," +
            "{\"key\":\"b\",\"name\":\"Blue Bossa\",\"sections\":[]}]}"

    @Test
    public fun writesVersionThreeOnlyWhenSheetContentIsPresentAndOmitsAbsentFields() {
        assertEquals(literal, TransferCodec.encode(graph))
        val bare = TransferCodec.encode(TransferGraph(listOf(GraphSong("a", "A", listOf(GraphSection("V", 1)))), null))
        assertTrue(bare, bare.contains("\"version\":1"))
        assertTrue(bare, !bare.contains("lyrics") && !bare.contains("cue") && !bare.contains("songKey"))
    }

    @Test
    public fun decodesExactlyWhatWasWritten() {
        assertEquals(DecodeOutcome.Decoded(graph), TransferCodec.decode(literal))
        assertEquals(DecodeOutcome.Decoded(graph), TransferCodec.decode(TransferCodec.encode(graph)))
    }

    @Test
    public fun versionThreeAlsoCarriesPdfsAndEarlierVersionsRefuseSheetFields() {
        val pdf = GraphAttachment("Score", PdfBytes(byteArrayOf(1, 2, 3)))
        val both = graph.copy(songs = graph.songs.map { it.copy(attachments = listOf(pdf)) })
        val encoded = TransferCodec.encode(both)
        assertTrue(encoded, encoded.contains("\"version\":3"))
        assertEquals(DecodeOutcome.Decoded(both), TransferCodec.decode(encoded))
        val invalid = DecodeOutcome.Rejected(Rejection.INVALID_STRUCTURE)
        for (older in listOf(1, 2)) {
            assertEquals(invalid, TransferCodec.decode(literal.replace("\"version\":3", "\"version\":$older")))
        }
        val unsupported = DecodeOutcome.Rejected(Rejection.UNSUPPORTED_VERSION)
        assertEquals(unsupported, TransferCodec.decode(literal.replace("\"version\":3", "\"version\":7")))
    }

    @Test
    public fun rejectsWrongTypesForSheetFields() {
        val invalid = DecodeOutcome.Rejected(Rejection.INVALID_STRUCTURE)
        assertEquals(invalid, TransferCodec.decode(literal.replace("\"songKey\":\"F# minor\"", "\"songKey\":7")))
        val malformed = DecodeOutcome.Rejected(Rejection.MALFORMED)
        assertEquals(malformed, TransferCodec.decode(literal.replace("\"cue\":\"Softly\"", "\"cue\":null")))
        assertEquals(invalid, TransferCodec.decode(literal.replace("\"cue\":\"Softly\"", "\"cue\":[]")))
        assertEquals(invalid, TransferCodec.decode(literal.replace("\"cue\":\"Softly\"", "\"cue\":\"a\",\"extra\":1")))
    }
}
