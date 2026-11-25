package scoremap.music

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

public class PianoTest {
    @Test
    public fun theInstrumentHasEightyEightKeysFromA0ToC8() {
        assertEquals(88, Piano.keys.size)
        assertEquals(52, Piano.whiteKeys.size)
        assertEquals(PianoKey(21, "A0", 0, false), Piano.keys.first())
        assertEquals(PianoKey(108, "C8", 8, false), Piano.keys.last())
        assertEquals(PianoKey(60, "C4", 4, false), Piano.keyAt(60))
        assertEquals(PianoKey(61, "Db4", 4, true), Piano.keyAt(61))
        assertEquals(PianoKey(22, "Bb0", 0, true), Piano.keyAt(22))
        assertNull(Piano.keyAt(20))
        assertNull(Piano.keyAt(109))
    }

    @Test
    public fun octavesAreScientificPitchOctavesAndBlackKeysFollowThePattern() {
        assertEquals(listOf(-1, 0, 4, 4, 5, 8), listOf(0, 12, 60, 71, 72, 108).map(Piano::octaveOf))
        assertEquals(
            listOf(false, true, false, true, false, false, true, false, true, false, true, false),
            (60..71).map(Piano::isBlack),
        )
        assertEquals(36, Piano.keys.count { it.black })
    }

    @Test
    public fun theOctavePaletteMatchesTheApprovedDesignTable() {
        val whites = mapOf(21 to "#d8bce9", 24 to "#c9c6ed", 36 to "#b8d7ee", 48 to "#aee0df", 60 to "#c8e6bd")
        val more = mapOf(72 to "#f4e2a4", 84 to "#f5ceaa", 96 to "#edbdc1", 108 to "#e2c6da")
        for ((midi, color) in whites + more) assertEquals("white $midi", color, OctavePalette.colorOf(midi))
        val blacks =
            mapOf(22 to "#704190", 25 to "#51479c", 37 to "#276698", 49 to "#116d6e", 61 to "#4d7e39") +
                mapOf(73 to "#8e7021", 85 to "#a45d25", 97 to "#9a4552", 106 to "#9a4552")
        for ((midi, color) in blacks) assertEquals("black $midi", color, OctavePalette.colorOf(midi))
        assertEquals(OctavePalette.colorOf(61), OctavePalette.colorOf(Piano.keyAt(61)!!.midi))
        assertNull(OctavePalette.colorOf(20))
        assertNull(OctavePalette.colorOf(109))
    }

    @Test
    public fun everyKeyHasAColorAndEveryOctaveMatchesItsMidiRange() {
        assertTrue(Piano.keys.all { OctavePalette.colorOf(it.midi) != null })
        for (key in Piano.keys) assertEquals(Math.floorDiv(key.midi, 12) - 1, key.octave)
        assertEquals(setOf(0, 1, 2, 3, 4, 5, 6, 7, 8), Piano.keys.map { it.octave }.toSet())
    }

    @Test
    public fun theWindowStartsAndEndsOnWhiteKeysAndNeverLeavesTheInstrument() {
        val window = PianoWindow(60, 8)
        assertEquals(60, window.lowest)
        assertEquals(72, window.highest)
        assertTrue(window.contains(61))
        assertFalse(window.contains(59))
        assertEquals(PianoWindow(21, 8), PianoWindow(21, 8).shifted(-5))
        assertEquals(108, PianoWindow(21, 8).shifted(1000).highest)
        assertEquals(PianoWindow(62, 8), PianoWindow(60, 8).shifted(1))
        for (bad in listOf(61, 20, 109)) assertTrue(bad.toString(), runCatching { PianoWindow(bad, 7) }.isFailure)
        assertTrue(runCatching { PianoWindow(105, 8) }.isFailure)
        assertTrue(runCatching { PianoWindow(60, 0) }.isFailure)
    }

    @Test
    public fun centeringKeepsTheNoteInViewAndEdgesAreOperable() {
        for (midi in listOf(21, 22, 60, 108)) {
            val window = PianoWindow(60, 14).centeredOn(midi)
            assertTrue(midi.toString(), window.contains(midi))
        }
        assertEquals(21, PianoWindow(60, 14).centeredOn(21).lowest)
        assertEquals(108, PianoWindow(60, 14).centeredOn(108).highest)
    }

    @Test
    public fun selectedPitchesOutsideTheWindowAreReportedNotChanged() {
        val selected = listOf(108, 60, 21, 64, 20)
        val window = PianoWindow(57, 8)
        assertEquals(listOf(20, 21, 108), window.hidden(selected))
        assertEquals(listOf(108, 60, 21, 64, 20), selected)
        assertEquals(emptyList<Int>(), PianoWindow(21, 52).hidden(listOf(21, 60, 108)))
    }

    @Test
    public fun labelsReadBackToTheSameExactPitchWithAnySpelling() {
        for (key in Piano.keys) assertEquals(key.name, key.midi, Piano.parseLabel(key.name))
        assertEquals(61, Piano.parseLabel("C#4"))
        assertEquals(61, Piano.parseLabel(" Db4 "))
        assertEquals(0, Piano.parseLabel("C-1"))
        assertEquals(127, Piano.parseLabel("G9"))
        assertEquals(59, Piano.parseLabel("Cb4"))
        for (bad in listOf(
            "",
            "H4",
            "C",
            "4",
            "C##4",
            "G#9",
            "Ab9x",
            "C 4",
            "c4",
            "A10",
        )) {
            assertNull(bad, Piano.parseLabel(bad))
        }
    }
}
