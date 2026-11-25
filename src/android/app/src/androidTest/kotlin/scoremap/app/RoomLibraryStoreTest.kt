package scoremap.app

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import scoremap.data.local.RoomLibraryStore
import scoremap.library.ChordCommands
import scoremap.library.ChordRequest
import scoremap.library.ChordSpec
import scoremap.library.CommitOutcome
import scoremap.library.Fraction
import scoremap.library.IdSource
import scoremap.library.Library
import scoremap.library.LibraryCommands
import scoremap.library.LibraryService
import scoremap.library.MeasureRef
import scoremap.library.Meter
import scoremap.library.Mode
import scoremap.library.Outcome
import scoremap.library.Refusal
import scoremap.library.RetentionCommands
import scoremap.library.SectionRef
import scoremap.library.ServiceResult
import scoremap.library.SheetCommands
import scoremap.library.SongKey
import scoremap.music.SpelledNote
import java.util.UUID

/** Real Room on the managed device: durability, atomicity, idempotent retry and the edit guard. */
@RunWith(AndroidJUnit4::class)
public class RoomLibraryStoreTest {
    private val context: Context = ApplicationProvider.getApplicationContext()
    private val databaseName = "and05-library-${UUID.randomUUID()}.db"
    private val opened = mutableListOf<RoomLibraryStore>()
    private val ids = SequentialIds()

    @After
    public fun closeAndRemoveOnlyTheOwnedDatabase() {
        opened.forEach { runCatching { it.close() } }
        context.deleteDatabase(databaseName)
    }

    @Test
    public fun lifecycleStateSurvivesCloseAndReopen() {
        val first = open()
        val service = LibraryService(first)
        service.execute("a") { LibraryCommands.createSong(it, Mode.EDIT, "Song", ids) }
        val songId =
            service
                .current()
                .library.songs
                .single()
                .id
        service.execute("b") { LibraryCommands.insertSection(it, Mode.EDIT, songId, "Verse", ids) }
        service.execute("c") { RetentionCommands.deleteSong(it, Mode.EDIT, songId, 2) }
        val before = service.current()
        first.close()

        val reopened = LibraryService(open()).current()
        assertEquals(3, reopened.revision)
        assertEquals(before.library, reopened.library)
        assertEquals(listOf(songId), reopened.library.deletedSongs.map { it.id })
        assertEquals(listOf(1L, 2L), RetentionCommands.history(reopened.library, songId).map { it.number })
    }

    @Test
    public fun keyLyricsAndCuesSurviveReopenInTheSongAndItsHistory() {
        val first = open()
        val service = LibraryService(first)
        service.execute("a") { LibraryCommands.createSong(it, Mode.EDIT, "Song", ids) }
        val songId =
            service
                .current()
                .library.songs
                .single()
                .id
        service.execute("b") { LibraryCommands.insertSection(it, Mode.EDIT, songId, "Verse", ids) }
        val sectionId =
            service
                .current()
                .library.songs
                .single()
                .sections
                .single()
                .id
        val key = SongKey(SpelledNote.parseRoot("F#"), minor = true)
        service.execute("c") { SheetCommands.setKey(it, Mode.EDIT, songId, key) }
        service.execute("d") { SheetCommands.setLyrics(it, Mode.EDIT, songId, sectionId, "Line one\nLine two") }
        service.execute("e") { SheetCommands.setCue(it, Mode.EDIT, songId, sectionId, "Tacet first time") }
        val before = service.current()
        first.close()

        val reopened = LibraryService(open()).current()
        assertEquals(before.library, reopened.library)
        val song = reopened.library.songs.single()
        assertEquals(key, song.key)
        assertEquals("Line one\nLine two", song.sections.single().lyrics)
        assertEquals("Tacet first time", song.sections.single().cue)
        val kept = RetentionCommands.history(reopened.library, songId)
        assertNull(kept.first { it.number == 2L }.key)
        assertEquals(key, kept.last().key)
        assertEquals(
            "Line one\nLine two",
            kept
                .last()
                .sections
                .single()
                .lyrics,
        )
    }

    @Test
    public fun measuresChordsAndLyricLinksSurviveReopenInTheSongAndItsHistory() {
        val first = open()
        val service = LibraryService(first)
        val ref = songWithLyrics(service)
        service.execute("d") { ChordCommands.addMeasure(it, Mode.EDIT, ref, Meter(3, 4), ids) }
        val measureId =
            service
                .current()
                .library.songs
                .single()
                .sections
                .single()
                .measures
                .single()
                .id
        val chord = ChordSpec("G", "dominant-seventh", listOf("b9"), "B")
        val request = ChordRequest(Fraction.of(1, 3), Fraction.of(3, 2), chord, 7)
        service.execute("e") { ChordCommands.addChord(it, Mode.EDIT, MeasureRef(ref, measureId), request, ids) }
        val before = service.current()
        first.close()

        val reopened = LibraryService(open()).current()
        assertEquals(before.library, reopened.library)
        val event =
            reopened.library.songs
                .single()
                .sections
                .single()
                .measures
                .single()
                .events
                .single()
        assertEquals(listOf(request.start, request.duration), listOf(event.start, event.duration))
        assertEquals(listOf(chord, 7), listOf(event.chord, event.lyricIndex))
        val kept =
            RetentionCommands
                .history(reopened.library, ref.songId)
                .last()
                .sections
                .single()
                .measures
                .single()
        assertEquals(listOf(event), kept.events)
    }

    private fun songWithLyrics(service: LibraryService): SectionRef {
        service.execute("a") { LibraryCommands.createSong(it, Mode.EDIT, "Song", ids) }
        val songId =
            service
                .current()
                .library.songs
                .single()
                .id
        service.execute("b") { LibraryCommands.insertSection(it, Mode.EDIT, songId, "Verse", ids) }
        val ref =
            SectionRef(
                songId,
                service
                    .current()
                    .library.songs
                    .single()
                    .sections
                    .single()
                    .id,
            )
        service.execute("c") { SheetCommands.setLyrics(it, Mode.EDIT, ref.songId, ref.sectionId, "Autumn leaves") }
        return ref
    }

    @Test
    public fun anIdempotentRetryAfterReopenNeverAppliesTwice() {
        val first = open()
        LibraryService(first).execute("cmd") { LibraryCommands.createSong(it, Mode.EDIT, "Once", ids) }
        first.close()
        val retry = LibraryService(open()).execute("cmd") { LibraryCommands.createSong(it, Mode.EDIT, "Once", ids) }
        assertEquals(ServiceResult.Acknowledged(revision = 1, replay = true), retry)
        assertEquals(
            1,
            LibraryService(open())
                .current()
                .library.songs.size,
        )
    }

    @Test
    public fun aFailureInsideTheTransactionRollsBackEveryRowAndTheReceipt() {
        var failNext = false
        val store = open { check(!failNext) { "injected failure after all rows were written" } }
        val service = LibraryService(store)
        service.execute("kept") { LibraryCommands.createSong(it, Mode.EDIT, "Kept", ids) }
        failNext = true
        val failed = service.execute("lost") { LibraryCommands.createSong(it, Mode.EDIT, "Lost", ids) }
        assertTrue(failed.toString(), failed is ServiceResult.StorageFailed)
        assertEquals(
            listOf("Kept"),
            service
                .current()
                .library.songs
                .map { it.name },
        )
        assertEquals(1, service.current().revision)
        assertNull(store.acknowledged("lost"))
        failNext = false
        assertEquals(
            ServiceResult.Acknowledged(revision = 2, replay = false),
            service.execute("lost") { LibraryCommands.createSong(it, Mode.EDIT, "Lost", ids) },
        )
    }

    @Test
    public fun aStaleRevisionIsRejectedAndTheNewerDataAndUnrelatedMusicArePreserved() {
        val store = open()
        val service = LibraryService(store)
        service.execute("one") { LibraryCommands.createSong(it, Mode.EDIT, "Base", ids) }
        val stale = service.current()
        service.execute("two") { LibraryCommands.createSong(it, Mode.EDIT, "Newer", ids) }
        val rejected =
            store.commit(
                "stale",
                stale.revision,
                (LibraryCommands.createSong(stale.library, Mode.EDIT, "Stale", ids) as Outcome.Accepted).value,
            )
        assertEquals(CommitOutcome.Stale(currentRevision = 2), rejected)
        assertEquals(
            listOf("Base", "Newer"),
            service
                .current()
                .library.songs
                .map { it.name },
        )
    }

    @Test
    public fun aClosedDatabaseReportsStorageFailureWithoutAcknowledging() {
        val store = open()
        val service = LibraryService(store)
        service.execute("kept") { LibraryCommands.createSong(it, Mode.EDIT, "Kept", ids) }
        store.close()
        val result = runCatching { service.execute("lost") { LibraryCommands.createSong(it, Mode.EDIT, "Lost", ids) } }
        assertTrue(result.exceptionOrNull() != null || result.getOrNull() is ServiceResult.StorageFailed)
        assertEquals(
            listOf("Kept"),
            LibraryService(open())
                .current()
                .library.songs
                .map { it.name },
        )
    }

    @Test
    public fun performanceModeRefusalsNeverReachTheDatabase() {
        var commits = 0
        val store = open { commits += 1 }
        val service = LibraryService(store)
        val refused = service.execute("p") { LibraryCommands.createSong(it, Mode.PERFORMANCE, "No", ids) }
        assertEquals(ServiceResult.Refused(Refusal.PERFORMANCE_MODE), refused)
        assertEquals(0, commits)
        assertEquals(Library.empty(), service.current().library)
        assertEquals(0, service.current().revision)
    }

    private fun open(beforeCommit: () -> Unit = {}): RoomLibraryStore =
        RoomLibraryStore.open(context, databaseName, beforeCommit).also { opened += it }

    private class SequentialIds : IdSource {
        private var next = 0

        override fun next(): String = "id-${next++}"
    }
}
