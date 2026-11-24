package scoremap.library

/**
 * Edits of the song sheet: the declared key, section lyrics and section cues. All are optional, guarded by
 * edit mode first, and each real change is one revision; repeating a value changes nothing.
 */
public object SheetCommands {
    public const val MAX_LYRICS: Int = 4000
    public const val MAX_CUE: Int = 200

    public fun setKey(
        library: Library,
        mode: Mode,
        songId: SongId,
        key: SongKey?,
    ): Outcome<Library> =
        guarded(mode) {
            val song = library.songs.firstOrNull { it.id == songId } ?: return@guarded refused(Refusal.UNKNOWN_SONG)
            if (song.key == key) accepted(library) else accepted(library.revise(song.copy(key = key)))
        }

    public fun setLyrics(
        library: Library,
        mode: Mode,
        songId: SongId,
        sectionId: SectionId,
        text: String,
    ): Outcome<Library> =
        setText(library, mode, TextEdit(songId, sectionId, text, MAX_LYRICS) { s, value -> s.copy(lyrics = value) })

    public fun setCue(
        library: Library,
        mode: Mode,
        songId: SongId,
        sectionId: SectionId,
        text: String,
    ): Outcome<Library> =
        setText(library, mode, TextEdit(songId, sectionId, text, MAX_CUE) { s, value -> s.copy(cue = value) })

    private class TextEdit(
        val songId: SongId,
        val sectionId: SectionId,
        val raw: String,
        val limit: Int,
        val write: (Section, String) -> Section,
    )

    private fun setText(
        library: Library,
        mode: Mode,
        edit: TextEdit,
    ): Outcome<Library> =
        guarded(mode) {
            val song =
                library.songs.firstOrNull { it.id == edit.songId } ?: return@guarded refused(Refusal.UNKNOWN_SONG)
            if (song.sections.none { it.id == edit.sectionId }) return@guarded refused(Refusal.UNKNOWN_SECTION)
            val value = normalised(edit.raw)
            if (value.length > edit.limit) return@guarded refused(Refusal.TEXT_TOO_LONG)
            val sections = song.sections.map { if (it.id == edit.sectionId) edit.write(it, value) else it }
            if (sections ==
                song.sections
            ) {
                accepted(library)
            } else {
                accepted(library.revise(song.copy(sections = sections)))
            }
        }

    /** Line endings become `\n`; surrounding blank space is dropped, so blank text is absent. */
    private fun normalised(raw: String): String = raw.replace("\r\n", "\n").replace('\r', '\n').trim()

    private fun guarded(
        mode: Mode,
        command: () -> Outcome<Library>,
    ): Outcome<Library> = if (mode == Mode.EDIT) command() else refused(Refusal.PERFORMANCE_MODE)

    private fun accepted(library: Library): Outcome<Library> = Outcome.Accepted(library)

    private fun refused(refusal: Refusal): Outcome<Library> = Outcome.Refused(refusal)
}
