package scoremap.music

private const val LOWEST = 0
private const val HIGHEST = 127
private const val MIDDLE_C_OCTAVE = 4

/** The established default naming of an unspelled pitch uses flats, as the web domain does. */
private const val DEFAULT_NAMES = "C Db D Eb E F Gb G Ab A Bb B"

/** An exact performed pitch (C-1 through G9) with the spelling the musician chose. */
public data class PerformedPitch(
    val midi: Int,
    val spelling: SpelledNote,
    val octave: Int,
) {
    public companion object {
        /** Flat spelling is the default; an explicit spelling must belong to the pitch's key position. */
        public fun at(
            midi: Int,
            spelling: SpelledNote? = null,
        ): PerformedPitch {
            if (midi !in LOWEST..HIGHEST) throw MusicRuleViolation("Performed pitch is outside C-1 through G9.")
            val chosen = spelling ?: SpelledNote.parse(DEFAULT_NAMES.split(" ")[midi % SEMITONES_PER_OCTAVE])
            val reference =
                SEMITONES_PER_OCTAVE * (MIDDLE_C_OCTAVE + 1) + SpelledNote.NATURAL.getValue(chosen.letter) +
                    chosen.accidentals
            if ((midi - reference) % SEMITONES_PER_OCTAVE !=
                0
            ) {
                throw MusicRuleViolation("The selected spelling does not match this key.")
            }
            return PerformedPitch(midi, chosen, MIDDLE_C_OCTAVE + (midi - reference) / SEMITONES_PER_OCTAVE)
        }
    }
}

/** An inclusive physical pitch range such as a device range or a binding range. */
public data class PitchRange(
    val lower: Int,
    val upper: Int,
) {
    init {
        if (lower !in LOWEST..HIGHEST || upper !in LOWEST..HIGHEST || lower > upper) {
            throw MusicRuleViolation("A range needs valid pitches with lower <= upper.")
        }
    }

    public fun within(device: PitchRange): Boolean = lower >= device.lower && upper <= device.upper
}
