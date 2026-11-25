package scoremap.feature.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import scoremap.library.Hand
import scoremap.library.PerformedNote

public class PianoEditorModelTest {
    @Test
    public fun startsOnMiddleCWithNothingSelectedAndShowsWholeWhiteKeyPages() {
        val piano = PianoEditorModel()
        assertEquals(emptyList<PerformedNote>(), piano.selected)
        assertTrue(piano.keys().any { it.midi == 60 })
        assertEquals(14, piano.keys().count { !it.black })
        assertEquals(Hand.RIGHT, piano.hand)
    }

    @Test
    public fun selectingKeysRemembersTheHandAndTogglesPerHand() {
        val piano = PianoEditorModel()
        piano.toggle(64)
        piano.chooseHand(Hand.LEFT)
        piano.toggle(48)
        piano.toggle(64)
        assertEquals(
            listOf(PerformedNote(48, Hand.LEFT), PerformedNote(64, Hand.LEFT), PerformedNote(64, Hand.RIGHT)),
            piano.selected,
        )
        piano.toggle(64)
        assertEquals(listOf(PerformedNote(48, Hand.LEFT), PerformedNote(64, Hand.RIGHT)), piano.selected)
    }

    @Test
    public fun aSelectedKeyIsFilledWithItsOctaveColorAndKeepsItsHand() {
        val piano = PianoEditorModel(listOf(PerformedNote(60, Hand.RIGHT), PerformedNote(61, Hand.LEFT)))
        val keys = piano.keys().associateBy { it.midi }
        assertEquals("#c8e6bd", keys.getValue(60).color)
        assertEquals("#4d7e39", keys.getValue(61).color)
        assertEquals(Hand.RIGHT, keys.getValue(60).hand)
        assertEquals("C4", keys.getValue(60).label)
        assertEquals("Db4", keys.getValue(61).label)
        assertNull(keys.getValue(62).color)
        assertNull(keys.getValue(62).hand)
    }

    @Test
    public fun movingTheWindowNeverChangesOrDropsTheSelectionAndReportsHiddenNotes() {
        val piano = PianoEditorModel(listOf(PerformedNote(60, Hand.RIGHT), PerformedNote(21, Hand.LEFT)))
        val before = piano.selected
        assertEquals(listOf("C4"), piano.hidden)
        piano.jumpTo(108)
        assertTrue(piano.keys().any { it.midi == 108 })
        assertEquals(listOf("A0", "C4"), piano.hidden)
        piano.shift(-1000)
        assertTrue(piano.keys().any { it.midi == 21 })
        assertEquals(listOf("C4"), piano.hidden)
        assertEquals(before, piano.selected)
    }

    @Test
    public fun theEndsOfTheInstrumentCanBeSelectedAndExactPitchesSurviveRanges() {
        val piano = PianoEditorModel()
        piano.jumpTo(21)
        piano.toggle(21)
        piano.jumpTo(108)
        piano.chooseHand(Hand.LEFT)
        piano.toggle(108)
        assertEquals(listOf(PerformedNote(21, Hand.RIGHT), PerformedNote(108, Hand.LEFT)), piano.selected)
        assertEquals(emptyList<String>(), PianoEditorModel(piano.selected, 52).hidden)
    }
}
