package scoremap.feature.library

import scoremap.library.Fraction
import scoremap.library.Hand
import scoremap.library.PerformedNote
import scoremap.library.PhraseItem
import scoremap.music.Piano

/**
 * The state of the phrase editor: ordered notes and rests, the hand and length for the next entry, the selected
 * step and the keyboard window. A length is only stored when the musician supplied one.
 */
public class PhraseEditorModel(
    initial: List<PhraseItem> = emptyList(),
) {
    public val piano: PianoEditorModel = PianoEditorModel(emptyList())

    public var items: List<PhraseItem> = initial
        private set

    public var selected: Int? = null
        private set

    /** The length given to the next note or rest; null while the timing is unknown. */
    public var duration: Fraction? = null
        private set

    public var hand: Hand = Hand.RIGHT
        private set

    init {
        initial.firstNotNullOfOrNull { it.pitch }?.let { piano.jumpTo(it.midi) }
    }

    public fun chooseHand(hand: Hand) {
        this.hand = hand
        piano.chooseHand(hand)
    }

    /** Blank text means unknown timing; anything else must be a positive length in beats. False if refused. */
    public fun setDuration(text: String): Boolean {
        val parsed = if (text.isBlank()) null else Fraction.parse(text)
        val valid = text.isBlank() || (parsed != null && parsed > Fraction.ZERO)
        if (valid) duration = parsed
        return valid
    }

    /** Appends a note in the current hand and selects it. */
    public fun press(midi: Int) {
        append(PhraseItem(PerformedNote(midi, hand), duration))
    }

    public fun addRest() {
        append(PhraseItem(null, duration))
    }

    public fun select(index: Int) {
        if (index !in items.indices) return
        selected = index
        items[index].pitch?.let { piano.jumpTo(it.midi) }
    }

    public fun remove(index: Int) {
        if (index !in items.indices) return
        items = items.filterIndexed { i, _ -> i != index }
        selected = selected?.takeIf { it < items.size }
    }

    /** Moves a step one place earlier ([by] = -1) or later (+1); the order is the order that is saved. */
    public fun move(
        index: Int,
        by: Int,
    ) {
        val target = index + by
        if (index !in items.indices || target !in items.indices) return
        val reordered = items.toMutableList()
        reordered[index] = items[target]
        reordered[target] = items[index]
        items = reordered
        selected = target
    }

    /** The keyboard with the selected step's pitch filled in its octave color and marked with its hand. */
    public fun keys(): List<KeyView> = piano.keys(listOfNotNull(selected?.let { items.getOrNull(it)?.pitch }))

    /** One line per step, such as "1. E4 (right hand), 1/2 beat" or "2. rest". */
    public fun lines(): List<String> = items.mapIndexed { i, item -> "${i + 1}. " + describeStep(item) }

    private fun append(item: PhraseItem) {
        items = items + item
        selected = items.lastIndex
    }
}

/** What a step reads as: its pitch or rest, and its length only when it was supplied. */
internal fun describeStep(item: PhraseItem): String {
    val what =
        item.pitch?.let { "${Piano.label(it.midi)} (${if (it.hand == Hand.LEFT) "left" else "right"} hand)" }
            ?: "rest"
    return what + (item.duration?.let { ", $it beat" + if (it == Fraction.ONE) "" else "s" } ?: ", timing not set")
}
