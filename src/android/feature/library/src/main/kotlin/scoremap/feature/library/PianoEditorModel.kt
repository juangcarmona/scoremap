package scoremap.feature.library

import scoremap.library.Hand
import scoremap.library.PerformedNote
import scoremap.music.OctavePalette
import scoremap.music.Piano
import scoremap.music.PianoWindow

private const val DEFAULT_WHITE_KEYS = 14
private const val MIDDLE_C = 60

/** One key as it is drawn: its exact label, surface and, when selected, its octave color and hand. */
public data class KeyView(
    val midi: Int,
    val label: String,
    val black: Boolean,
    val color: String?,
    val hand: Hand?,
)

/**
 * The state of the enlarged 88-key keyboard while a voicing is edited: the visible window, the hand being
 * entered and the exact selected notes. Moving the window never changes or drops a selection.
 */
public class PianoEditorModel(
    initial: List<PerformedNote> = emptyList(),
    whiteKeys: Int = DEFAULT_WHITE_KEYS,
) {
    public var window: PianoWindow =
        PianoWindow(Piano.whiteKeys.first().midi, whiteKeys).centeredOn(initial.minOfOrNull { it.midi } ?: MIDDLE_C)
        private set

    public var hand: Hand = Hand.RIGHT
        private set

    private var notes: List<PerformedNote> = initial

    public val selected: List<PerformedNote> get() = notes.sortedWith(compareBy({ it.midi }, { it.hand }))

    /** Selected pitches the window cannot show; they stay selected and are listed with their names. */
    public val hidden: List<String> get() = window.hidden(notes.map { it.midi }).distinct().map(Piano::label)

    public fun chooseHand(hand: Hand) {
        this.hand = hand
    }

    /** Selects the pitch for the current hand, or removes it when that hand already plays it. */
    public fun toggle(midi: Int) {
        val note = PerformedNote(midi, hand)
        notes = if (note in notes) notes - note else notes + note
    }

    public fun shift(whiteKeys: Int) {
        window = window.shifted(whiteKeys)
    }

    public fun jumpTo(midi: Int) {
        window = window.centeredOn(midi)
    }

    /** The keys of the window in order, each with the color of its octave when it is selected. */
    public fun keys(): List<KeyView> =
        Piano.keys.filter { window.contains(it.midi) }.map { key ->
            val played = notes.filter { it.midi == key.midi }
            KeyView(
                key.midi,
                key.name,
                key.black,
                if (played.isEmpty()) null else OctavePalette.colorOf(key.midi),
                played.minByOrNull { it.hand }?.hand,
            )
        }
}
