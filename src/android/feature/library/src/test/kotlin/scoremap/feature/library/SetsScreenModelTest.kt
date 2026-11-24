package scoremap.feature.library

import org.junit.Assert.assertEquals
import org.junit.Test
import scoremap.library.LibraryService
import scoremap.library.Mode

public class SetsScreenModelTest {
    private val store = MemoryStore()
    private val service = LibraryService(store)
    private val songs = LibraryScreenModel(service, Ids("song"), Ids("songcmd"))
    private val sets = SetsScreenModel(service, Ids("set"), Ids("setcmd"))

    private fun twoSongs(): List<SongItem> {
        songs.createSong("Autumn Leaves", Mode.EDIT)
        return songs.createSong("Blue Bossa", Mode.EDIT).songs
    }

    @Test
    public fun createsASetAndListsTheActiveSongsThatCanJoinIt() {
        twoSongs()
        val state = sets.createSet("  Friday ", Mode.EDIT)
        assertEquals(Notice.SET_CREATED, state.notice)
        assertEquals(listOf("Friday"), state.sets.map { it.name })
        assertEquals(listOf("Autumn Leaves", "Blue Bossa"), state.songs.map { it.name })
        assertEquals(Notice.INVALID_NAME, sets.createSet("  ", Mode.EDIT).notice)
    }

    @Test
    public fun addsRemovesAndReordersMembersKeepingEachSongOnce() {
        val (a, b) = twoSongs()
        val setId =
            sets
                .createSet("Friday", Mode.EDIT)
                .sets
                .single()
                .id
        sets.addMember(setId, a.id, Mode.EDIT)
        sets.addMember(setId, b.id, Mode.EDIT)
        assertEquals(
            listOf("Autumn Leaves", "Blue Bossa"),
            sets
                .load()
                .sets
                .single()
                .members
                .map { it.name },
        )
        assertEquals(Notice.FAILED, sets.addMember(setId, a.id, Mode.EDIT).notice)
        sets.moveMember(setId, b.id, -1, Mode.EDIT)
        assertEquals(
            listOf("Blue Bossa", "Autumn Leaves"),
            sets
                .load()
                .sets
                .single()
                .members
                .map { it.name },
        )
        sets.moveMember(setId, b.id, -1, Mode.EDIT)
        assertEquals(
            listOf("Blue Bossa", "Autumn Leaves"),
            sets
                .load()
                .sets
                .single()
                .members
                .map { it.name },
        )
        sets.removeMember(setId, b.id, Mode.EDIT)
        assertEquals(
            listOf("Autumn Leaves"),
            sets
                .load()
                .sets
                .single()
                .members
                .map { it.name },
        )
        assertEquals(2, songs.load(Mode.EDIT).songs.size)
    }

    @Test
    public fun deletingASetKeepsItsSongsAndRestoringItBringsBackItsOrder() {
        val (a, b) = twoSongs()
        val setId =
            sets
                .createSet("Friday", Mode.EDIT)
                .sets
                .single()
                .id
        sets.addMember(setId, b.id, Mode.EDIT)
        sets.addMember(setId, a.id, Mode.EDIT)
        val deleted = sets.deleteSet(setId, Mode.EDIT)
        assertEquals(Notice.SET_DELETED, deleted.notice)
        assertEquals(emptyList<SetItem>(), deleted.sets)
        assertEquals(2, deleted.songs.size)
        val restored = sets.restoreSet(setId, Mode.EDIT)
        assertEquals(Notice.SET_RESTORED, restored.notice)
        assertEquals(
            listOf("Blue Bossa", "Autumn Leaves"),
            restored.sets
                .single()
                .members
                .map { it.name },
        )
    }

    @Test
    public fun aSetWhoseSongWasDeletedCannotBeRestoredUntilTheSongIsBack() {
        val (a, _) = twoSongs()
        val setId =
            sets
                .createSet("Friday", Mode.EDIT)
                .sets
                .single()
                .id
        sets.addMember(setId, a.id, Mode.EDIT)
        sets.deleteSet(setId, Mode.EDIT)
        songs.deleteSong(a.id, Mode.EDIT)
        assertEquals(Notice.MISSING_DEPENDENCY, sets.restoreSet(setId, Mode.EDIT).notice)
        songs.restoreSong(a.id, Mode.EDIT)
        assertEquals(Notice.SET_RESTORED, sets.restoreSet(setId, Mode.EDIT).notice)
    }

    @Test
    public fun performanceModeRefusesEverySetActionWithoutWriting() {
        val (a, _) = twoSongs()
        val setId =
            sets
                .createSet("Friday", Mode.EDIT)
                .sets
                .single()
                .id
        sets.addMember(setId, a.id, Mode.EDIT)
        val commits = store.commits
        val attempts =
            listOf(
                sets.createSet("No", Mode.PERFORMANCE),
                sets.addMember(setId, a.id, Mode.PERFORMANCE),
                sets.removeMember(setId, a.id, Mode.PERFORMANCE),
                sets.moveMember(setId, a.id, 1, Mode.PERFORMANCE),
                sets.deleteSet(setId, Mode.PERFORMANCE),
                sets.restoreSet(setId, Mode.PERFORMANCE),
            )
        for (state in attempts) assertEquals(Notice.EDIT_MODE_REQUIRED, state.notice)
        assertEquals(commits, store.commits)
        assertEquals(
            listOf("Autumn Leaves"),
            sets
                .load()
                .sets
                .single()
                .members
                .map { it.name },
        )
    }

    @Test
    public fun aStorageFailureKeepsThePriorSets() {
        sets.createSet("Kept", Mode.EDIT)
        store.failNext = true
        val state = sets.createSet("Lost", Mode.EDIT)
        assertEquals(Notice.STORAGE_FAILED, state.notice)
        assertEquals(listOf("Kept"), state.sets.map { it.name })
    }
}
