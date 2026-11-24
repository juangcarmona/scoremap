package scoremap.music

/** One accepted BR-CHORDS quality: its complete theoretical degrees and accepted symbol aliases. */
public class ChordQuality(
    public val id: String,
    public val degrees: List<String>,
    public val aliases: List<String>,
    public val symbol: String,
)

/**
 * The finite catalogue of BR-CHORDS ($1).
 * Kept equal to the web catalogue by a parity test.
 */
public object HarmonyCatalogue {
    public val qualities: List<ChordQuality> =
        listOf(
            ChordQuality(
                "major",
                listOf("1", "3", "5"),
                listOf("", "maj", "M"),
                "",
            ),
            ChordQuality(
                "minor",
                listOf("1", "b3", "5"),
                listOf("m", "min", "-"),
                "m",
            ),
            ChordQuality(
                "diminished",
                listOf("1", "b3", "b5"),
                listOf("dim", "°"),
                "dim",
            ),
            ChordQuality(
                "augmented",
                listOf("1", "3", "#5"),
                listOf("aug", "+"),
                "aug",
            ),
            ChordQuality(
                "suspended-second",
                listOf("1", "2", "5"),
                listOf("sus2"),
                "sus2",
            ),
            ChordQuality(
                "suspended-fourth",
                listOf("1", "4", "5"),
                listOf("sus4", "sus"),
                "sus4",
            ),
            ChordQuality(
                "fifth",
                listOf("1", "5"),
                listOf("5"),
                "5",
            ),
            ChordQuality(
                "major-sixth",
                listOf("1", "3", "5", "6"),
                listOf("6", "maj6"),
                "6",
            ),
            ChordQuality(
                "minor-sixth",
                listOf("1", "b3", "5", "6"),
                listOf("m6"),
                "m6",
            ),
            ChordQuality(
                "major-sixth-ninth",
                listOf("1", "3", "5", "6", "9"),
                listOf("6/9", "69"),
                "6/9",
            ),
            ChordQuality(
                "minor-sixth-ninth",
                listOf("1", "b3", "5", "6", "9"),
                listOf("m6/9", "m69"),
                "m6/9",
            ),
            ChordQuality(
                "dominant-seventh",
                listOf("1", "3", "5", "b7"),
                listOf("7"),
                "7",
            ),
            ChordQuality(
                "major-seventh",
                listOf("1", "3", "5", "7"),
                listOf("maj7", "M7", "Δ7"),
                "maj7",
            ),
            ChordQuality(
                "minor-seventh",
                listOf("1", "b3", "5", "b7"),
                listOf("m7", "min7"),
                "m7",
            ),
            ChordQuality(
                "half-diminished-seventh",
                listOf("1", "b3", "b5", "b7"),
                listOf("m7b5", "ø7"),
                "m7b5",
            ),
            ChordQuality(
                "diminished-seventh",
                listOf("1", "b3", "b5", "bb7"),
                listOf("dim7", "°7"),
                "dim7",
            ),
            ChordQuality(
                "minor-major-seventh",
                listOf("1", "b3", "5", "7"),
                listOf("mMaj7", "mM7"),
                "mMaj7",
            ),
            ChordQuality(
                "augmented-seventh",
                listOf("1", "3", "#5", "b7"),
                listOf("aug7", "+7"),
                "aug7",
            ),
            ChordQuality(
                "augmented-major-seventh",
                listOf("1", "3", "#5", "7"),
                listOf("augMaj7", "+maj7"),
                "augMaj7",
            ),
            ChordQuality(
                "suspended-second-seventh",
                listOf("1", "2", "5", "b7"),
                listOf("7sus2"),
                "7sus2",
            ),
            ChordQuality(
                "suspended-fourth-seventh",
                listOf("1", "4", "5", "b7"),
                listOf("7sus4", "7sus"),
                "7sus4",
            ),
            ChordQuality(
                "dominant-ninth",
                listOf("1", "3", "5", "b7", "9"),
                listOf("9"),
                "9",
            ),
            ChordQuality(
                "major-ninth",
                listOf("1", "3", "5", "7", "9"),
                listOf("maj9", "M9"),
                "maj9",
            ),
            ChordQuality(
                "minor-ninth",
                listOf("1", "b3", "5", "b7", "9"),
                listOf("m9"),
                "m9",
            ),
            ChordQuality(
                "dominant-eleventh",
                listOf("1", "3", "5", "b7", "9", "11"),
                listOf("11"),
                "11",
            ),
            ChordQuality(
                "major-eleventh",
                listOf("1", "3", "5", "7", "9", "11"),
                listOf("maj11", "M11"),
                "maj11",
            ),
            ChordQuality(
                "minor-eleventh",
                listOf("1", "b3", "5", "b7", "9", "11"),
                listOf("m11"),
                "m11",
            ),
            ChordQuality(
                "dominant-thirteenth",
                listOf("1", "3", "5", "b7", "9", "11", "13"),
                listOf("13"),
                "13",
            ),
            ChordQuality(
                "major-thirteenth",
                listOf("1", "3", "5", "7", "9", "11", "13"),
                listOf("maj13", "M13"),
                "maj13",
            ),
            ChordQuality(
                "minor-thirteenth",
                listOf("1", "b3", "5", "b7", "9", "11", "13"),
                listOf("m13"),
                "m13",
            ),
            ChordQuality(
                "major-added-ninth",
                listOf("1", "3", "5", "9"),
                listOf("add9"),
                "add9",
            ),
            ChordQuality(
                "minor-added-ninth",
                listOf("1", "b3", "5", "9"),
                listOf("madd9", "m(add9)"),
                "madd9",
            ),
        )

    public fun quality(id: String): ChordQuality? = qualities.firstOrNull { it.id == id }

    public fun byAlias(alias: String): ChordQuality? = qualities.firstOrNull { alias in it.aliases }
}
