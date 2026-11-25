package scoremap.feature.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import scoremap.library.Fraction
import scoremap.library.Hand
import scoremap.library.PerformedNote
import scoremap.library.PhraseItem

public class PhraseEditorModelTest {
    @Test
    public fun pressingKeysAppendsNotesInTheChosenHandAndNeverInventsTiming() {
        val model = PhraseEditorModel()
        model.press(76)
        model.chooseHand(Hand.LEFT)
        model.press(48)
        assertEquals(
            listOf(PhraseItem(PerformedNote(76, Hand.RIGHT)), PhraseItem(PerformedNote(48, Hand.LEFT))),
            model.items,
        )
        assertTrue(model.items.all { it.duration == null })
        assertEquals(listOf("1. E5 (right hand), timing not set", "2. C3 (left hand), timing not set"), model.lines())
    }

    @Test
    public fun aSuppliedLengthAppliesToTheNextEntriesAndBlankMeansUnknownAgain() {
        val model = PhraseEditorModel()
        assertTrue(model.setDuration("1/2"))
        model.press(60)
        model.addRest()
        assertTrue(model.setDuration(" "))
        model.press(62)
        assertEquals(
            listOf(Fraction.of(1, 2), Fraction.of(1, 2), null),
            model.items.map { it.duration },
        )
        assertEquals("2. rest, 1/2 beats", model.lines()[1])
        assertTrue(model.setDuration("1"))
        model.press(64)
        assertEquals("4. E4 (right hand), 1 beat", model.lines()[3])
    }

    @Test
    public fun anInvalidLengthIsRefusedAndKeepsTheLastValidOne() {
        val model = PhraseEditorModel()
        model.setDuration("2")
        for (bad in listOf("0", "-1", "x", "1/0", "1.5")) assertFalse(bad, model.setDuration(bad))
        model.press(60)
        assertEquals(Fraction.of(2, 1), model.items.single().duration)
    }

    @Test
    public fun stepsCanBeSelectedReorderedAndRemovedKeepingTheOrderThatIsSaved() {
        val model = PhraseEditorModel()
        listOf(60, 62, 64).forEach(model::press)
        model.move(2, -1)
        assertEquals(listOf(60, 64, 62), model.items.map { it.pitch?.midi })
        assertEquals(1, model.selected)
        model.move(0, -1)
        model.move(2, 1)
        assertEquals(listOf(60, 64, 62), model.items.map { it.pitch?.midi })
        model.remove(0)
        assertEquals(listOf(64, 62), model.items.map { it.pitch?.midi })
        model.select(5)
        assertEquals(0, model.selected?.let { 0 })
        model.remove(9)
        assertEquals(2, model.items.size)
    }

    @Test
    public fun theSelectedStepIsTheOnlyKeyFilledAndTheWindowFollowsIt() {
        val model = PhraseEditorModel()
        model.press(60)
        model.press(100)
        model.select(0)
        val filled = model.keys().filter { it.color != null }
        assertEquals(listOf(60), filled.map { it.midi })
        assertEquals("#c8e6bd", filled.single().color)
        assertEquals(Hand.RIGHT, filled.single().hand)
        model.select(1)
        assertEquals(listOf(100), model.keys().filter { it.color != null }.map { it.midi })
        assertTrue(model.keys().any { it.midi == 100 })
    }

    @Test
    public fun anExistingPhraseLoadsWithNothingSelectedAndItsRegisterInView() {
        val items = listOf(PhraseItem(PerformedNote(96, Hand.RIGHT), Fraction.ONE), PhraseItem(null))
        val model = PhraseEditorModel(items)
        assertNull(model.selected)
        assertEquals(items, model.items)
        assertTrue(model.piano.keys().any { it.midi == 96 })
        assertEquals(emptyList<KeyView>(), model.keys().filter { it.color != null })
    }
}
