package scoremap.music

import java.util.Collections

internal fun <T> owned(values: List<T>): List<T> = Collections.unmodifiableList(ArrayList(values))

internal fun <T> requireUnique(
    values: List<T>,
    identity: (T) -> MusicId,
) {
    require(values.map(identity).distinct().size == values.size) { "Duplicate musical identity." }
}

@JvmInline
public value class MusicId(
    public val value: String,
) {
    init {
        require(value.isNotBlank()) { "A musical identity must be nonblank." }
    }
}

public enum class Hand { LEFT, RIGHT, BOTH, CONTEXTUAL, UNASSIGNED }

public enum class Letter(
    public val semitone: Int,
) {
    C(0),
    D(2),
    E(E_SEMITONE),
    F(F_SEMITONE),
    G(G_SEMITONE),
    A(A_SEMITONE),
    B(B_SEMITONE),
}

public data class Spelling(
    public val letter: Letter,
    public val accidental: Int = 0,
) {
    public val pitchClass: Int get() = Math.floorMod(letter.semitone.toLong() + accidental, SEMITONES_PER_OCTAVE)

    public override fun toString(): String =
        letter.name + if (accidental >= 0) "#".repeat(accidental) else "b".repeat(-accidental)
}

public data class Pitch(
    public val spelling: Spelling,
    public val octave: Int,
    public val absolute: Int,
) {
    init {
        require(absolute in 0..MAXIMUM_MIDI_PITCH) { "Absolute pitch must lie in 0..MAXIMUM_MIDI_PITCH." }
        require(
            (octave.toLong() + 1) * SEMITONES_PER_OCTAVE + spelling.letter.semitone + spelling.accidental ==
                absolute.toLong(),
        ) {
            "Written pitch and absolute pitch disagree."
        }
    }
}

public data class PitchRange(
    public val low: Int,
    public val high: Int,
) {
    init {
        require(low in 0..MAXIMUM_MIDI_PITCH && high in low..MAXIMUM_MIDI_PITCH) { "Invalid inclusive pitch range." }
    }

    public operator fun contains(pitch: Pitch): Boolean = pitch.absolute in low..high
}

public data class Meter(
    public val numerator: Int = QUARTERS_PER_WHOLE,
    public val denominator: Int = QUARTERS_PER_WHOLE,
) {
    init {
        require(numerator > 0 && denominator > 0 && denominator and (denominator - 1) == 0) { "Invalid meter." }
    }

    public val quarterLength: Rational get() =
        Rational.of(
            numerator.toLong() * QUARTERS_PER_WHOLE,
            denominator.toLong(),
        )
}

public data class Timing(
    public val start: Rational,
    public val duration: Rational,
) {
    init {
        require(start >= Rational.of(0) && duration > Rational.of(0)) { "Invalid event timing." }
    }

    public fun validateWithin(meter: Meter): Unit = validateWithin(meter.quarterLength)

    public fun validateWithin(length: Rational) {
        require(
            length > Rational.of(0) && start < length && start + duration <= length,
        ) { "Event crosses measure end." }
    }
}

public sealed interface Key {
    public data object Unknown : Key

    public data class Known(
        public val tonic: Spelling,
        public val mode: String,
    ) : Key {
        init {
            require(mode.isNotBlank()) { "A known key needs a mode." }
        }
    }
}
