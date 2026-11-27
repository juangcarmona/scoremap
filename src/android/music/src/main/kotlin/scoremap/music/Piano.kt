package scoremap.music

private const val FIRST_KEY = 21
private const val LAST_KEY = 108
private const val HIGHEST_MIDI = 127
private const val OCTAVE_GROUP = 3
private val LABEL = Regex("^([A-G])(#|b)?(-?\\d+)$")

/** One character per semitone from C: 1 marks a black key. */
private const val BLACK_PATTERN = "010100101010"

/** One key of the 88-key piano: its exact pitch, its label and its surface. */
public data class PianoKey(
    val midi: Int,
    val name: String,
    val octave: Int,
    val black: Boolean,
)

/** The 88-key instrument A0 (MIDI 21) through C8 (MIDI 108). */
public object Piano {
    public val range: PitchRange = PitchRange(FIRST_KEY, LAST_KEY)

    public val keys: List<PianoKey> = (FIRST_KEY..LAST_KEY).map { key(it) }

    public val whiteKeys: List<PianoKey> = keys.filterNot { it.black }

    /** The scientific-pitch octave of a MIDI note: `floor(midi / 12) - 1`. */
    public fun octaveOf(midi: Int): Int = Math.floorDiv(midi, SEMITONES_PER_OCTAVE) - 1

    public fun isBlack(midi: Int): Boolean = BLACK_PATTERN[Math.floorMod(midi, SEMITONES_PER_OCTAVE)] == '1'

    /** The key for a pitch, or null when the pitch is outside the 88 keys (it is still a valid performed pitch). */
    public fun keyAt(midi: Int): PianoKey? = if (midi in FIRST_KEY..LAST_KEY) keys[midi - FIRST_KEY] else null

    /** A label that keeps pitch and octave independent of color, such as "Bb3". */
    public fun label(midi: Int): String = PerformedPitch.at(midi).let { "${it.spelling}${it.octave}" }

    /**
     * Reads a label such as "C4", "Bb3" or "F#5" back to its MIDI note, accepting any exact pitch from C-1 to G9;
     * null for anything else.
     */
    public fun parseLabel(text: String): Int? {
        val match = LABEL.matchEntire(text.trim())
        val spelling =
            match?.let {
                runCatching {
                    SpelledNote.parse(
                        it.groupValues[1] + it.groupValues[2],
                    )
                }.getOrNull()
            }
        val octave = match?.groupValues?.get(OCTAVE_GROUP)?.toIntOrNull()
        val midi =
            if (spelling != null &&
                octave != null
            ) {
                (octave + 1) * SEMITONES_PER_OCTAVE + spelling.pitchClassFrom()
            } else {
                null
            }
        return midi?.takeIf { it in 0..HIGHEST_MIDI }
    }

    private fun SpelledNote.pitchClassFrom(): Int = SpelledNote.NATURAL.getValue(letter) + accidentals

    private fun key(midi: Int): PianoKey = PianoKey(midi, label(midi), octaveOf(midi), isBlack(midi))
}

/**
 * The enlarged part of the keyboard being shown, always starting and ending on a white key. Moving it never
 * touches stored pitches; selected pitches outside it are still reported.
 */
public data class PianoWindow(
    val firstWhite: Int,
    val whiteCount: Int,
) {
    init {
        val index = Piano.whiteKeys.indexOfFirst { it.midi == firstWhite }
        if (index < 0 || whiteCount < 1 || index + whiteCount > Piano.whiteKeys.size) {
            throw MusicRuleViolation("The window must fit the 88 keys and start on a white key.")
        }
    }

    public val lowest: Int get() = firstWhite

    public val highest: Int get() = Piano.whiteKeys[indexOfFirst() + whiteCount - 1].midi

    public fun contains(midi: Int): Boolean = midi in lowest..highest

    /** Moves by white keys and stops at the ends of the instrument. */
    public fun shifted(whiteKeys: Int): PianoWindow {
        val index = (indexOfFirst() + whiteKeys).coerceIn(0, Piano.whiteKeys.size - whiteCount)
        return PianoWindow(Piano.whiteKeys[index].midi, whiteCount)
    }

    /** The window that shows [midi] as near its middle as the instrument allows. */
    public fun centeredOn(midi: Int): PianoWindow {
        val target = Piano.whiteKeys.indexOfLast { it.midi <= midi.coerceIn(Piano.range.lower, Piano.range.upper) }
        val index = (target - whiteCount / 2).coerceIn(0, Piano.whiteKeys.size - whiteCount)
        return PianoWindow(Piano.whiteKeys[index].midi, whiteCount)
    }

    /** The selected pitches this window cannot show, in pitch order, unchanged. */
    public fun hidden(selected: Collection<Int>): List<Int> = selected.filterNot(::contains).sorted()

    private fun indexOfFirst(): Int = Piano.whiteKeys.indexOfFirst { it.midi == firstWhite }
}

/** The approved octave palette (docs/design/piano-octave-colors.md), as `#rrggbb` text. */
public object OctavePalette {
    private val white =
        listOf("#d8bce9", "#c9c6ed", "#b8d7ee", "#aee0df", "#c8e6bd", "#f4e2a4", "#f5ceaa", "#edbdc1", "#e2c6da")
    private val black =
        listOf("#704190", "#51479c", "#276698", "#116d6e", "#4d7e39", "#8e7021", "#a45d25", "#9a4552")

    /** The color of a key surface, or null for a pitch outside the documented palette. */
    public fun colorOf(midi: Int): String? {
        val octave = Piano.octaveOf(midi)
        val inRange = midi in Piano.range.lower..Piano.range.upper
        return if (!inRange) null else (if (Piano.isBlack(midi)) black else white).getOrNull(octave)
    }
}
