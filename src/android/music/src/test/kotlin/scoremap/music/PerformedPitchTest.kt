package scoremap.music

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

public class PerformedPitchTest {
    @Test
    public fun reproducesEveryIndependentLiteralFixture() {
        val lines =
            requireNotNull(javaClass.getResourceAsStream("/fixtures/pitch.txt"))
                .bufferedReader()
                .readLines()
                .filter { it.isNotBlank() && !it.startsWith("#") }
        assertTrue(lines.size >= 16)
        for (line in lines) {
            val (input, expected) = line.split(" => ")
            val tokens = input.split(" ")
            val midi = tokens[0].toInt()
            val spelling = tokens.getOrNull(1)?.let { SpelledNote.parse(it) }
            if (expected == "refused") {
                assertThrows(line, MusicRuleViolation::class.java) { PerformedPitch.at(midi, spelling) }
            } else {
                val pitch = PerformedPitch.at(midi, spelling)
                assertEquals(line, expected, "${pitch.spelling} ${pitch.octave}")
                assertEquals(midi, pitch.midi)
            }
        }
    }

    @Test
    public fun keepsSpellingSeparateFromPitchEquivalence() {
        val sharp = PerformedPitch.at(61, SpelledNote.parse("C#"))
        val flat = PerformedPitch.at(61, SpelledNote.parse("Db"))
        assertEquals(sharp.midi, flat.midi)
        assertEquals(sharp.spelling.pitchClass, flat.spelling.pitchClass)
        assertTrue(sharp != flat)
    }

    @Test
    public fun validatesAnInclusiveRangeInsideTheDeviceRange() {
        val device = PitchRange(36, 96)
        assertTrue(PitchRange(36, 96).within(device))
        assertTrue(PitchRange(60, 60).within(device))
        assertTrue(!PitchRange(35, 60).within(device))
        assertTrue(!PitchRange(60, 97).within(device))
        assertThrows(MusicRuleViolation::class.java) { PitchRange(61, 60) }
        assertThrows(MusicRuleViolation::class.java) { PitchRange(-1, 60) }
        assertThrows(MusicRuleViolation::class.java) { PitchRange(0, 128) }
    }
}
