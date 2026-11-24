package scoremap.feature.library

import scoremap.library.Confirmation
import scoremap.library.IdSource
import scoremap.library.Library
import scoremap.library.LibraryService
import scoremap.library.Mode
import scoremap.library.MusicSet
import scoremap.library.Outcome
import scoremap.library.SetCommands
import scoremap.library.SetId
import scoremap.library.SongId

/** One ordered set with its member songs in order. */
public data class SetItem(
    val id: String,
    val name: String,
    val revision: Long,
    val members: List<SongItem>,
)

public data class SetsScreenState(
    val sets: List<SetItem>,
    val deleted: List<SetItem>,
    val songs: List<SongItem>,
    val notice: Notice?,
)

/** Ordered sets: create, change members and order, recoverably delete and restore. */
public class SetsScreenModel(
    private val service: LibraryService,
    private val ids: IdSource,
    private val commandIds: IdSource,
) {
    public fun load(notice: Notice? = null): SetsScreenState {
        val library = service.current().library
        val songs = library.songs.associateBy { it.id }

        fun item(set: MusicSet) =
            SetItem(
                set.id.value,
                set.name,
                set.revision,
                set.songIds.mapNotNull { songs[it] }.map { SongItem(it.id.value, it.name, it.revision) },
            )
        return SetsScreenState(
            library.sets.map(::item),
            library.deletedSets.map(::item),
            library.songs.map { SongItem(it.id.value, it.name, it.revision) },
            notice,
        )
    }

    public fun createSet(
        name: String,
        mode: Mode,
    ): SetsScreenState = run(Notice.SET_CREATED) { SetCommands.createSet(it, mode, name, ids) }

    public fun deleteSet(
        id: String,
        mode: Mode,
    ): SetsScreenState = run(Notice.SET_DELETED) { SetCommands.deleteSet(it, mode, SetId(id), activeRevision(it, id)) }

    public fun restoreSet(
        id: String,
        mode: Mode,
    ): SetsScreenState =
        run(Notice.SET_RESTORED) {
            val revision = it.deletedSets.firstOrNull { set -> set.id.value == id }?.revision ?: 0
            SetCommands.restoreSet(it, mode, SetId(id), revision, Confirmation.Confirmed)
        }

    public fun addMember(
        setId: String,
        songId: String,
        mode: Mode,
    ): SetsScreenState = changeMembers(setId, mode) { it + SongId(songId) }

    public fun removeMember(
        setId: String,
        songId: String,
        mode: Mode,
    ): SetsScreenState = changeMembers(setId, mode) { members -> members.filterNot { it.value == songId } }

    /** Moves a member one place up (-1) or down (+1); an end position stays where it is. */
    public fun moveMember(
        setId: String,
        songId: String,
        direction: Int,
        mode: Mode,
    ): SetsScreenState =
        changeMembers(setId, mode) { members ->
            val from = members.indexOfFirst { it.value == songId }
            val to = from + direction
            if (from < 0 || to !in members.indices) {
                members
            } else {
                members.toMutableList().also { it.add(to, it.removeAt(from)) }
            }
        }

    private fun changeMembers(
        setId: String,
        mode: Mode,
        change: (List<SongId>) -> List<SongId>,
    ): SetsScreenState =
        run(Notice.MEMBERS_CHANGED) { library ->
            val set = library.sets.firstOrNull { it.id.value == setId }
            SetCommands.setMembers(library, mode, SetId(setId), set?.revision ?: 0, change(set?.songIds.orEmpty()))
        }

    private fun activeRevision(
        library: Library,
        id: String,
    ): Long = library.sets.firstOrNull { it.id.value == id }?.revision ?: 0

    private fun run(
        success: Notice,
        command: (Library) -> Outcome<Library>,
    ): SetsScreenState = load(resultNotice(service.execute(commandIds.next(), command), success))
}
