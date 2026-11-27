package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

public class PartsTextTest {
    @Test
    public fun partsRoundTripIncludingOddNamesAndEveryHand() {
        val parts =
            listOf(
                Part(
                    PartId("p|1\n"),
                    "Right: hand; é",
                    listOf(
                        Voicing(EventId("e,1"), listOf(PerformedNote(0, Hand.LEFT), PerformedNote(127, Hand.RIGHT))),
                        Voicing(EventId("e2"), listOf(PerformedNote(60, Hand.RIGHT))),
                    ),
                ),
                Part(PartId("p2"), "Empty"),
                Part(
                    PartId("p3"),
                    "Melody",
                    emptyList(),
                    listOf(
                        Phrase(
                            PhraseId("h|1:&"),
                            "Theme: A & B",
                            SectionId("s,1"),
                            listOf(
                                PhraseItem(PerformedNote(72, Hand.RIGHT)),
                                PhraseItem(PerformedNote(60, Hand.LEFT), Fraction.of(1, 2)),
                                PhraseItem(null, Fraction.of(3, 2)),
                                PhraseItem(null),
                            ),
                        ),
                        Phrase(PhraseId("h2"), "Empty"),
                    ),
                ),
            )
        assertEquals(parts, PartsText.decode(PartsText.encode(parts)))
        assertEquals(emptyList<Part>(), PartsText.decode(""))
        assertEquals("", PartsText.encode(emptyList()))
    }

    @Test
    public fun textWrittenBeforePhrasesStillReads() {
        val old = "p1|Right|e:60R"
        assertEquals(
            listOf(Part(PartId("p1"), "Right", listOf(Voicing(EventId("e"), listOf(PerformedNote(60, Hand.RIGHT)))))),
            PartsText.decode(old),
        )
    }

    @Test
    public fun corruptTextIsNeverHalfRead() {
        for (bad in listOf(
            "x",
            "a|b",
            "a|b|e",
            "a|b|e:60",
            "a|b|e:60X",
            "a|b|e:xL",
            "a|b|e:",
            "a|b||p:n:s",
            "a|b||p:n:s:60X",
            "a|b||p:n:s:60R@x",
            "a|b||p:n:s:60R@1@2",
            "a|b||p:n:s:r@0",
        )) {
            assertTrue(bad, runCatching { PartsText.decode(bad) }.isFailure)
        }
    }
}
