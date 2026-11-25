package scoremap.exchange

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import scoremap.library.ChordSpec
import scoremap.library.Fraction
import scoremap.library.GraphEvent
import scoremap.library.GraphMeasure
import scoremap.library.GraphSection
import scoremap.library.GraphSong
import scoremap.library.Meter
import scoremap.library.TransferGraph

public class TransferFormCodecTest {
    private val graph =
        TransferGraph(
            listOf(
                GraphSong(
                    "a",
                    "Autumn Leaves",
                    listOf(
                        GraphSection(
                            "Verse",
                            1,
                            "Autumn leaves",
                            measures =
                                listOf(
                                    GraphMeasure(
                                        Meter(3, 4),
                                        listOf(
                                            GraphEvent(Fraction.ZERO, Fraction.of(3, 2), ChordSpec("C", "major"), 7),
                                            GraphEvent(
                                                Fraction.of(3, 2),
                                                Fraction.of(3, 2),
                                                ChordSpec("G", "dominant-seventh", listOf("b9"), "B"),
                                            ),
                                        ),
                                    ),
                                    GraphMeasure(Meter.COMMON),
                                ),
                        ),
                    ),
                ),
            ),
            null,
        )

    private val literal =
        "{\"format\":\"scoremap-transfer\",\"version\":4,\"songs\":[" +
            "{\"key\":\"a\",\"name\":\"Autumn Leaves\"," +
            "\"sections\":[{\"name\":\"Verse\",\"repeats\":1,\"lyrics\":\"Autumn leaves\",\"measures\":[" +
            "{\"meter\":\"3/4\",\"events\":[" +
            "{\"start\":\"0\",\"duration\":\"3/2\"," +
            "\"chord\":{\"root\":\"C\",\"quality\":\"major\",\"alterations\":[]}," +
            "\"lyricIndex\":7}," +
            "{\"start\":\"3/2\",\"duration\":\"3/2\",\"chord\":{\"root\":\"G\",\"quality\":\"dominant-seventh\"," +
            "\"alterations\":[\"b9\"],\"bass\":\"B\"}}]}," +
            "{\"meter\":\"4/4\",\"events\":[]}]}]}]}"

    @Test
    public fun writesVersionFourWhenAnyMeasureIsPresent() {
        assertEquals(literal, TransferCodec.encode(graph))
        val bare = TransferCodec.encode(TransferGraph(listOf(GraphSong("a", "A", listOf(GraphSection("V", 1)))), null))
        assertTrue(bare, bare.contains("\"version\":1") && !bare.contains("measures"))
    }

    @Test
    public fun decodesExactlyWhatWasWritten() {
        assertEquals(DecodeOutcome.Decoded(graph), TransferCodec.decode(literal))
        assertEquals(DecodeOutcome.Decoded(graph), TransferCodec.decode(TransferCodec.encode(graph)))
    }

    @Test
    public fun earlierVersionsRefuseMeasuresAndLaterVersionsAreUnsupported() {
        val invalid = DecodeOutcome.Rejected(Rejection.INVALID_STRUCTURE)
        for (older in listOf(1, 2, 3)) {
            assertEquals(invalid, TransferCodec.decode(literal.replace("\"version\":4", "\"version\":$older")))
        }
        val unsupported = DecodeOutcome.Rejected(Rejection.UNSUPPORTED_VERSION)
        assertEquals(unsupported, TransferCodec.decode(literal.replace("\"version\":4", "\"version\":6")))
    }

    @Test
    public fun rejectsValuesTheDomainCannotRepresent() {
        val invalid = DecodeOutcome.Rejected(Rejection.INVALID_STRUCTURE)
        val bad =
            listOf(
                "\"meter\":\"3/4\"" to "\"meter\":\"3/3\"",
                "\"start\":\"0\"" to "\"start\":\"a\"",
                "\"duration\":\"3/2\",\"chord\":{\"root\":\"C\"" to "\"duration\":\"1/0\",\"chord\":{\"root\":\"C\"",
                "\"root\":\"C\"" to "\"root\":\"H\"",
                "\"quality\":\"major\"" to "\"quality\":\"nope\"",
                "\"lyricIndex\":7" to "\"lyricIndex\":-1",
                "\"lyricIndex\":7" to "\"lyricIndex\":\"7\"",
                "\"bass\":\"B\"" to "\"bass\":\"Z\"",
                "\"alterations\":[]" to "\"alterations\":{}",
            )
        for ((from, to) in bad) assertEquals(from, invalid, TransferCodec.decode(literal.replace(from, to)))
    }

    @Test
    public fun refusesTooManyMeasuresOrEvents() {
        val tight = TransferLimits(maxMeasuresPerSection = 1)
        assertEquals(DecodeOutcome.Rejected(Rejection.OVERSIZED), TransferCodec.decode(literal, tight))
        val fewEvents = TransferLimits(maxEventsPerMeasure = 1)
        assertEquals(DecodeOutcome.Rejected(Rejection.OVERSIZED), TransferCodec.decode(literal, fewEvents))
        assertTrue(
            TransferCodec.decode(
                literal,
                TransferLimits(maxMeasuresPerSection = 2, maxEventsPerMeasure = 2),
            ) is DecodeOutcome.Decoded,
        )
    }
}
