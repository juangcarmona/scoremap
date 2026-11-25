package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import scoremap.music.Piano
import scoremap.music.PitchRange

public class ArrangementTextTest {
    @Test
    public fun devicesAndBindingsRoundTripIncludingOddNamesAndExactRanges() {
        val devices =
            listOf(
                Device(DeviceId("d|1\n"), "Stage: piano; é", Piano.range),
                Device(DeviceId("d2"), "Mini", PitchRange(48, 84)),
            )
        val bindings =
            listOf(
                Binding(BindingId("b,1"), PartId("p|1"), DeviceId("d|1\n"), PitchRange(21, 59), "Strings | warm"),
                Binding(BindingId("b2"), PartId("p2"), DeviceId("d2"), PitchRange(48, 84)),
            )
        assertEquals(devices to bindings, ArrangementText.decode(ArrangementText.encode(devices, bindings)))
        assertEquals(emptyList<Device>() to emptyList<Binding>(), ArrangementText.decode(""))
        assertEquals("", ArrangementText.encode(emptyList(), emptyList()))
    }

    @Test
    public fun corruptTextIsNeverHalfRead() {
        for (bad in listOf(
            "x",
            "D|a|b",
            "D|a|b|x|2",
            "D|a|b|9|2",
            "B|a|p|d|1",
            "B|a|p|d|1|2",
            "D|a|b|1|2|extra",
            "B|a|p|d|0|200|s",
        )) {
            assertTrue(bad, runCatching { ArrangementText.decode(bad) }.isFailure)
        }
    }

    @Test
    public fun aPartKeepsItsOptionalHandThroughItsTextForm() {
        val parts =
            HandRole.entries.map { Part(PartId("p-$it"), "Part $it", hand = it) } + Part(PartId("none"), "Unassigned")
        assertEquals(parts, PartsText.decode(PartsText.encode(parts)))
        assertEquals(listOf(null), PartsText.decode("p|Old|").map { it.hand })
        assertTrue(runCatching { PartsText.decode("p|n|||SIDEWAYS") }.isFailure)
    }
}
