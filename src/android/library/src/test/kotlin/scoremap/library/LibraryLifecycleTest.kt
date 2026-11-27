package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test

public class LibraryLifecycleTest {
    private val ids = SequentialIds()

    @Test
    public fun recordsEveryAcknowledgedRevisionAndInspectingHistoryIsARead() {
        var library = song("Song")
        val id = library.songs.single().id
        library = ok(LibraryCommands.insertSection(library, Mode.EDIT, id, "Verse", ids))
        library =
            ok(
                LibraryCommands.setRepeats(
                    library,
                    Mode.EDIT,
                    id,
                    library.songs
                        .single()
                        .sections
                        .single()
                        .id,
                    3,
                ),
            )
        val history = RetentionCommands.history(library, id)
        assertEquals(listOf(1L, 2L, 3L), history.map { it.number })
        assertEquals(listOf(0, 1, 1), history.map { it.sections.size })
        assertEquals(3L, library.songs.single().revision)
        assertSame(library, library)
        assertEquals(history, RetentionCommands.history(library, id))
    }

    @Test
    public fun restoringARevisionCreatesANewOneAndKeepsInterveningHistory() {
        var library = song("Song")
        val id = library.songs.single().id
        library = ok(LibraryCommands.insertSection(library, Mode.EDIT, id, "Verse", ids))
        library = ok(LibraryCommands.insertSection(library, Mode.EDIT, id, "Chorus", ids))
        val restored = ok(RetentionCommands.restoreRevision(library, Mode.EDIT, id, 2, expectedRevision = 3))
        assertEquals(4L, restored.songs.single().revision)
        assertEquals(
            listOf("Verse"),
            restored.songs
                .single()
                .sections
                .map { it.name },
        )
        assertEquals(listOf(1L, 2L, 3L, 4L), RetentionCommands.history(restored, id).map { it.number })
        assertEquals(Refusal.STALE_REVISION, refusal(RetentionCommands.restoreRevision(restored, Mode.EDIT, id, 2, 3)))
        assertEquals(
            Refusal.UNKNOWN_REVISION,
            refusal(RetentionCommands.restoreRevision(restored, Mode.EDIT, id, 9, 4)),
        )
    }

    @Test
    public fun orderedSetsAdmitEachActiveSongAtMostOnceAndKeepTheirOrder() {
        var library = song("A")
        library = ok(LibraryCommands.createSong(library, Mode.EDIT, "B", ids))
        library = ok(LibraryCommands.createSong(library, Mode.EDIT, "C", ids))
        val (a, b, c) = library.songs.map { it.id }
        library = ok(SetCommands.createSet(library, Mode.EDIT, "  Friday ", ids))
        val setId = library.sets.single().id
        assertEquals("Friday", library.sets.single().name)
        library = ok(SetCommands.setMembers(library, Mode.EDIT, setId, 1, listOf(c, a, b)))
        assertEquals(listOf(c, a, b), library.sets.single().songIds)
        assertEquals(2L, library.sets.single().revision)
        assertEquals(
            Refusal.DUPLICATE_MEMBER,
            refusal(SetCommands.setMembers(library, Mode.EDIT, setId, 2, listOf(a, a))),
        )
        assertEquals(
            Refusal.UNKNOWN_SONG,
            refusal(SetCommands.setMembers(library, Mode.EDIT, setId, 2, listOf(SongId("x")))),
        )
        assertEquals(
            Refusal.STALE_REVISION,
            refusal(SetCommands.setMembers(library, Mode.EDIT, setId, 1, listOf(a))),
        )
        assertEquals(listOf(c, a, b), library.sets.single().songIds)
    }

    @Test
    public fun deletingASongIsRecoverableRemovesItFromSetsAndNeverRecreatesMembershipsOnRestore() {
        var library = song("Only")
        val songId = library.songs.single().id
        library = ok(SetCommands.createSet(library, Mode.EDIT, "Set", ids))
        val setId = library.sets.single().id
        library = ok(SetCommands.setMembers(library, Mode.EDIT, setId, 1, listOf(songId)))
        library = ok(RetentionCommands.deleteSong(library, Mode.EDIT, songId, expectedRevision = 1))
        assertEquals(LibraryState.EMPTY, library.state)
        assertEquals(emptyList<SongId>(), library.sets.single().songIds)
        assertEquals(listOf(songId), library.deletedSongs.map { it.id })
        val restored = ok(RetentionCommands.restoreSong(library, Mode.EDIT, songId, 1, Confirmation.Confirmed))
        assertEquals(LibraryState.POPULATED, restored.state)
        assertEquals(2L, restored.songs.single().revision)
        assertEquals(emptyList<SongId>(), restored.sets.single().songIds)
        assertEquals(
            Refusal.NOT_DELETED,
            refusal(RetentionCommands.restoreSong(restored, Mode.EDIT, songId, 2, Confirmation.Confirmed)),
        )
    }

    @Test
    public fun deletingASetKeepsItsSongsAndRestoringItNeedsEveryRetainedSong() {
        var library = song("A")
        library = ok(LibraryCommands.createSong(library, Mode.EDIT, "B", ids))
        val (a, b) = library.songs.map { it.id }
        library = ok(SetCommands.createSet(library, Mode.EDIT, "Set", ids))
        val setId = library.sets.single().id
        library = ok(SetCommands.setMembers(library, Mode.EDIT, setId, 1, listOf(b, a)))
        library = ok(SetCommands.deleteSet(library, Mode.EDIT, setId, 2))
        assertEquals(2, library.songs.size)
        assertEquals(emptyList<MusicSet>(), library.sets)
        val withoutB = ok(RetentionCommands.deleteSong(library, Mode.EDIT, b, 1))
        assertEquals(
            Refusal.MISSING_DEPENDENCY,
            refusal(SetCommands.restoreSet(withoutB, Mode.EDIT, setId, 2, Confirmation.Confirmed)),
        )
        val restored = ok(SetCommands.restoreSet(library, Mode.EDIT, setId, 2, Confirmation.Confirmed))
        assertEquals(listOf(b, a), restored.sets.single().songIds)
        assertEquals(3L, restored.sets.single().revision)
    }

    @Test
    public fun purgeNeedsASeparateConfirmationNamingTheItemAndBarsResurrection() {
        var library = song("Secret")
        val id = library.songs.single().id
        library = ok(RetentionCommands.deleteSong(library, Mode.EDIT, id, 1))
        assertEquals(
            Refusal.CANCELLED,
            refusal(RetentionCommands.purgeSong(library, Mode.EDIT, id, 1, Confirmation.Cancelled)),
        )
        assertEquals(
            Refusal.CONFIRMATION_MISMATCH,
            refusal(RetentionCommands.purgeSong(library, Mode.EDIT, id, 1, Confirmation.Named("secret"))),
        )
        assertEquals(
            Refusal.STALE_REVISION,
            refusal(RetentionCommands.purgeSong(library, Mode.EDIT, id, 7, Confirmation.Named("Secret"))),
        )
        assertEquals(1, library.deletedSongs.size)
        val purged = ok(RetentionCommands.purgeSong(library, Mode.EDIT, id, 1, Confirmation.Named("Secret")))
        assertEquals(emptyList<Song>(), purged.deletedSongs)
        assertEquals(emptyList<SongRevision>(), RetentionCommands.history(purged, id))
        assertEquals(
            Refusal.PURGED,
            refusal(RetentionCommands.restoreSong(purged, Mode.EDIT, id, 1, Confirmation.Confirmed)),
        )
        assertEquals(
            Refusal.PURGED,
            refusal(LibraryCommands.createSong(purged, Mode.EDIT, "Again", FixedIds(id.value))),
        )
        assertTrue(purged.purged.contains(id.value))
    }

    @Test
    public fun purgingASetNeverDeletesSongsAndBarsItsIdentity() {
        var library = song("A")
        val songId = library.songs.single().id
        library = ok(SetCommands.createSet(library, Mode.EDIT, "Set", ids))
        val setId = library.sets.single().id
        library = ok(SetCommands.deleteSet(library, Mode.EDIT, setId, 1))
        library = ok(SetCommands.purgeSet(library, Mode.EDIT, setId, 1, Confirmation.Named("Set")))
        assertEquals(listOf(songId), library.songs.map { it.id })
        assertEquals(
            Refusal.PURGED,
            refusal(SetCommands.restoreSet(library, Mode.EDIT, setId, 1, Confirmation.Confirmed)),
        )
        assertEquals(
            Refusal.PURGED,
            refusal(SetCommands.createSet(library, Mode.EDIT, "Set", FixedIds(setId.value))),
        )
    }

    @Test
    public fun performanceModeRefusesEveryLifecycleMutation() {
        var library = song("A")
        val songId = library.songs.single().id
        library = ok(SetCommands.createSet(library, Mode.EDIT, "Set", ids))
        val setId = library.sets.single().id
        val deleted = ok(RetentionCommands.deleteSong(library, Mode.EDIT, songId, 1))
        val attempts =
            listOf(
                SetCommands.createSet(library, Mode.PERFORMANCE, "X", ids),
                SetCommands.setMembers(library, Mode.PERFORMANCE, setId, 1, listOf(songId)),
                RetentionCommands.deleteSong(library, Mode.PERFORMANCE, songId, 1),
                SetCommands.deleteSet(library, Mode.PERFORMANCE, setId, 1),
                RetentionCommands.restoreRevision(library, Mode.PERFORMANCE, songId, 1, 1),
                RetentionCommands.restoreSong(deleted, Mode.PERFORMANCE, songId, 1, Confirmation.Confirmed),
                RetentionCommands.purgeSong(deleted, Mode.PERFORMANCE, songId, 1, Confirmation.Named("A")),
            )
        for (outcome in attempts) assertEquals(Refusal.PERFORMANCE_MODE, refusal(outcome))
    }

    private fun song(name: String): Library = ok(LibraryCommands.createSong(Library.empty(), Mode.EDIT, name, ids))

    private fun ok(outcome: Outcome<Library>): Library =
        (outcome as? Outcome.Accepted)?.value ?: error("Expected acceptance but got $outcome")

    private fun refusal(outcome: Outcome<Library>): Refusal =
        (outcome as? Outcome.Refused)?.refusal ?: error("Expected a refusal but got $outcome")

    private class SequentialIds : IdSource {
        private var next = 0

        override fun next(): String = "id-${next++}"
    }

    private class FixedIds(
        private val value: String,
    ) : IdSource {
        override fun next(): String = value
    }
}
