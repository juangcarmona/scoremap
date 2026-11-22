package scoremap.music

private val degreeSemitones: Map<Int, Int> =
    mapOf(
        "1" to Letter.C.semitone,
        "2" to Letter.D.semitone,
        "3" to Letter.E.semitone,
        "4" to Letter.F.semitone,
        "5" to Letter.G.semitone,
        "6" to Letter.A.semitone,
        "7" to Letter.B.semitone,
        "9" to SEMITONES_PER_OCTAVE + Letter.D.semitone,
        "11" to SEMITONES_PER_OCTAVE + Letter.F.semitone,
        "13" to SEMITONES_PER_OCTAVE + Letter.A.semitone,
    ).mapKeys { it.key.toInt() }

public data class Degree(
    public val number: Int,
    public val alteration: Int = 0,
) {
    init {
        require(number in degreeSemitones) { "Unsupported chord degree." }
    }

    internal val semitones: Int get() = degreeSemitones.getValue(number) + alteration
}

public enum class ChordQuality(
    internal val formula: List<Degree>,
    internal vararg val suffixes: String,
) {
    MAJOR(degrees("1 3 5"), "", "maj", "M"),
    MINOR(degrees("1 b3 5"), "m", "min", "-"),
    DIMINISHED(degrees("1 b3 b5"), "dim", "°"),
    AUGMENTED(degrees("1 3 #5"), "aug", "+"),
    SUS2(degrees("1 2 5"), "sus2"),
    SUS4(degrees("1 4 5"), "sus4", "sus"),
    FIFTH(degrees("1 5"), "5"),
    MAJOR6(degrees("1 3 5 6"), "6", "maj6"),
    MINOR6(degrees("1 b3 5 6"), "m6"),
    MAJOR69(degrees("1 3 5 6 9"), "6/9", "69"),
    MINOR69(degrees("1 b3 5 6 9"), "m6/9", "m69"),
    DOMINANT7(degrees("1 3 5 b7"), "7"),
    MAJOR7(degrees("1 3 5 7"), "maj7", "M7", "Δ7"),
    MINOR7(degrees("1 b3 5 b7"), "m7", "min7"),
    HALF_DIMINISHED7(degrees("1 b3 b5 b7"), "m7b5", "ø7"),
    DIMINISHED7(degrees("1 b3 b5 bb7"), "dim7", "°7"),
    MINOR_MAJOR7(degrees("1 b3 5 7"), "mMaj7", "mM7"),
    AUGMENTED7(degrees("1 3 #5 b7"), "aug7", "+7"),
    AUGMENTED_MAJOR7(degrees("1 3 #5 7"), "augMaj7", "+maj7"),
    SUS2_7(degrees("1 2 5 b7"), "7sus2"),
    SUS4_7(degrees("1 4 5 b7"), "7sus4", "7sus"),
    DOMINANT9(degrees("1 3 5 b7 9"), "9"),
    MAJOR9(degrees("1 3 5 7 9"), "maj9", "M9"),
    MINOR9(degrees("1 b3 5 b7 9"), "m9"),
    DOMINANT11(degrees("1 3 5 b7 9 11"), "11"),
    MAJOR11(degrees("1 3 5 7 9 11"), "maj11", "M11"),
    MINOR11(degrees("1 b3 5 b7 9 11"), "m11"),
    DOMINANT13(degrees("1 3 5 b7 9 11 13"), "13"),
    MAJOR13(degrees("1 3 5 7 9 11 13"), "maj13", "M13"),
    MINOR13(degrees("1 b3 5 b7 9 11 13"), "m13"),
    ADD9(degrees("1 3 5 9"), "add9"),
    MINOR_ADD9(degrees("1 b3 5 9"), "madd9", "m(add9)"),
    ;

    public companion object {
        public fun fromSuffix(suffix: String): ChordQuality =
            entries.singleOrNull { suffix in it.suffixes } ?: error("Unsupported chord quality: $suffix")
    }
}

private fun degrees(formula: String): List<Degree> =
    formula.split(' ').map { symbol ->
        val prefix = symbol.takeWhile { it == 'b' || it == '#' }
        val alteration = prefix.sumOf { if (it == '#') 1 else -1 }
        Degree(symbol.drop(prefix.length).toInt(), alteration)
    }

public class Chord(
    public val root: Spelling,
    public val quality: ChordQuality,
    alterations: List<Degree> = emptyList(),
    public val bass: Spelling? = null,
) {
    public val alterations: List<Degree> = owned(alterations)

    init {
        require(root.accidental in -1..1) { "Chord roots allow one accidental." }
        require(bass == null || bass.accidental in -1..1) { "Slash bass allows one accidental." }
        require(
            alterations.map { it.number }.distinct().size == alterations.size,
        ) { "Contradictory degree alterations." }
        require(
            alterations.isEmpty() || quality in
                setOf(
                    ChordQuality.DOMINANT7,
                    ChordQuality.DOMINANT9,
                    ChordQuality.DOMINANT11,
                    ChordQuality.DOMINANT13,
                ),
        ) { "Only dominant qualities permit alterations." }
        require(alterations.all { it in allowedAlterations }) { "Unsupported alteration." }
    }

    public val tones: List<Spelling> get() {
        val degrees =
            quality.formula.filter { original -> alterations.none { it.number == original.number } } + alterations
        return owned(degrees.sortedBy { it.number }.map(::spell))
    }

    public fun inversion(index: Int): Spelling {
        require(index in tones.indices) { "Inversion must select a chord tone." }
        return tones[index]
    }

    private fun spell(degree: Degree): Spelling {
        val letter = Letter.entries[(root.letter.ordinal + degree.number - 1) % DIATONIC_LETTERS]
        val naturalDistance = (letter.semitone - root.letter.semitone + SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE
        val accidental =
            degree.semitones - ((degree.number - 1) / DIATONIC_LETTERS) * SEMITONES_PER_OCTAVE - naturalDistance +
                root.accidental
        return Spelling(letter, accidental)
    }

    private companion object {
        val allowedAlterations = degrees("b5 #5 b9 #9 #11 b13").toSet()
    }
}
