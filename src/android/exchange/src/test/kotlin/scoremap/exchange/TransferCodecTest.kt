package scoremap.exchange

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import scoremap.library.GraphSection
import scoremap.library.GraphSet
import scoremap.library.GraphSong
import scoremap.library.TransferGraph

public class TransferCodecTest {
    private val graph =
        TransferGraph(
            listOf(
                GraphSong("a", "Autumn Leaves", listOf(GraphSection("Verse", 2), GraphSection("Chorus", 1))),
                GraphSong("b", "Say \"Hi\" \\ é", emptyList()),
            ),
            GraphSet("Friday", listOf("a", "b")),
        )

    private val literal =
        "{\"format\":\"scoremap-transfer\",\"version\":1,\"songs\":[" +
            "{\"key\":\"a\",\"name\":\"Autumn Leaves\",\"sections\":[{\"name\":\"Verse\",\"repeats\":2}," +
            "{\"name\":\"Chorus\",\"repeats\":1}]}," +
            "{\"key\":\"b\",\"name\":\"Say \\\"Hi\\\" \\\\ é\",\"sections\":[]}]," +
            "\"set\":{\"name\":\"Friday\",\"songKeys\":[\"a\",\"b\"]}}"

    @Test
    public fun encodesTheDocumentedFormatExactly() {
        assertEquals(literal, TransferCodec.encode(graph))
        val withoutSet = TransferCodec.encode(graph.copy(set = null))
        assertTrue(withoutSet, !withoutSet.contains("\"set\""))
    }

    @Test
    public fun decodesWhatItEncodesIncludingEscapesAndNonAscii() {
        assertEquals(DecodeOutcome.Decoded(graph), TransferCodec.decode(literal))
        val bare = graph.copy(set = null)
        assertEquals(DecodeOutcome.Decoded(bare), TransferCodec.decode(TransferCodec.encode(bare)))
        val control = bare.copy(songs = listOf(GraphSong("c", "tab\there\nnew\u0001", emptyList())))
        assertEquals(DecodeOutcome.Decoded(control), TransferCodec.decode(TransferCodec.encode(control)))
        val unicode =
            "{\"format\":\"scoremap-transfer\",\"version\":1,\"songs\":" +
                "[{\"key\":\"u\",\"name\":\"\\u00e9\\u4e2d\",\"sections\":[]}]}"
        val names = (TransferCodec.decode(unicode) as DecodeOutcome.Decoded).graph.songs.map { it.name }
        assertEquals(listOf("é中"), names)
    }

    @Test
    public fun rejectsMalformedDocuments() {
        val head = "{\"format\":\"scoremap-transfer\","
        val malformed =
            listOf(
                "",
                "   ",
                "{",
                "[]",
                "null",
                "{\"format\":",
                literal + "x",
                literal.dropLast(1),
                "{'format':1}",
                head + "\"format\":\"scoremap-transfer\",\"version\":1,\"songs\":[]}",
                head + "\"version\":1,\"songs\":[{\"key\":\"a\",\"name\":\"bad\\q\",\"sections\":[]}]}",
                head + "\"version\":01,\"songs\":[]}",
                head + "\"version\":1.5,\"songs\":[]}",
            )
        for (text in malformed) {
            assertEquals(text, DecodeOutcome.Rejected(Rejection.MALFORMED), TransferCodec.decode(text))
        }
    }

    @Test
    public fun rejectsOversizedInputBeforeAndAfterParsing() {
        val small = TransferLimits(maxCharacters = 50, maxSongs = 1, maxSectionsPerSong = 1, maxDepth = 4)
        assertEquals(DecodeOutcome.Rejected(Rejection.OVERSIZED), TransferCodec.decode(literal, small))
        val roomy = TransferLimits(maxCharacters = 10_000, maxSongs = 1, maxSectionsPerSong = 1, maxDepth = 16)
        assertEquals(DecodeOutcome.Rejected(Rejection.OVERSIZED), TransferCodec.decode(literal, roomy))
        val deep = "[".repeat(100) + "]".repeat(100)
        assertEquals(DecodeOutcome.Rejected(Rejection.OVERSIZED), TransferCodec.decode(deep))
    }

    @Test
    public fun rejectsUnsupportedFormatsAndVersions() {
        val format = DecodeOutcome.Rejected(Rejection.UNSUPPORTED_FORMAT)
        val version = DecodeOutcome.Rejected(Rejection.UNSUPPORTED_VERSION)
        assertEquals(format, TransferCodec.decode(literal.replace("scoremap-transfer", "other")))
        assertEquals(version, TransferCodec.decode(literal.replace("\"version\":1", "\"version\":7")))
        assertEquals(version, TransferCodec.decode(literal.replace("\"version\":1", "\"version\":0")))
    }

    @Test
    public fun rejectsDocumentsWithTheWrongShape() {
        val shaped =
            listOf(
                literal.replace("\"songs\":[", "\"extra\":1,\"songs\":["),
                literal.replace("\"name\":\"Autumn Leaves\"", "\"name\":7"),
                literal.replace("\"repeats\":2", "\"repeats\":\"2\""),
                literal.replace("\"version\":1", "\"version\":\"1\""),
                literal.replace("\"songKeys\":[\"a\",\"b\"]", "\"songKeys\":\"a\""),
                "{\"format\":\"scoremap-transfer\",\"version\":1}",
                literal.replace("\"key\":\"a\",", ""),
            )
        for (text in shaped) {
            assertEquals(text, DecodeOutcome.Rejected(Rejection.INVALID_STRUCTURE), TransferCodec.decode(text))
        }
    }
}
