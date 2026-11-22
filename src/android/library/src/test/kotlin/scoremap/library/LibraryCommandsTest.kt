package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import scoremap.library.api.CreateSongCommand
import scoremap.library.api.CreateSongResult
import scoremap.library.api.CreationRefusal
import scoremap.library.api.LibraryCommands
import scoremap.library.model.CreationReceipt
import scoremap.library.model.CreationTransition
import scoremap.library.model.EditMode
import scoremap.library.model.IndependentResource
import scoremap.library.model.LibraryPresence
import scoremap.library.model.LibrarySnapshot
import scoremap.library.model.SongSet
import scoremap.library.port.CommitResult
import scoremap.library.port.CreationWrite
import scoremap.library.port.EditModeReader
import scoremap.library.port.LibraryStore
import scoremap.music.Key
import scoremap.music.MusicId
import scoremap.music.Song
import scoremap.music.SongHeader

public class LibraryCommandsTest {
    @Test
    public fun emptyLibraryReadIsValidAndDoesNotCreateMusic() {
        val store = AcknowledgingStore(emptyLibrary())
        assertEquals(LibraryPresence.EMPTY, store.read().presence)
        assertTrue(store.read().songs.isEmpty())
        assertEquals(0, store.commits)
        assertEquals(7L, store.read().revision)
    }

    @Test
    public fun firstSongAcknowledgesExactCompleteCandidateWithoutInventedMusic() {
        val initial = emptyLibrary()
        val store = AcknowledgingStore(initial)
        val command = command()
        val result = commands(store).createSong(command)
        val receipt = (result as CreateSongResult.Acknowledged).receipt
        assertEquals(CreationTransition.CREATE_FIRST, receipt.transition)
        assertEquals(id("command"), receipt.commandId)
        assertEquals(id("song"), receipt.songId)
        assertEquals(8L, receipt.revision)
        val committed = store.read()
        assertEquals(LibraryPresence.POPULATED, committed.presence)
        assertEquals(1, committed.songs.size)
        assertEquals("The Quiet Atlas", committed.songs[0].title)
        assertEquals("Synthetic", committed.songs[0].artist)
        assertEquals(id("song"), committed.songs[0].id)
        assertTrue(committed.songs[0].sections.isEmpty())
        assertTrue(committed.songs[0].arrangements.isEmpty())
        assertSame(Key.Unknown, committed.songs[0].key)
        assertSame(initial.sets[0], committed.sets[0])
        assertSame(initial.resources[0], committed.resources[0])
        assertEquals(receipt, store.receipts.single())
        assertEquals(1, store.commits)
        assertTrue(initial.songs.isEmpty())
        assertEquals(7L, initial.revision)
    }

    @Test
    public fun directProtectedModeCommandRefusesBeforeAnyStorageAccess() {
        val initial = emptyLibrary()
        val store = AcknowledgingStore(initial)
        val result = commands(store, EditMode.PERFORMANCE).createSong(command())
        assertEquals(CreateSongResult.Refused(CreationRefusal.PROTECTED_MODE), result)
        assertEquals(0, store.reads)
        assertEquals(0, store.commits)
        assertTrue(store.receipts.isEmpty())
        assertSame(initial, store.current)
    }

    @Test
    public fun blankTitleMatrixRefusesWithoutPortMutation() {
        for (title in listOf("", " ", "\n\t  ")) {
            val initial = emptyLibrary()
            val store = AcknowledgingStore(initial)
            val result = commands(store).createSong(command().copy(title = title))
            assertEquals(CreateSongResult.Refused(CreationRefusal.BLANK_TITLE), result)
            assertEquals(0, store.commits)
            assertSame(initial, store.current)
        }
    }

    @Test
    public fun staleExpectedRevisionRefusesWithoutWriting() {
        val initial = emptyLibrary()
        val store = AcknowledgingStore(initial)
        val result = commands(store).createSong(command().copy(expectedRevision = 6))
        assertEquals(CreateSongResult.Refused(CreationRefusal.STALE_REVISION), result)
        assertEquals(0, store.commits)
        assertSame(initial, store.current)
    }

    @Test
    public fun identityCollisionWithAnyLibraryObjectRefuses() {
        for (existing in listOf(id("set"), id("resource"), id("existing-song"))) {
            val initial =
                LibrarySnapshot(
                    7,
                    listOf(Song(id = id("existing-song"), header = SongHeader(title = "Existing"))),
                    emptyLibrary().sets,
                    emptyLibrary().resources,
                )
            val store = AcknowledgingStore(initial)
            val result = commands(store).createSong(command().copy(songId = existing))
            assertEquals(CreateSongResult.Refused(CreationRefusal.IDENTITY_CONFLICT), result)
            assertEquals(0, store.commits)
            assertSame(initial, store.current)
        }
    }

    @Test
    public fun laterCreationPreservesExistingSongAndUsesCreateEdge() {
        val existing = Song(id = id("existing"), header = SongHeader(title = "Existing"))
        val store = AcknowledgingStore(LibrarySnapshot(7, listOf(existing)))
        val result = commands(store).createSong(command()) as CreateSongResult.Acknowledged
        assertEquals(CreationTransition.CREATE, result.receipt.transition)
        assertSame(existing, store.current.songs[0])
        assertEquals(listOf(id("existing"), id("song")), store.current.songs.map { it.id })
    }

    @Test
    public fun atomicPortRefusalPreservesPriorCompleteSnapshotAndReceipts() {
        val initial = emptyLibrary()
        val store = AcknowledgingStore(initial, StoreBehavior.REFUSE)
        val result = commands(store).createSong(command())
        assertEquals(CreateSongResult.Refused(CreationRefusal.STORAGE_REFUSED), result)
        assertEquals(1, store.commits)
        assertSame(initial, store.current)
        assertTrue(store.receipts.isEmpty())
    }

    @Test
    public fun uncertainPortNeverProducesAnAcknowledgementOrAutomaticRetry() {
        val store = AcknowledgingStore(emptyLibrary(), StoreBehavior.UNCERTAIN)
        val result = commands(store).createSong(command())
        assertEquals(CreateSongResult.Unconfirmed(id("command")), result)
        assertEquals(1, store.commits)
        assertTrue(store.receipts.isEmpty())
    }

    @Test
    public fun mismatchedReceiptIsUnconfirmedWithoutPretendingRollback() {
        val store = AcknowledgingStore(emptyLibrary(), StoreBehavior.MISMATCH)
        val result = commands(store).createSong(command())
        assertEquals(CreateSongResult.Unconfirmed(id("command")), result)
        assertEquals(1, store.commits)
        // The deliberately broken adapter committed; the application must not claim refusal preserved durable data.
        assertEquals(LibraryPresence.POPULATED, store.current.presence)
    }

    @Test
    public fun revisionOverflowRefusesWithoutPortMutation() {
        val initial = LibrarySnapshot(Long.MAX_VALUE)
        val store = AcknowledgingStore(initial)
        val result = commands(store).createSong(command().copy(expectedRevision = Long.MAX_VALUE))
        assertEquals(CreateSongResult.Refused(CreationRefusal.REVISION_EXHAUSTED), result)
        assertSame(initial, store.current)
        assertEquals(0, store.commits)
    }

    @Test
    public fun libraryGraphCopiesCollectionsAndRejectsDanglingOrDuplicateMembership() {
        val songs = mutableListOf(Song(id = id("s"), header = SongHeader(title = "Synthetic")))
        val memberIds = mutableListOf(id("s"))
        val sets = mutableListOf(SongSet(id("set"), "Set", memberIds))
        val resources = mutableListOf(IndependentResource(id("resource")))
        val snapshot = LibrarySnapshot(0, songs, sets, resources)
        songs.clear()
        memberIds.clear()
        sets.clear()
        resources.clear()
        assertEquals(listOf(id("s")), snapshot.sets[0].songIds)
        assertEquals(id("resource"), snapshot.resources[0].id)
        assertEquals(1, snapshot.songs.size)
        assertThrows(UnsupportedOperationException::class.java) { (snapshot.songs as MutableList).clear() }
        assertThrows(IllegalArgumentException::class.java) { SongSet(id("set"), "Set", listOf(id("s"), id("s"))) }
        assertThrows(IllegalArgumentException::class.java) {
            LibrarySnapshot(0, sets = listOf(SongSet(id("set"), "Set", listOf(id("missing")))))
        }
        assertThrows(IllegalArgumentException::class.java) { LibrarySnapshot(-1) }
    }

    @Test
    public fun creationCannotReuseAnIdentityOwnedByExistingMusicalContent() {
        val nested = scoremap.music.Section(id("nested-section"), "Verse")
        val existing = Song(id = id("existing"), header = SongHeader(title = "Existing"), sections = listOf(nested))
        val initial = LibrarySnapshot(7, listOf(existing))
        val store = AcknowledgingStore(initial)
        val result = commands(store).createSong(command().copy(songId = nested.id))
        assertEquals(CreateSongResult.Refused(CreationRefusal.IDENTITY_CONFLICT), result)
        assertEquals(0, store.commits)
        assertSame(initial, store.current)
    }
}

private fun id(value: String): MusicId = MusicId(value)

private fun command(): CreateSongCommand =
    CreateSongCommand(id("command"), 7, id("song"), "The Quiet Atlas", "Synthetic")

private fun emptyLibrary(): LibrarySnapshot =
    LibrarySnapshot(
        7,
        sets = listOf(SongSet(id("set"), "Friday Rehearsal")),
        resources = listOf(IndependentResource(id("resource"))),
    )

private fun commands(
    store: LibraryStore,
    mode: EditMode = EditMode.EDIT,
): LibraryCommands =
    LibraryCommands(
        EditModeReader {
            mode
        },
        store,
    )

private enum class StoreBehavior { ACKNOWLEDGE, REFUSE, UNCERTAIN, MISMATCH }

/** Honest test double: only ACKNOWLEDGE atomically publishes both candidate and receipt; it is not durable storage. */
private class AcknowledgingStore(
    initial: LibrarySnapshot,
    private val behavior: StoreBehavior = StoreBehavior.ACKNOWLEDGE,
) : LibraryStore {
    var current: LibrarySnapshot = initial
        private set
    var reads: Int = 0
        private set
    var commits: Int = 0
        private set
    val receipts: MutableList<CreationReceipt> = mutableListOf()

    override fun read(): LibrarySnapshot {
        reads += 1
        return current
    }

    override fun commit(write: CreationWrite): CommitResult {
        commits += 1
        check(write.expectedRevision == current.revision)
        return when (behavior) {
            StoreBehavior.REFUSE -> CommitResult.NotCommitted
            StoreBehavior.UNCERTAIN -> CommitResult.Uncertain
            else -> acknowledge(write)
        }
    }

    private fun acknowledge(write: CreationWrite): CommitResult {
        val receipt = CreationReceipt(write.commandId, write.songId, write.candidate.revision, write.transition)
        current = write.candidate
        return if (behavior == StoreBehavior.MISMATCH) {
            CommitResult.Confirmed(receipt.copy(commandId = id("wrong")))
        } else {
            receipts.add(receipt)
            CommitResult.Confirmed(receipt)
        }
    }
}
