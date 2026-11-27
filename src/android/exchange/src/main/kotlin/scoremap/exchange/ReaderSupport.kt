package scoremap.exchange

import scoremap.library.Hand
import scoremap.library.PerformedNote

/** A non-negative whole number that fits an Int, such as a position. */
internal fun indexFrom(value: Json): Int {
    val number = (value as? Json.Integer ?: invalid()).value
    if (number !in 0..Int.MAX_VALUE) invalid()
    return number.toInt()
}

/** An exact performed note: its MIDI pitch and the hand written as "L" or "R". */
internal fun noteFrom(value: Json): PerformedNote {
    val obj = value as? Json.Obj ?: invalid()
    exactly(obj, setOf("midi", "hand"))
    val midi = (obj.fields["midi"] as? Json.Integer ?: invalid()).value
    if (midi !in Int.MIN_VALUE..Int.MAX_VALUE) invalid()
    val hand =
        when (text(obj, "hand")) {
            "L" -> Hand.LEFT
            "R" -> Hand.RIGHT
            else -> invalid()
        }
    return PerformedNote(midi.toInt(), hand)
}
