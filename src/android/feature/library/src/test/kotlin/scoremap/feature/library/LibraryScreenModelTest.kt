package scoremap.feature.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import scoremap.library.CommitOutcome
import scoremap.library.IdSource
import scoremap.library.Library
import scoremap.library.LibraryService
import scoremap.library.LibraryStore
import scoremap.library.Mode
import scoremap.library.StoredLibrary

public class LibraryScreenModelTest {
    private val store = MemoryStore()
    private val model = LibraryScreenModel(LibraryService(store), Ids("song"), Ids("cmd"))

    @Test
    public fun startsEmptyInEditMode() {
        val state = model.load(Mode.EDIT)
        assertEquals(emptyList<SongItem>(), state.songs)
        assertEquals(emptyList<SongItem>(), state.deleted)
        assertEquals(null, state.notice)
    }

    @Test
    public fun createsASongAndShowsOnlyWhatWasAcknowledged() {
        val state = model.createSong("  Autumn Leaves ", Mode.EDIT)
        assertEquals(listOf("Autumn Leaves"), state.songs.map { it.name })
        assertEquals(Notice.CREATED, state.notice)
        assertEquals(state.songs, model.load(Mode.EDIT).songs)
    }

    @Test
    public fun refusesABlankNameWithoutChangingTheLibrary() {
        model.createSong("Kept", Mode.EDIT)
        val state = model.createSong("   ", Mode.EDIT)
        assertEquals(Notice.INVALID_NAME, state.notice)
        assertEquals(listOf("Kept"), state.songs.map { it.name })
    }

    @Test
    public fun deletesRecoverablyAndRestoresWithANewRevision() {
        val created = model.createSong("Song", Mode.EDIT).songs.single()
        val deleted = model.deleteSong(created.id, Mode.EDIT)
        assertEquals(Notice.DELETED, deleted.notice)
        assertEquals(emptyList<SongItem>(), deleted.songs)
        assertEquals(listOf("Song"), deleted.deleted.map { it.name })
        val restored = model.restoreSong(created.id, Mode.EDIT)
        assertEquals(Notice.RESTORED, restored.notice)
        assertEquals(listOf("Song"), restored.songs.map { it.name })
        assertEquals(2L, restored.songs.single().revision)
    }

    @Test
    public fun performanceModeRefusesEveryActionAndTheStoreIsNeverWritten() {
        val created = model.createSong("Song", Mode.EDIT).songs.single()
        val commits = store.commits
        for (state in listOf(
            model.createSong("Other", Mode.PERFORMANCE),
            model.deleteSong(created.id, Mode.PERFORMANCE),
            model.restoreSong(created.id, Mode.PERFORMANCE),
        )) {
            assertEquals(Notice.EDIT_MODE_REQUIRED, state.notice)
            assertEquals(listOf("Song"), state.songs.map { it.name })
        }
        assertEquals(commits, store.commits)
    }

    @Test
    public fun reportsAStorageFailureAndKeepsThePriorState() {
        model.createSong("Kept", Mode.EDIT)
        store.failNext = true
        val state = model.createSong("Lost", Mode.EDIT)
        assertEquals(Notice.STORAGE_FAILED, state.notice)
        assertEquals(listOf("Kept"), state.songs.map { it.name })
    }

    @Test
    public fun ignoresAnActionOnAnUnknownSong() {
        model.createSong("Song", Mode.EDIT)
        val state = model.deleteSong("missing", Mode.EDIT)
        assertEquals(Notice.FAILED, state.notice)
        assertTrue(state.deleted.isEmpty())
    }

    private class Ids(
        private val prefix: String,
    ) : IdSource {
        private var next = 0

        override fun next(): String = "$prefix-${next++}"
    }

    private class MemoryStore : LibraryStore {
        private var stored = StoredLibrary(Library.empty(), 0)
        private val receipts = mutableMapOf<String, Long>()
        var commits = 0
        var failNext = false

        override fun load(): StoredLibrary = stored

        override fun acknowledged(commandId: String): Long? = receipts[commandId]

        override fun commit(
            commandId: String,
            expectedRevision: Long,
            library: Library,
        ): CommitOutcome =
            if (failNext) {
                failNext = false
                CommitOutcome.Failed("disk full")
            } else {
                stored = StoredLibrary(library, expectedRevision + 1)
                receipts[commandId] = stored.revision
                commits += 1
                CommitOutcome.Committed(stored.revision)
            }
    }
}
