package scoremap.feature.library

import scoremap.library.Confirmation
import scoremap.library.IdSource
import scoremap.library.Library
import scoremap.library.LibraryCommands
import scoremap.library.LibraryService
import scoremap.library.Mode
import scoremap.library.Outcome
import scoremap.library.Refusal
import scoremap.library.RetentionCommands
import scoremap.library.ServiceResult
import scoremap.library.SongId

/** One song as the screen shows it. */
public data class SongItem(
    val id: String,
    val name: String,
    val revision: Long,
)

/** What the musician is told after an action; the screen maps each to a localized message. */
public enum class Notice(
    public val text: String,
) {
    CREATED("Song created."),
    DELETED("Song deleted. It can be restored."),
    RESTORED("Song restored."),
    INVALID_NAME("Enter a name."),
    EDIT_MODE_REQUIRED("Turn on edit mode to change songs."),
    CONFLICT("The library changed elsewhere. Nothing was saved; try again."),
    STORAGE_FAILED("Could not save. Nothing was changed."),
    FAILED("That could not be done."),
    SET_CREATED("Set created."),
    SET_DELETED("Set deleted. It can be restored."),
    SET_RESTORED("Set restored."),
    MEMBERS_CHANGED("Set updated."),
    MISSING_DEPENDENCY("Restore the songs of this set first."),
    RENAMED("Song renamed."),
    SECTION_ADDED("Section added."),
    MEASURE_ADDED("Measure added."),
    CHORD_ADDED("Chord added."),
    PART_ADDED("Part added."),
    VOICING_SAVED("Voicing saved."),
    PHRASE_ADDED("Phrase added."),
    PHRASE_SAVED("Phrase saved."),
    DEVICE_ADDED("Device added."),
    BOUND("Part bound to the device."),
    INVALID_RANGE("Enter a range such as C3-B4 (lowest to highest), or leave it empty for the whole device."),
    OUT_OF_DEVICE("That range is outside the device. Nothing was changed."),
    EXCLUDES_NOTES(
        "Some played notes are outside this range. Review the range or explicitly keep those notes.",
    ),
    INVALID_DURATION("Enter a length in beats such as 1, 1/2 or 3/2, or leave it empty if the timing is unknown."),
    IN_USE("Performed notes use this. Choose the option that also removes them."),
    REVISION_RESTORED("Revision restored as a new one."),
    PDF_ATTACHED("PDF attached."),
    PDF_UNREADABLE("This PDF cannot be read. Your song was not changed."),
    PDF_TOO_LARGE("This PDF is too large. Your song was not changed."),
    PDF_REMOVED("PDF removed from the song."),
    SHEET_SAVED("Saved."),
    INVALID_KEY("Enter a key such as F# minor or Bb major, or leave it empty to clear it."),
    TEXT_TOO_LONG("That text is too long. Nothing was saved."),
    INVALID_METER("Enter a meter such as 4/4 or 6/8."),
    INVALID_CHORD("Enter a chord such as Dm7, Bb or C/E, optionally followed by its length in beats."),
    NO_ROOM("That chord does not fit in the measure."),
    INVALID_LINK("Enter a position inside the lyrics, or leave it empty to remove the link."),
    LINKED_LYRICS("Some chords are linked beyond the new end of the lyrics. Remove those links first."),
}

/** Immutable screen state: only values, no storage handles and no platform types. */
public data class LibraryScreenState(
    val songs: List<SongItem>,
    val deleted: List<SongItem>,
    val mode: Mode,
    val notice: Notice?,
)

/**
 * The library screen's behaviour. Every action goes through the guarded application commands and the durable
 * store; the state shown is always read back from what was acknowledged.
 */
public class LibraryScreenModel(
    private val service: LibraryService,
    private val ids: IdSource,
    private val commandIds: IdSource,
) {
    public fun load(
        mode: Mode,
        notice: Notice? = null,
    ): LibraryScreenState {
        val library = service.current().library
        return LibraryScreenState(library.songs.map(::item), library.deletedSongs.map(::item), mode, notice)
    }

    public fun createSong(
        name: String,
        mode: Mode,
    ): LibraryScreenState = run(mode, Notice.CREATED) { LibraryCommands.createSong(it, mode, name, ids) }

    /** An unknown id is passed on unchanged, so the application's edit-mode guard still decides first. */
    public fun deleteSong(
        id: String,
        mode: Mode,
    ): LibraryScreenState =
        run(mode, Notice.DELETED) { library ->
            val revision = library.songs.firstOrNull { it.id.value == id }?.revision ?: 0
            RetentionCommands.deleteSong(library, mode, SongId(id), revision)
        }

    public fun restoreSong(
        id: String,
        mode: Mode,
    ): LibraryScreenState =
        run(mode, Notice.RESTORED) { library ->
            val revision = library.deletedSongs.firstOrNull { it.id.value == id }?.revision ?: 0
            RetentionCommands.restoreSong(library, mode, SongId(id), revision, Confirmation.Confirmed)
        }

    private fun run(
        mode: Mode,
        success: Notice,
        command: (Library) -> Outcome<Library>,
    ): LibraryScreenState = load(mode, resultNotice(service.execute(commandIds.next(), command), success))

    private fun item(song: scoremap.library.Song): SongItem = SongItem(song.id.value, song.name, song.revision)
}
