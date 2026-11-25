package scoremap.feature.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import scoremap.music.KeySignature

public class StaffTextTest {
    @Test
    public fun aKeyLabelBecomesItsSignatureAndUnknownOrTheoreticalKeysHaveNone() {
        assertEquals(KeySignature(2), keySignatureOf("D major"))
        assertEquals(KeySignature(-1), keySignatureOf("D minor"))
        assertEquals(KeySignature(0), keySignatureOf("A minor"))
        assertNull(keySignatureOf(null))
        assertNull(keySignatureOf("G# major"))
        assertNull(keySignatureOf("nonsense"))
    }

    @Test
    public fun theDescriptionNamesKeyClefsAndExactPitchesAndStatesNoDuration() {
        val key = keySignatureOf("E major")
        val columns = listOf(staffColumn(listOf(66, 48), key), staffColumn(listOf(64), key))
        assertEquals(
            "Staff. Key signature: 4 sharps. Treble: F#4, E4. Bass: C3. Durations are not shown.",
            staffDescription(columns, key),
        )
    }

    @Test
    public fun anEmptyStaffAndUnknownKeysAreDescribedHonestly() {
        assertEquals(
            "Staff. Key signature not set. Treble: none. Bass: none. Durations are not shown.",
            staffDescription(emptyList(), null),
        )
        assertEquals(
            "Staff. Key signature: 2 flats. Treble: none. Bass: none. Durations are not shown.",
            staffDescription(emptyList(), keySignatureOf("Bb major")),
        )
        assertEquals(
            "Staff. Key signature: no sharps or flats. Treble: none. Bass: none. Durations are not shown.",
            staffDescription(emptyList(), keySignatureOf("C major")),
        )
        assertEquals(
            "1 flat",
            staffDescription(emptyList(), KeySignature(-1)).substringAfter("signature: ").substringBefore("."),
        )
    }
}
