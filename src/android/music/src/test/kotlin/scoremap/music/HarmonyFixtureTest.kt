package scoremap.music

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

public class HarmonyFixtureTest {
    @Test
    public fun reproducesEveryIndependentLiteralFixture() {
        val cases = fixtureLines("/fixtures/harmony-spelling.txt")
        assertTrue("fixture file must not be empty", cases.size >= 20)
        for (line in cases) {
            val (input, expected) = line.split(" => ")
            val tokens = input.split(" ")
            val alterations =
                tokens
                    .firstOrNull { it.startsWith("[") }
                    ?.trim('[', ']')
                    ?.split(",")
                    .orEmpty()
            val bass = tokens.firstOrNull { it.startsWith("/") }?.removePrefix("/")
            val identity = HarmonyIdentity.of(tokens[0], tokens[1], alterations, bass)
            val actual =
                identity.tones().joinToString(" ") { "${it.degree}=${it.spelling}:${it.pitchClass}" } +
                    (identity.bass?.let { " bass=$it:${it.pitchClass}" } ?: "")
            assertEquals(line, expected, actual)
        }
    }

    @Test
    public fun theCatalogueHasEveryAcceptedQualityWithItsCompleteDegrees() {
        assertEquals(32, HarmonyCatalogue.qualities.size)
        assertEquals(
            32,
            HarmonyCatalogue.qualities
                .map { it.id }
                .toSet()
                .size,
        )
        for (quality in HarmonyCatalogue.qualities) assertEquals(quality.id, "1", quality.degrees.first())
        assertEquals(listOf("1", "b3", "b5", "b7"), HarmonyCatalogue.quality("half-diminished-seventh")?.degrees)
        assertEquals("half-diminished-seventh", HarmonyCatalogue.byAlias("m7b5")?.id)
        assertEquals("major", HarmonyCatalogue.byAlias("")?.id)
        assertEquals("major-sixth-ninth", HarmonyCatalogue.byAlias("6/9")?.id)
        assertEquals(null, HarmonyCatalogue.byAlias("nonsense"))
    }

    private fun fixtureLines(resource: String): List<String> =
        requireNotNull(javaClass.getResourceAsStream(resource)) { "Missing fixture $resource" }
            .bufferedReader()
            .readLines()
            .filter { it.isNotBlank() && !it.startsWith("#") }
}
