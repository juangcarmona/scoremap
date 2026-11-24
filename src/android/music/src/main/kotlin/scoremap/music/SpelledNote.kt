package scoremap.music

internal const val SEMITONES_PER_OCTAVE: Int = 12
internal const val LETTERS_PER_SCALE: Int = 7

/** A rule of the musical domain was broken by the supplied value. */
public class MusicRuleViolation(
    message: String,
) : IllegalArgumentException(message)

/** A note name with its own accidentals: spelling is kept apart from pitch equivalence. */
public data class SpelledNote(
    val letter: Char,
    val accidentals: Int,
) {
    init {
        if (letter !in LETTERS) throw MusicRuleViolation("A note letter is A through G.")
    }

    /** Semitone above C within one octave, 0..11. */
    public val pitchClass: Int get() = Math.floorMod(NATURAL.getValue(letter) + accidentals, SEMITONES_PER_OCTAVE)

    public override fun toString(): String =
        letter.toString() + (if (accidentals >= 0) "#" else "b").repeat(kotlin.math.abs(accidentals))

    public companion object {
        private const val LETTERS = "ABCDEFG"
        internal val NATURAL: Map<Char, Int> =
            mapOf(
                'C' to 0,
                'D' to 2,
                'E' to 4,
                'F' to 5,
                'G' to 7,
                'A' to 9,
                'B' to 11,
            )
        private val PATTERN = Regex("^([A-G])(#*|b*)$")

        public fun parse(text: String): SpelledNote {
            val match = PATTERN.matchEntire(text) ?: throw MusicRuleViolation("Unsupported spelled note: '$text'.")
            val accidental = match.groupValues[2]
            return SpelledNote(
                match.groupValues[1].single(),
                if (accidental.startsWith("b")) -accidental.length else accidental.length,
            )
        }

        /** A root or bass: A through G with at most one sharp or flat. */
        public fun parseRoot(text: String): SpelledNote =
            parse(text).also {
                if (kotlin.math.abs(it.accidentals) > 1) throw MusicRuleViolation("A root has at most one accidental.")
            }
    }
}
