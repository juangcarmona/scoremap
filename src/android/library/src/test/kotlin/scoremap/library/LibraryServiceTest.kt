package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

public class LibraryServiceTest {
    private val ids = SequentialIds()

    @Test
    public fun acknowledgesOnlyAfterTheStoreCommitsAndASecondServiceSeesTheResult() {
        val store = InMemoryStore()
        val first = LibraryService(store)
        val result = first.execute("cmd-1") { LibraryCommands.createSong(it, Mode.EDIT, "Song", ids) }
        assertEquals(ServiceResult.Acknowledged(revision = 1, replay = false), result)
        // A new service on the same store models a process restart.
        val reopened = LibraryService(store).current()
        assertEquals(listOf("Song"), reopened.library.songs.map { it.name })
        assertEquals(1, reopened.revision)
    }

    @Test
    public fun anIdempotentRetryNeverAppliesTheCommandTwice() {
        val store = InMemoryStore()
        val service = LibraryService(store)
        val command = { library: Library -> LibraryCommands.createSong(library, Mode.EDIT, "Song", ids) }
        service.execute("cmd-1", command)
        val retry = service.execute("cmd-1", command)
        assertEquals(ServiceResult.Acknowledged(revision = 1, replay = true), retry)
        assertEquals(
            1,
            service
                .current()
                .library.songs.size,
        )
        assertEquals(1, store.commits)
    }

    @Test
    public fun aRefusedCommandNeverReachesTheStore() {
        val store = InMemoryStore()
        val service = LibraryService(store)
        val refused = service.execute("cmd-1") { LibraryCommands.createSong(it, Mode.PERFORMANCE, "Song", ids) }
        assertEquals(ServiceResult.Refused(Refusal.PERFORMANCE_MODE), refused)
        assertEquals(0, store.commits)
        assertEquals(0, service.current().revision)
    }

    @Test
    public fun aStorageFailurePreservesDurableDataAndNeverAcknowledgesFalsely() {
        val store = InMemoryStore()
        val service = LibraryService(store)
        service.execute("cmd-1") { LibraryCommands.createSong(it, Mode.EDIT, "Kept", ids) }
        store.failNext = "disk full"
        val failed = service.execute("cmd-2") { LibraryCommands.createSong(it, Mode.EDIT, "Lost", ids) }
        assertEquals(ServiceResult.StorageFailed("disk full"), failed)
        assertEquals(
            listOf("Kept"),
            service
                .current()
                .library.songs
                .map { it.name },
        )
        // After recovery the same command applies exactly once.
        val retried = service.execute("cmd-2") { LibraryCommands.createSong(it, Mode.EDIT, "Lost", ids) }
        assertEquals(ServiceResult.Acknowledged(revision = 2, replay = false), retried)
        assertEquals(
            listOf("Kept", "Lost"),
            service
                .current()
                .library.songs
                .map { it.name },
        )
    }

    @Test
    public fun aConcurrentNewerCommitIsPreservedAndTheStaleCommandIsRejected() {
        val store = InMemoryStore()
        val service = LibraryService(store)
        service.execute("cmd-1") { LibraryCommands.createSong(it, Mode.EDIT, "Base", ids) }
        val other = LibraryService(store)
        val result =
            service.execute("cmd-2") { library ->
                // Another installation or screen commits between this command's load and its commit.
                other.execute("cmd-other") { LibraryCommands.createSong(it, Mode.EDIT, "Newer", ids) }
                LibraryCommands.createSong(library, Mode.EDIT, "Stale", ids)
            }
        assertEquals(ServiceResult.Conflict(currentRevision = 2), result)
        assertEquals(
            listOf("Base", "Newer"),
            service
                .current()
                .library.songs
                .map { it.name },
        )
        assertTrue(store.receipts.contains("cmd-other"))
        assertTrue(!store.receipts.contains("cmd-2"))
    }

    @Test
    public fun lifecycleStateSurvivesTheStoreRoundTrip() {
        val store = InMemoryStore()
        val service = LibraryService(store)
        service.execute("a") { LibraryCommands.createSong(it, Mode.EDIT, "Song", ids) }
        val songId =
            service
                .current()
                .library.songs
                .single()
                .id
        service.execute("b") { RetentionCommands.deleteSong(it, Mode.EDIT, songId, 1) }
        val reopened = LibraryService(store).current().library
        assertEquals(listOf(songId), reopened.deletedSongs.map { it.id })
        assertEquals(1, RetentionCommands.history(reopened, songId).size)
    }

    private class SequentialIds : IdSource {
        private var next = 0

        override fun next(): String = "id-${next++}"
    }

    /** A faithful in-memory store: commits atomically, remembers command receipts, can be told to fail. */
    private class InMemoryStore : LibraryStore {
        private var stored = StoredLibrary(Library.empty(), 0)
        val receipts = mutableSetOf<String>()
        var commits = 0
        var failNext: String? = null

        override fun load(): StoredLibrary = stored

        override fun acknowledged(commandId: String): Long? = if (commandId in receipts) stored.revision else null

        override fun commit(
            commandId: String,
            expectedRevision: Long,
            library: Library,
        ): CommitOutcome {
            val failure = failNext
            failNext = null
            return when {
                failure != null -> {
                    CommitOutcome.Failed(failure)
                }

                stored.revision != expectedRevision -> {
                    CommitOutcome.Stale(stored.revision)
                }

                else -> {
                    stored = StoredLibrary(library, expectedRevision + 1)
                    receipts += commandId
                    commits += 1
                    CommitOutcome.Committed(stored.revision)
                }
            }
        }
    }
}
