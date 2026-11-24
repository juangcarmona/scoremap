package scoremap.feature.library

import scoremap.library.IdSource
import scoremap.library.Library
import scoremap.library.LibraryCommands
import scoremap.library.LibraryService
import scoremap.library.Mode
import scoremap.library.Outcome
import scoremap.library.RetentionCommands
import scoremap.library.SongId

public data class SectionItem(
    val id: String,
    val name: String,
    val repeats: Int,
)

/** One retained revision of the song, as listed in its history. */
public data class RevisionItem(
    val number: Long,
    val name: String,
    val sectionCount: Int,
)

public data class SongDetailState(
    val id: String,
    val name: String,
    val revision: Long,
    val sections: List<SectionItem>,
    val revisions: List<RevisionItem>,
    val notice: Notice?,
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
        return SongDetailState(
            song.id.value,
            song.name,
            song.revision,
            song.sections.map { SectionItem(it.id.value, it.name, it.repeats) },
            RetentionCommands.history(library, song.id).map { RevisionItem(it.number, it.name, it.sections.size) },
            notice,
        )
    }

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
