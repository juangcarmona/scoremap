package scoremap.music

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

public class HarmonyRulesTest {
    @Test
    public fun acceptsOnlyARootAThroughGWithAtMostOneAccidental() {
        for (root in listOf("A", "G", "C#", "Bb", "Fb")) HarmonyIdentity.of(root, "major")
        for (bad in listOf("H", "C##", "Bbb", "c", " C", "C ", "", "Db4")) {
            assertThrows(bad, MusicRuleViolation::class.java) { HarmonyIdentity.of(bad, "major") }
        }
    }

    @Test
    public fun spellsAnIndependentBassWithoutChangingTheHarmony() {
        val identity = HarmonyIdentity.of("C", "major", emptyList(), "Db")
        assertEquals(listOf("C", "E", "G"), identity.tones().map { it.spelling.toString() })
        assertEquals("Db", identity.bass.toString())
        assertThrows(MusicRuleViolation::class.java) { HarmonyIdentity.of("C", "major", emptyList(), "C##") }
    }

    @Test
    public fun refusesUnknownQualitiesAndAlterationsOutsideDominantQualities() {
        assertThrows(MusicRuleViolation::class.java) { HarmonyIdentity.of("C", "wobbly") }
        assertThrows(MusicRuleViolation::class.java) { HarmonyIdentity.of("C", "major", listOf("b9")) }
        assertThrows(MusicRuleViolation::class.java) { HarmonyIdentity.of("C", "dominant-seventh", listOf("b6")) }
        assertThrows(MusicRuleViolation::class.java) { HarmonyIdentity.of("C", "dominant-seventh", listOf("b5", "#5")) }
        assertThrows(MusicRuleViolation::class.java) { HarmonyIdentity.of("C", "dominant-seventh", listOf("b9", "b9")) }
    }

    @Test
    public fun retainsMultipleAccidentalsInsteadOfRespellingEnharmonically() {
        val spelled = HarmonyIdentity.of("G#", "diminished-seventh").tones().map { it.spelling.toString() }
        assertEquals(listOf("G#", "B", "D", "F"), spelled)
        val augmented = HarmonyIdentity.of("F#", "augmented").tones().map { it.spelling.toString() }
        assertEquals(listOf("F#", "A#", "C##"), augmented)
    }
}
