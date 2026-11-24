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
public enum class Notice {
    CREATED,
    DELETED,
    RESTORED,
    INVALID_NAME,
    EDIT_MODE_REQUIRED,
    CONFLICT,
    STORAGE_FAILED,
    FAILED,
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
    ): LibraryScreenState =
        load(
            mode,
            when (val result = service.execute(commandIds.next(), command)) {
                is ServiceResult.Acknowledged -> success
                is ServiceResult.Refused -> notice(result.refusal)
                is ServiceResult.Conflict -> Notice.CONFLICT
                is ServiceResult.StorageFailed -> Notice.STORAGE_FAILED
            },
        )

    private fun notice(refusal: Refusal): Notice =
        when (refusal) {
            Refusal.PERFORMANCE_MODE -> Notice.EDIT_MODE_REQUIRED
            Refusal.INVALID_NAME -> Notice.INVALID_NAME
            else -> Notice.FAILED
        }

    private fun item(song: scoremap.library.Song): SongItem = SongItem(song.id.value, song.name, song.revision)
}
