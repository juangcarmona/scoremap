package scoremap.music

private const val DOUBLE_FLAT = -2

/** The alterations BR-CHORDS accepts on dominant qualities. */
public enum class Alteration(
    public val label: String,
) {
    FLAT_FIVE("b5"),
    SHARP_FIVE("#5"),
    FLAT_NINE("b9"),
    SHARP_NINE("#9"),
    SHARP_ELEVEN("#11"),
    FLAT_THIRTEEN("b13"),
    ;

    public val degreeNumber: Int get() = label.drop(1).toInt()

    public companion object {
        public fun parse(label: String): Alteration =
            entries.firstOrNull { it.label == label } ?: throw MusicRuleViolation("Unsupported alteration '$label'.")
    }
}

/** One theoretical tone: the catalogue degree label, its derived spelling and its pitch class. */
public data class Tone(
    val degree: String,
    val spelling: SpelledNote,
    val pitchClass: Int,
)

/** A spelled, bounded harmony identity. Invalid identities cannot be constructed. */
public class HarmonyIdentity(
    public val root: SpelledNote,
    public val quality: ChordQuality,
    public val alterations: List<Alteration> = emptyList(),
    public val bass: SpelledNote? = null,
) {
    init {
        if (kotlin.math.abs(root.accidentals) > 1) throw MusicRuleViolation("A root has at most one accidental.")
        if (bass != null &&
            kotlin.math.abs(bass.accidentals) > 1
        ) {
            throw MusicRuleViolation("A bass has at most one accidental.")
        }
        if (alterations.isNotEmpty() && !quality.id.startsWith("dominant-")) {
            throw MusicRuleViolation("These alterations are not supported by this chord quality.")
        }
        if (alterations.map { it.degreeNumber }.toSet().size != alterations.size) {
            throw MusicRuleViolation("Choose only one alteration for each degree.")
        }
    }

    /** Catalogue degrees with each alteration replacing its natural degree, ordered by degree number. */
    public fun degrees(): List<String> =
        (
            quality.degrees.filter { degree -> alterations.none { it.degreeNumber == number(degree) } } +
                alterations.map { it.label }
        ).sortedBy { number(it) }

    public fun tones(): List<Tone> = degrees().map { tone(it) }

    private fun tone(degree: String): Tone {
        val parsed = DEGREE.matchEntire(degree) ?: throw MusicRuleViolation("Unsupported catalogue degree '$degree'.")
        val shift =
            when (parsed.groupValues[1]) {
                "bb" -> DOUBLE_FLAT
                "b" -> -1
                "#" -> 1
                else -> 0
            }
        val number = parsed.groupValues[2].toInt()
        val letters = "CDEFGAB"
        val steps = letters.indexOf(root.letter) + number - 1
        val letter = letters[steps % LETTERS_PER_SCALE]
        val natural = SpelledNote.NATURAL.getValue(letter) + SEMITONES_PER_OCTAVE * (steps / LETTERS_PER_SCALE)
        val rootPosition = SpelledNote.NATURAL.getValue(root.letter) + root.accidentals
        val target = rootPosition + BASE.getValue(number) + shift
        return Tone(degree, SpelledNote(letter, target - natural), Math.floorMod(target, SEMITONES_PER_OCTAVE))
    }

    public companion object {
        private val DEGREE = Regex("^(bb|b|#)?(\\d+)$")
        private val BASE = mapOf(1 to 0, 2 to 2, 3 to 4, 4 to 5, 5 to 7, 6 to 9, 7 to 11, 9 to 14, 11 to 17, 13 to 21)

        private fun number(degree: String): Int = degree.filter { it.isDigit() }.toInt()

        public fun of(
            root: String,
            quality: String,
            alterations: List<String> = emptyList(),
            bass: String? = null,
        ): HarmonyIdentity =
            HarmonyIdentity(
                SpelledNote.parseRoot(root),
                HarmonyCatalogue.quality(quality) ?: throw MusicRuleViolation("Unsupported chord quality '$quality'."),
                alterations.map { Alteration.parse(it) },
                bass?.let { SpelledNote.parseRoot(it) },
            )
    }
}
