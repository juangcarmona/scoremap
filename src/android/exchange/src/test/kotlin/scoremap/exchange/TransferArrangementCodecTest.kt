package scoremap.exchange

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import scoremap.library.GraphBinding
import scoremap.library.GraphDevice
import scoremap.library.GraphPart
import scoremap.library.GraphSong
import scoremap.library.HandRole
import scoremap.library.TransferGraph
import scoremap.music.PitchRange

public class TransferArrangementCodecTest {
    private val graph =
        TransferGraph(
            listOf(
                GraphSong(
                    "a",
                    "Song",
                    emptyList(),
                    parts = listOf(GraphPart("Right", hand = HandRole.RIGHT), GraphPart("Pad")),
                    devices = listOf(GraphDevice("Stage piano"), GraphDevice("Mini", PitchRange(48, 84))),
                    bindings =
                        listOf(
                            GraphBinding(0, 0, PitchRange(60, 108), "Piano"),
                            GraphBinding(1, 1, PitchRange(48, 84)),
                        ),
                ),
            ),
            null,
        )

    private val literal =
        "{\"format\":\"scoremap-transfer\",\"version\":7,\"songs\":[{\"key\":\"a\",\"name\":\"Song\"," +
            "\"sections\":[],\"parts\":[{\"name\":\"Right\",\"voicings\":[],\"hand\":\"RIGHT\"}," +
            "{\"name\":\"Pad\",\"voicings\":[]}],\"devices\":[{\"name\":\"Stage piano\",\"lower\":21,\"upper\":108}," +
            "{\"name\":\"Mini\",\"lower\":48,\"upper\":84}],\"bindings\":[" +
            "{\"part\":0,\"device\":0,\"lower\":60,\"upper\":108,\"sound\":\"Piano\"}," +
            "{\"part\":1,\"device\":1,\"lower\":48,\"upper\":84}]}]}"

    @Test
    public fun writesVersionSevenOnlyWhenThereIsAnArrangementAndOmitsAbsentFields() {
        assertEquals(literal, TransferCodec.encode(graph))
        val plain =
            TransferCodec.encode(
                graph.copy(
                    songs =
                        graph.songs.map {
                            it.copy(
                                devices = emptyList(),
                                bindings = emptyList(),
                                parts =
                                    it.parts.map { p ->
                                        p.copy(hand = null)
                                    },
                            )
                        },
                ),
            )
        assertTrue(plain, plain.contains("\"version\":5") && !plain.contains("devices") && !plain.contains("hand"))
    }

    @Test
    public fun decodesExactlyWhatWasWritten() {
        assertEquals(DecodeOutcome.Decoded(graph), TransferCodec.decode(literal))
        assertEquals(DecodeOutcome.Decoded(graph), TransferCodec.decode(TransferCodec.encode(graph)))
    }

    @Test
    public fun earlierVersionsRefuseTheArrangementAndLaterVersionsAreUnsupported() {
        val invalid = DecodeOutcome.Rejected(Rejection.INVALID_STRUCTURE)
        for (older in listOf(1, 2, 3, 4, 5, 6)) {
            assertEquals(invalid, TransferCodec.decode(literal.replace("\"version\":7", "\"version\":$older")))
        }
        assertEquals(
            DecodeOutcome.Rejected(Rejection.UNSUPPORTED_VERSION),
            TransferCodec.decode(literal.replace("\"version\":7", "\"version\":8")),
        )
    }

    @Test
    public fun rejectsShapesAndRangesTheDomainCannotRepresent() {
        val invalid = DecodeOutcome.Rejected(Rejection.INVALID_STRUCTURE)
        val bad =
            listOf(
                "\"hand\":\"RIGHT\"" to "\"hand\":\"UP\"",
                "\"hand\":\"RIGHT\"" to "\"hand\":1",
                "\"lower\":48,\"upper\":84}]" to "\"lower\":90,\"upper\":84}]",
                "\"lower\":21" to "\"lower\":-1",
                "\"upper\":108}," to "\"upper\":200},",
                "\"part\":0" to "\"part\":\"0\"",
                "\"device\":1" to "\"device\":-1",
                "\"sound\":\"Piano\"" to "\"sound\":3",
                "\"name\":\"Mini\"," to "",
                "\"devices\":[" to "\"devices\":{},\"x\":[",
            )
        for ((from, to) in bad) assertEquals(from, invalid, TransferCodec.decode(literal.replace(from, to)))
    }

    @Test
    public fun refusesTooManyDevicesOrBindings() {
        val oversized = DecodeOutcome.Rejected(Rejection.OVERSIZED)
        assertEquals(oversized, TransferCodec.decode(literal, TransferLimits(maxDevicesPerSong = 1)))
        assertEquals(oversized, TransferCodec.decode(literal, TransferLimits(maxBindingsPerSong = 1)))
        assertTrue(TransferCodec.decode(literal) is DecodeOutcome.Decoded)
    }
}
