package scoremap.feature.library

import scoremap.library.IdSource
import scoremap.library.Library
import scoremap.library.LibraryCommands
import scoremap.library.LibraryService
import scoremap.library.Mode
import scoremap.library.Outcome
import scoremap.library.RetentionCommands
import scoremap.library.SectionId
import scoremap.library.SheetCommands
import scoremap.library.SongId
import scoremap.library.SongKey

/** A chord in a measure: its symbol, exact start and length in beats, and the lyric position it is linked to. */
public data class EventItem(
    val id: String,
    val symbol: String,
    val start: String,
    val duration: String,
    val lyricIndex: Int?,
    /** True when a part plays a voicing for this chord. */
    val voiced: Boolean = false,
)

public data class MeasureItem(
    val id: String,
    val meter: String,
    val events: List<EventItem>,
)

public data class SectionItem(
    val id: String,
    val name: String,
    val repeats: Int,
    /** Empty when no lyrics were entered. */
    val lyrics: String = "",
    /** Empty when no cue was entered. */
    val cue: String = "",
    val measures: List<MeasureItem> = emptyList(),
)

/** One retained revision of the song, as listed in its history. */
public data class RevisionItem(
    val number: Long,
    val name: String,
    val sectionCount: Int,
)

/** A PDF attached to the song, with the page the musician last viewed. */
public data class AttachmentItem(
    val id: String,
    val name: String,
    val pages: Int,
    val lastPage: Int,
    val sha256: String,
)

public data class SongDetailState(
    val id: String,
    val name: String,
    val revision: Long,
    val sections: List<SectionItem>,
    val revisions: List<RevisionItem>,
    val attachments: List<AttachmentItem>,
    val notice: Notice?,
    /** The declared key such as "F# minor"; null while unknown. */
    val key: String? = null,
    val parts: List<PartItem> = emptyList(),
    /** Every chord of the song, so a part's voicing can be chosen for it. */
    val chords: List<ChordChoice> = emptyList(),
)

/** One song's structure and retained history: rename, add sections and restore any earlier revision. */
public class SongDetailModel(
    private val service: LibraryService,
    private val ids: IdSource,
    private val commandIds: IdSource,
) {
    /** Null when the song is not an active song of the library. */
    public fun load(
        songId: String,
        notice: Notice? = null,
    ): SongDetailState? {
        val library = service.current().library
        val song = library.songs.firstOrNull { it.id.value == songId } ?: return null
        val voiced = song.parts.flatMap { p -> p.voicings.map { it.eventId } }.toSet()
        return SongDetailState(
            song.id.value,
            song.name,
            song.revision,
            song.sections.map { sectionItem(it, voiced) },
            RetentionCommands.history(library, song.id).map { RevisionItem(it.number, it.name, it.sections.size) },
            song.attachments.map { AttachmentItem(it.id.value, it.name, it.pages, it.lastPage, it.sha256) },
            notice,
            song.key?.label,
            partItems(song),
            chordChoices(song),
        )
    }

    /** Empty text clears the key; text that is not a key is refused without changing the song. */
    public fun setKey(
        songId: String,
        text: String,
        mode: Mode,
    ): SongDetailState? {
        val key = SongKey.parse(text.trim())
        if (text.isNotBlank() && key == null) return load(songId, Notice.INVALID_KEY)
        return run(songId, Notice.SHEET_SAVED) { SheetCommands.setKey(it, mode, SongId(songId), key) }
    }

    public fun setLyrics(
        songId: String,
        sectionId: String,
        text: String,
        mode: Mode,
    ): SongDetailState? =
        run(songId, Notice.SHEET_SAVED) {
            SheetCommands.setLyrics(it, mode, SongId(songId), SectionId(sectionId), text)
        }

    public fun setCue(
        songId: String,
        sectionId: String,
        text: String,
        mode: Mode,
    ): SongDetailState? =
        run(songId, Notice.SHEET_SAVED) { SheetCommands.setCue(it, mode, SongId(songId), SectionId(sectionId), text) }

    public fun rename(
        songId: String,
        name: String,
        mode: Mode,
    ): SongDetailState? =
        run(songId, Notice.RENAMED) { LibraryCommands.renameSong(it, mode, SongId(songId), name, revision(it, songId)) }

    public fun addSection(
        songId: String,
        name: String,
        mode: Mode,
    ): SongDetailState? =
        run(songId, Notice.SECTION_ADDED) { LibraryCommands.insertSection(it, mode, SongId(songId), name, ids) }

    public fun restoreRevision(
        songId: String,
        number: Long,
        mode: Mode,
    ): SongDetailState? =
        run(songId, Notice.REVISION_RESTORED) {
            RetentionCommands.restoreRevision(it, mode, SongId(songId), number, revision(it, songId))
        }

    private fun revision(
        library: Library,
        songId: String,
    ): Long = library.songs.firstOrNull { it.id.value == songId }?.revision ?: 0

    private fun run(
        songId: String,
        success: Notice,
        command: (Library) -> Outcome<Library>,
    ): SongDetailState? = load(songId, resultNotice(service.execute(commandIds.next(), command), success))
}
