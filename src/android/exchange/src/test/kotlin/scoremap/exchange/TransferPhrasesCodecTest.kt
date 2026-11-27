package scoremap.exchange

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import scoremap.library.Fraction
import scoremap.library.GraphPart
import scoremap.library.GraphPhrase
import scoremap.library.GraphSection
import scoremap.library.GraphSong
import scoremap.library.Hand
import scoremap.library.PerformedNote
import scoremap.library.PhraseItem
import scoremap.library.TransferGraph

public class TransferPhrasesCodecTest {
    private val graph =
        TransferGraph(
            listOf(
                GraphSong(
                    "a",
                    "Song",
                    listOf(GraphSection("Verse", 1)),
                    parts =
                        listOf(
                            GraphPart(
                                "Melody",
                                phrases =
                                    listOf(
                                        GraphPhrase(
                                            "Theme",
                                            0,
                                            listOf(
                                                PhraseItem(PerformedNote(72, Hand.RIGHT)),
                                                PhraseItem(PerformedNote(60, Hand.LEFT), Fraction.of(1, 2)),
                                                PhraseItem(null, Fraction.of(3, 2)),
                                                PhraseItem(null),
                                            ),
                                        ),
                                        GraphPhrase("Empty"),
                                    ),
                            ),
                        ),
                ),
            ),
            null,
        )

    private val literal =
        "{\"format\":\"scoremap-transfer\",\"version\":6,\"songs\":[{\"key\":\"a\",\"name\":\"Song\"," +
            "\"sections\":[{\"name\":\"Verse\",\"repeats\":1}],\"parts\":[{\"name\":\"Melody\",\"voicings\":[]," +
            "\"phrases\":[{\"name\":\"Theme\",\"section\":0,\"items\":[" +
            "{\"kind\":\"note\",\"midi\":72,\"hand\":\"R\"}," +
            "{\"kind\":\"note\",\"midi\":60,\"hand\":\"L\",\"duration\":\"1/2\"}," +
            "{\"kind\":\"rest\",\"duration\":\"3/2\"},{\"kind\":\"rest\"}]}," +
            "{\"name\":\"Empty\",\"items\":[]}]}]}]}"

    @Test
    public fun writesVersionSixOnlyWhenThereArePhrasesAndOmitsAbsentTiming() {
        assertEquals(literal, TransferCodec.encode(graph))
        val without =
            graph.copy(
                songs =
                    graph.songs.map { s ->
                        s.copy(parts = s.parts.map { it.copy(phrases = emptyList()) })
                    },
            )
        val plain = TransferCodec.encode(without)
        assertTrue(plain, plain.contains("\"version\":5") && !plain.contains("phrases"))
    }

    @Test
    public fun decodesExactlyWhatWasWritten() {
        assertEquals(DecodeOutcome.Decoded(graph), TransferCodec.decode(literal))
        assertEquals(DecodeOutcome.Decoded(graph), TransferCodec.decode(TransferCodec.encode(graph)))
    }

    @Test
    public fun earlierVersionsRefusePhrasesAndLaterVersionsAreUnsupported() {
        val invalid = DecodeOutcome.Rejected(Rejection.INVALID_STRUCTURE)
        assertEquals(invalid, TransferCodec.decode(literal.replace("\"version\":6", "\"version\":5")))
        assertEquals(
            DecodeOutcome.Rejected(Rejection.UNSUPPORTED_VERSION),
            TransferCodec.decode(literal.replace("\"version\":6", "\"version\":8")),
        )
    }

    @Test
    public fun rejectsShapesThatAreNotPhrases() {
        val invalid = DecodeOutcome.Rejected(Rejection.INVALID_STRUCTURE)
        val bad =
            listOf(
                "\"kind\":\"rest\",\"duration\":\"3/2\"" to "\"kind\":\"pause\",\"duration\":\"3/2\"",
                "\"duration\":\"3/2\"" to "\"duration\":\"0\"",
                "\"duration\":\"3/2\"" to "\"duration\":\"-1\"",
                "\"duration\":\"3/2\"" to "\"duration\":3",
                "\"midi\":72," to "",
                "\"hand\":\"R\"}," to "\"hand\":\"R\",\"duration\":\"x\"},",
                "\"section\":0" to "\"section\":-1",
                "\"kind\":\"rest\"}]}" to "\"kind\":\"rest\",\"midi\":3}]}",
                "\"items\":[]" to "\"items\":{}",
            )
        for ((from, to) in bad) assertEquals(from, invalid, TransferCodec.decode(literal.replace(from, to)))
    }

    @Test
    public fun refusesTooManyPhrasesOrItems() {
        val oversized = DecodeOutcome.Rejected(Rejection.OVERSIZED)
        assertEquals(oversized, TransferCodec.decode(literal, TransferLimits(maxPhrasesPerPart = 1)))
        assertEquals(oversized, TransferCodec.decode(literal, TransferLimits(maxItemsPerPhrase = 3)))
        assertTrue(TransferCodec.decode(literal) is DecodeOutcome.Decoded)
    }
}
