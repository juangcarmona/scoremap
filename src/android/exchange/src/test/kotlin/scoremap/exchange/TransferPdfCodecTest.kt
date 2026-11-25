package scoremap.exchange

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import scoremap.library.GraphAttachment
import scoremap.library.GraphSection
import scoremap.library.GraphSet
import scoremap.library.GraphSong
import scoremap.library.PdfBytes
import scoremap.library.TransferGraph

public class TransferPdfCodecTest {
    private val pdf = PdfBytes(byteArrayOf(0x25, 0x50, 0x44, 0x46, 0x00, 0x7F, -1))
    private val graph =
        TransferGraph(
            listOf(
                GraphSong(
                    "a",
                    "Autumn Leaves",
                    listOf(GraphSection("Verse", 2)),
                    listOf(GraphAttachment("Score", pdf)),
                ),
                GraphSong("b", "Blue Bossa", emptyList()),
            ),
            GraphSet("Friday", listOf("a", "b")),
        )

    private val literal =
        "{\"format\":\"scoremap-transfer\",\"version\":2,\"songs\":[" +
            "{\"key\":\"a\",\"name\":\"Autumn Leaves\",\"sections\":[{\"name\":\"Verse\",\"repeats\":2}]," +
            "\"attachments\":[{\"name\":\"Score\",\"data\":\"JVBERgB//w==\"}]}," +
            "{\"key\":\"b\",\"name\":\"Blue Bossa\",\"sections\":[]}]," +
            "\"set\":{\"name\":\"Friday\",\"songKeys\":[\"a\",\"b\"]}}"

    @Test
    public fun writesVersionTwoOnlyWhenAPackageCarriesPdfBytes() {
        assertEquals(literal, TransferCodec.encode(graph))
        val plain = TransferCodec.encode(graph.copy(songs = graph.songs.map { it.copy(attachments = emptyList()) }))
        assertTrue(plain, plain.contains("\"version\":1"))
        assertTrue(plain, !plain.contains("attachments"))
    }

    @Test
    public fun decodesTheBytesExactlyIncludingEveryByteValue() {
        assertEquals(DecodeOutcome.Decoded(graph), TransferCodec.decode(literal))
        val all = PdfBytes(ByteArray(256) { it.toByte() })
        val wide = TransferGraph(listOf(GraphSong("x", "Wide", emptyList(), listOf(GraphAttachment("All", all)))), null)
        assertEquals(DecodeOutcome.Decoded(wide), TransferCodec.decode(TransferCodec.encode(wide)))
    }

    @Test
    public fun versionOneNeverCarriesPdfsAndLaterVersionsAreUnsupported() {
        val asVersionOne = literal.replace("\"version\":2", "\"version\":1")
        assertEquals(DecodeOutcome.Rejected(Rejection.INVALID_STRUCTURE), TransferCodec.decode(asVersionOne))
        val unsupported = DecodeOutcome.Rejected(Rejection.UNSUPPORTED_VERSION)
        assertEquals(unsupported, TransferCodec.decode(literal.replace("\"version\":2", "\"version\":7")))
        assertEquals(unsupported, TransferCodec.decode(literal.replace("\"version\":2", "\"version\":0")))
    }

    @Test
    public fun rejectsMalformedBase64AndWrongAttachmentShapes() {
        val invalid = DecodeOutcome.Rejected(Rejection.INVALID_STRUCTURE)
        assertEquals(invalid, TransferCodec.decode(literal.replace("JVBERgB//w==", "not base64!")))
        assertEquals(invalid, TransferCodec.decode(literal.replace("JVBERgB//w==", "JVBERgB/ /w==")))
        assertEquals(invalid, TransferCodec.decode(literal.replace("\"data\":\"JVBERgB//w==\"", "\"data\":7")))
        assertEquals(invalid, TransferCodec.decode(literal.replace("\"name\":\"Score\",", "")))
        val notAnArray = literal.replace("[{\"name\":\"Score\",\"data\":\"JVBERgB//w==\"}]", "{}")
        assertEquals(invalid, TransferCodec.decode(notAnArray))
    }

    @Test
    public fun refusesOversizedAttachmentsBeforeKeepingThem() {
        val tight = TransferLimits(attachments = AttachmentLimits(maxBytes = 5))
        assertEquals(DecodeOutcome.Rejected(Rejection.OVERSIZED), TransferCodec.decode(literal, tight))
        val total = TransferLimits(attachments = AttachmentLimits(maxTotalBytes = 5))
        assertEquals(DecodeOutcome.Rejected(Rejection.OVERSIZED), TransferCodec.decode(literal, total))
        val many = TransferLimits(attachments = AttachmentLimits(maxPerSong = 0))
        assertEquals(DecodeOutcome.Rejected(Rejection.OVERSIZED), TransferCodec.decode(literal, many))
        assertEquals(
            DecodeOutcome.Decoded(graph),
            TransferCodec.decode(literal, TransferLimits(attachments = AttachmentLimits(maxBytes = 7))),
        )
    }
}
