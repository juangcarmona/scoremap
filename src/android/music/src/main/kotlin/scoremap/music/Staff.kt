package scoremap.music

private const val MAJOR_TO_MINOR_FIFTHS = 3
private const val FIFTHS_PER_ACCIDENTAL = 7
private const val MAX_FIFTHS = 7
private const val STEPS_PER_OCTAVE = 7
private const val MIDDLE_C = 60

/** Diatonic position of the bottom line: E4 for the treble staff, G2 for the bass staff. */
private const val TREBLE_BOTTOM = 4 * STEPS_PER_OCTAVE + 2
private const val BASS_BOTTOM = 2 * STEPS_PER_OCTAVE + 4
private const val TOP_LINE = 8
private const val LEDGER_STEP = 2
private const val BASS_SHIFT = 2
private const val FIRST_SHARP = 8
private const val HIGHEST_SHARP = 9
private const val FIRST_FLAT = 4
private const val HIGHEST_FLAT = 7
private const val FIFTH = 4
private const val FOURTH = 3
private const val SHARP_PATTERN = "FCGDAEB"
private const val FLAT_PATTERN = "BEADGCF"
private const val LETTERS = "CDEFGAB"
private val SHARP_NAMES = "C C# D D# E F F# G G# A A# B".split(" ")

/** Treble and bass staves of a grand staff. */
public enum class Clef { TREBLE, BASS }

/** A written accidental in front of a note. */
public enum class Accidental(
    public val symbol: String,
) {
    SHARP("♯"),
    FLAT("♭"),
    NATURAL("♮"),
    DOUBLE_SHARP("x"),
    DOUBLE_FLAT("♭♭"),
}

/** A key signature: its count of sharps (positive) or flats (negative) and the letters they alter. */
public data class KeySignature(
    val fifths: Int,
) {
    init {
        if (kotlin.math.abs(fifths) >
            MAX_FIFTHS
        ) {
            throw MusicRuleViolation("A key signature has at most seven accidentals.")
        }
    }

    /** The accidental this key puts on a letter: +1, -1 or 0. */
    public fun alteration(letter: Char): Int =
        when {
            fifths > 0 && SHARP_PATTERN.take(fifths).contains(letter) -> 1
            fifths < 0 && FLAT_PATTERN.take(-fifths).contains(letter) -> -1
            else -> 0
        }

    /** The altered letters in the order they are written. */
    public val letters: String get() = if (fifths >= 0) SHARP_PATTERN.take(fifths) else FLAT_PATTERN.take(-fifths)

    /** Where the signature's accidentals sit on a clef, in the order they are written (0 = bottom line). */
    public fun positions(clef: Clef): List<Int> {
        val sharp = fifths > 0
        val shift = if (clef == Clef.TREBLE) 0 else BASS_SHIFT
        var position = if (sharp) FIRST_SHARP else FIRST_FLAT
        return (0 until kotlin.math.abs(fifths)).map {
            val here = position - shift
            position = next(position, sharp)
            here
        }
    }

    private fun next(
        position: Int,
        sharp: Boolean,
    ): Int =
        if (sharp) {
            if (position + FIFTH <= HIGHEST_SHARP) position + FIFTH else position - FOURTH
        } else {
            if (position + FOURTH <= HIGHEST_FLAT) position + FOURTH else position - FIFTH
        }

    public companion object {
        /** The signature of a declared key, or null for a theoretical key beyond seven accidentals. */
        public fun of(
            tonic: SpelledNote,
            minor: Boolean,
        ): KeySignature? {
            val major = SHARP_PATTERN.indexOf(tonic.letter) - 1 + FIFTHS_PER_ACCIDENTAL * tonic.accidentals
            val fifths = if (minor) major - MAJOR_TO_MINOR_FIFTHS else major
            return if (kotlin.math.abs(fifths) <= MAX_FIFTHS) KeySignature(fifths) else null
        }
    }
}

/** One note placed on the grand staff; [position] counts diatonic steps above the bottom line of its clef. */
public data class StaffNote(
    val midi: Int,
    val label: String,
    val clef: Clef,
    val position: Int,
    val accidental: Accidental?,
    /** Positions (even numbers) of the ledger lines the note needs, nearest the staff first. */
    val ledgerLines: List<Int>,
)

/** The notes of a grand staff and the key signature to draw, if any. No duration or rhythm is ever implied. */
public data class StaffView(
    val key: KeySignature?,
    val notes: List<StaffNote>,
)

/** Lays exact pitches out on a grand staff using the declared key, or none when it is unknown. */
public object Staff {
    public fun layout(
        midis: List<Int>,
        key: KeySignature?,
    ): StaffView = StaffView(key, midis.map { note(it, key) })

    /** The spelling of a pitch for a key: sharps in sharp keys, flats otherwise, as the key signature implies. */
    public fun spell(
        midi: Int,
        key: KeySignature?,
    ): SpelledNote {
        val flat = PerformedPitch.at(midi).spelling
        if (key == null || key.fifths <= 0 || flat.accidentals == 0) return flat
        return SpelledNote.parse(SHARP_NAMES[midi % SEMITONES_PER_OCTAVE])
    }

    private fun note(
        midi: Int,
        key: KeySignature?,
    ): StaffNote {
        val spelling = spell(midi, key)
        val octave = PerformedPitch.at(midi, spelling).octave
        val step = octave * STEPS_PER_OCTAVE + LETTERS.indexOf(spelling.letter)
        val clef = if (midi >= MIDDLE_C) Clef.TREBLE else Clef.BASS
        val position = step - if (clef == Clef.TREBLE) TREBLE_BOTTOM else BASS_BOTTOM
        val expected = key?.alteration(spelling.letter) ?: 0
        return StaffNote(
            midi,
            "$spelling$octave",
            clef,
            position,
            accidental(spelling.accidentals, expected),
            ledger(position),
        )
    }

    private fun accidental(
        actual: Int,
        expected: Int,
    ): Accidental? =
        when {
            actual == expected -> null
            actual == 0 -> Accidental.NATURAL
            actual == 1 -> Accidental.SHARP
            actual == -1 -> Accidental.FLAT
            actual > 1 -> Accidental.DOUBLE_SHARP
            else -> Accidental.DOUBLE_FLAT
        }

    private fun ledger(position: Int): List<Int> =
        when {
            position < 0 -> (-LEDGER_STEP downTo position step LEDGER_STEP).toList()
            position > TOP_LINE -> ((TOP_LINE + LEDGER_STEP)..position step LEDGER_STEP).toList()
            else -> emptyList()
        }
}
