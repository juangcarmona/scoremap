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
            )
        assertEquals(parts, PartsText.decode(PartsText.encode(parts)))
        assertEquals(emptyList<Part>(), PartsText.decode(""))
        assertEquals("", PartsText.encode(emptyList()))
    }

    @Test
    public fun corruptTextIsNeverHalfRead() {
        for (bad in listOf("x", "a|b", "a|b|e", "a|b|e:60", "a|b|e:60X", "a|b|e:xL", "a|b|e:")) {
            assertTrue(bad, runCatching { PartsText.decode(bad) }.isFailure)
        }
    }
}
