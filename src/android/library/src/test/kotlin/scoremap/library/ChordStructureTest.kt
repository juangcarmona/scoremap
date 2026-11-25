package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import scoremap.music.MusicRuleViolation

public class ChordStructureTest {
    @Test
    public fun fractionsAreExactReducedAndOrdered() {
        assertEquals(Fraction.of(1, 2), Fraction.of(2, 4))
        assertEquals(Fraction.of(1, 2), Fraction.of(-1, -2))
        assertEquals("3/2", Fraction.of(3, 2).toString())
        assertEquals("2", Fraction.of(4, 2).toString())
        assertEquals(Fraction.of(5, 6), Fraction.of(1, 2) + Fraction.of(1, 3))
        assertTrue(Fraction.of(1, 3) < Fraction.of(1, 2))
        assertEquals(Fraction.of(3, 2), Fraction.parse(" 3/2 "))
        assertEquals(Fraction.ONE, Fraction.parse("1"))
        for (bad in listOf("", "a", "1/0", "1/2/3", "+1", "1.5", "9999999/1")) assertNull(bad, Fraction.parse(bad))
        assertTrue(runCatching { Fraction.of(1, 0) }.exceptionOrNull() is MusicRuleViolation)
    }

    @Test
    public fun metersNeedAPositiveCountAndAPowerOfTwoUnit() {
        assertEquals(Fraction.of(4, 1), Meter.COMMON.length)
        assertEquals(Fraction.of(3, 2), Meter(3, 8).length)
        assertEquals(Fraction.of(7, 2), Meter(7, 8).length)
        assertEquals("6/8", Meter.parse("6/8")?.label)
        for (bad in listOf("0/4", "4/3", "4/0", "-1/4", "4", "a/b", "65/4", "4/64")) assertNull(bad, Meter.parse(bad))
    }

    @Test
    public fun chordSymbolsReadAndWriteTheSameCatalogueChords() {
        assertEquals(ChordSpec("Bb", "dominant-seventh"), ChordSpec.parse("Bb7"))
        assertEquals("Dm7", ChordSpec.parse("Dm7")?.symbol)
        assertEquals("C", ChordSpec.parse("C")?.symbol)
        assertEquals("C/E", ChordSpec.parse("C/E")?.symbol)
        assertEquals(
            "F#m7b5",
            ChordSpec
                .parse("F#m7b5")
                ?.symbol
                ?.replace("(", "")
                ?.replace(")", ""),
        )
        for (bad in listOf("", "H7", "C##", "Cxyz", "C/H", "7")) assertNull(bad, ChordSpec.parse(bad))
    }

    @Test
    public fun measuresRoundTripThroughTheirTextFormIncludingOddIdentities() {
        val event =
            ChordEvent(
                EventId("e,1;|+ é"),
                Fraction.of(1, 2),
                Fraction.of(3, 2),
                ChordSpec("G", "dominant-seventh", listOf("b9"), "B"),
                4,
            )
        val measures =
            listOf(
                Measure(
                    MeasureId("m|1\n"),
                    Meter(3, 4),
                    listOf(event, event.copy(id = EventId("e2"), lyricIndex = null)),
                ),
                Measure(MeasureId("m2"), Meter(6, 8)),
            )
        assertEquals(measures, MeasuresText.decode(MeasuresText.encode(measures)))
        assertEquals(emptyList<Measure>(), MeasuresText.decode(""))
        assertEquals("", MeasuresText.encode(emptyList()))
    }

    @Test
    public fun corruptTextIsNeverHalfRead() {
        for (bad in listOf("x", "a|4/4", "a|4/3|", "a|4/4|e,0,1,C,major,,", "a|4/4|e,0,0/0,C,major,,,")) {
            assertTrue(bad, runCatching { MeasuresText.decode(bad) }.isFailure)
        }
    }
}
