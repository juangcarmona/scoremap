package scoremap.music

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

public class StaffTest {
    private fun key(
        tonic: String,
        minor: Boolean = false,
    ) = KeySignature.of(SpelledNote.parseRoot(tonic), minor)

    @Test
    public fun keySignaturesMatchTheCircleOfFifthsForMajorAndMinorKeys() {
        val majors = mapOf("C" to 0, "G" to 1, "D" to 2, "A" to 3, "E" to 4, "B" to 5, "F#" to 6, "C#" to 7)
        val flats = mapOf("F" to -1, "Bb" to -2, "Eb" to -3, "Ab" to -4, "Db" to -5, "Gb" to -6, "Cb" to -7)
        for ((tonic, fifths) in majors + flats) assertEquals(tonic, fifths, key(tonic)?.fifths)
        val minors =
            mapOf(
                "A" to 0,
                "E" to 1,
                "B" to 2,
                "F#" to 3,
                "C#" to 4,
                "G#" to 5,
                "D#" to 6,
                "A#" to 7,
                "D" to -1,
                "G" to -2,
                "C" to -3,
            )
        for ((tonic, fifths) in minors) assertEquals("$tonic minor", fifths, key(tonic, true)?.fifths)
        assertNull(key("G#"))
        assertNull(key("D#"))
        assertNull(key("Fb", true))
    }

    @Test
    public fun theAlteredLettersFollowTheOrderOfSharpsAndFlats() {
        assertEquals("FCG", KeySignature(3).letters)
        assertEquals("BEA", KeySignature(-3).letters)
        assertEquals("", KeySignature(0).letters)
        assertEquals(listOf(1, 1, 1, 0), "FCGD".map { KeySignature(3).alteration(it) })
        assertEquals(listOf(-1, -1, 0), "BEG".map { KeySignature(-2).alteration(it) })
        assertTrue(runCatching { KeySignature(8) }.isFailure)
    }

    @Test
    public fun notesSitOnTheRightLineOrSpaceOfTheRightClef() {
        val view = Staff.layout(listOf(64, 67, 71, 77, 43, 50, 57, 60), null)
        val byLabel = view.notes.associateBy { it.label }
        assertEquals(Clef.TREBLE to 0, byLabel.getValue("E4").let { it.clef to it.position })
        assertEquals(2, byLabel.getValue("G4").position)
        assertEquals(4, byLabel.getValue("B4").position)
        assertEquals(8, byLabel.getValue("F5").position)
        assertEquals(Clef.BASS to 0, byLabel.getValue("G2").let { it.clef to it.position })
        assertEquals(8, byLabel.getValue("A3").position)
        assertEquals(Clef.BASS to 4, byLabel.getValue("D3").let { it.clef to it.position })
        assertEquals(Clef.TREBLE to -2, byLabel.getValue("C4").let { it.clef to it.position })
    }

    @Test
    public fun ledgerLinesAreListedNearestTheStaffFirstAndOnlyWhereNeeded() {
        val notes = Staff.layout(listOf(60, 57, 81, 84, 79, 36, 28, 64), null).notes.associateBy { it.midi }
        assertEquals(listOf(-2), notes.getValue(60).ledgerLines)
        assertEquals(emptyList<Int>(), notes.getValue(64).ledgerLines)
        assertEquals(emptyList<Int>(), notes.getValue(57).ledgerLines)
        assertEquals(listOf(10), notes.getValue(81).ledgerLines)
        assertEquals(listOf(10, 12), notes.getValue(84).ledgerLines)
        assertEquals(emptyList<Int>(), notes.getValue(79).ledgerLines)
        assertEquals(listOf(-2, -4), notes.getValue(36).ledgerLines)
        assertEquals(listOf(-2, -4, -6, -8), notes.getValue(28).ledgerLines)
    }

    @Test
    public fun accidentalsAppearOnlyWhenTheNoteDiffersFromTheKeySignature() {
        val none = Staff.layout(listOf(61, 62, 70), null).notes
        assertEquals(listOf(Accidental.FLAT, null, Accidental.FLAT), none.map { it.accidental })
        assertEquals(listOf("Db4", "D4", "Bb4"), none.map { it.label })
        val e = Staff.layout(listOf(66, 65, 68), key("E")).notes
        assertEquals(listOf("F#4", "F4", "G#4"), e.map { it.label })
        assertEquals(listOf(null, Accidental.NATURAL, null), e.map { it.accidental })
        val flat = Staff.layout(listOf(70, 71, 69), key("F")).notes
        assertEquals(listOf("Bb4", "B4", "A4"), flat.map { it.label })
        assertEquals(listOf(null, Accidental.NATURAL, null), flat.map { it.accidental })
        assertEquals(
            Accidental.SHARP,
            Staff
                .layout(listOf(61), key("G"))
                .notes
                .single()
                .accidental,
        )
    }

    @Test
    public fun theViewNeverInventsAKeyOrAPitchAndKeepsEveryRequestedNote() {
        val pitches = listOf(0, 21, 60, 108, 127)
        val view = Staff.layout(pitches, null)
        assertNull(view.key)
        assertEquals(pitches, view.notes.map { it.midi })
        assertEquals(emptyList<StaffNote>(), Staff.layout(emptyList(), key("C")).notes)
        assertEquals(KeySignature(2), Staff.layout(emptyList(), key("D")).key)
    }

    @Test
    public fun accidentalsOfASignatureSitWhereEngravingPutsThem() {
        assertEquals(listOf(8, 5, 9, 6, 3, 7, 4), KeySignature(7).positions(Clef.TREBLE))
        assertEquals(listOf(6, 3, 7, 4, 1, 5, 2), KeySignature(7).positions(Clef.BASS))
        assertEquals(listOf(4, 7, 3, 6, 2, 5, 1), KeySignature(-7).positions(Clef.TREBLE))
        assertEquals(listOf(2, 5, 1, 4, 0, 3, -1), KeySignature(-7).positions(Clef.BASS))
        assertEquals(listOf(8, 5), KeySignature(2).positions(Clef.TREBLE))
        assertEquals(listOf(4, 7, 3), KeySignature(-3).positions(Clef.TREBLE))
        assertEquals(emptyList<Int>(), KeySignature(0).positions(Clef.TREBLE))
    }
}
