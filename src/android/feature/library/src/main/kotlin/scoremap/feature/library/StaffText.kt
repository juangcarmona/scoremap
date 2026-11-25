package scoremap.feature.library

import scoremap.library.SongKey
import scoremap.music.Clef
import scoremap.music.KeySignature
import scoremap.music.Staff
import scoremap.music.StaffNote

/** The key signature of a declared key label such as "F# minor", or null when the key is unknown or theoretical. */
internal fun keySignatureOf(label: String?): KeySignature? =
    SongKey.parse(label)?.let { KeySignature.of(it.tonic, it.minor) }

/** One column of a staff: the notes sounding together, or one step of a phrase. */
internal fun staffColumn(
    midis: List<Int>,
    key: KeySignature?,
): List<StaffNote> = Staff.layout(midis, key).notes

/**
 * The staff in words, for people who cannot see it: the key signature, then each clef's notes by exact name.
 * It states no duration and no rhythm because the staff shows none.
 */
internal fun staffDescription(
    columns: List<List<StaffNote>>,
    key: KeySignature?,
): String {
    val notes = columns.flatten()

    fun names(clef: Clef) = notes.filter { it.clef == clef }.joinToString(", ") { it.label }.ifEmpty { "none" }
    return "Staff. ${keyText(key)} Treble: ${names(Clef.TREBLE)}. Bass: ${names(Clef.BASS)}. Durations are not shown."
}

private fun keyText(key: KeySignature?): String =
    when {
        key == null -> "Key signature not set."
        key.fifths == 0 -> "Key signature: no sharps or flats."
        key.fifths > 0 -> "Key signature: ${key.fifths} sharp${if (key.fifths > 1) "s" else ""}."
        else -> "Key signature: ${-key.fifths} flat${if (key.fifths < -1) "s" else ""}."
    }
