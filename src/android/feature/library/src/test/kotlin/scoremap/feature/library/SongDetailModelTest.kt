package scoremap.feature.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import scoremap.library.LibraryService
import scoremap.library.Mode

public class SongDetailModelTest {
    private val store = MemoryStore()
    private val service = LibraryService(store)
    private val songs = LibraryScreenModel(service, Ids("song"), Ids("songcmd"))
    private val detail = SongDetailModel(service, Ids("section"), Ids("detailcmd"))
    private val id =
        songs
            .createSong("Old title", Mode.EDIT)
            .songs
            .single()
            .id

    @Test
    public fun showsTheSongAndItsFirstRevision() {
        val state = requireNotNull(detail.load(id))
        assertEquals("Old title", state.name)
        assertEquals(listOf(1L), state.revisions.map { it.number })
        assertNull(detail.load("missing"))
    }

    @Test
    public fun renamingAndAddingSectionsEachAddOneRevision() {
        detail.rename(id, " New title ", Mode.EDIT)
        val state = requireNotNull(detail.addSection(id, "Verse", Mode.EDIT))
        assertEquals(Notice.SECTION_ADDED, state.notice)
        assertEquals("New title", state.name)
        assertEquals(listOf("Verse"), state.sections.map { it.name })
        assertEquals(listOf(1L, 2L, 3L), state.revisions.map { it.number })
        assertEquals(listOf("Old title", "New title", "New title"), state.revisions.map { it.name })
        assertEquals(listOf(0, 0, 1), state.revisions.map { it.sectionCount })
    }

    @Test
    public fun restoringAnEarlierRevisionCreatesANewOneAndKeepsHistory() {
        detail.rename(id, "New title", Mode.EDIT)
        detail.addSection(id, "Verse", Mode.EDIT)
        val state = requireNotNull(detail.restoreRevision(id, 1, Mode.EDIT))
        assertEquals(Notice.REVISION_RESTORED, state.notice)
        assertEquals("Old title", state.name)
        assertEquals(emptyList<SectionItem>(), state.sections)
        assertEquals(listOf(1L, 2L, 3L, 4L), state.revisions.map { it.number })
    }

    @Test
    public fun refusesBlankNamesAndPerformanceModeWithoutChangingTheSong() {
        assertEquals(Notice.INVALID_NAME, requireNotNull(detail.rename(id, "  ", Mode.EDIT)).notice)
        assertEquals(Notice.INVALID_NAME, requireNotNull(detail.addSection(id, " ", Mode.EDIT)).notice)
        val commits = store.commits
        for (state in listOf(
            detail.rename(id, "X", Mode.PERFORMANCE),
            detail.addSection(id, "X", Mode.PERFORMANCE),
            detail.restoreRevision(id, 1, Mode.PERFORMANCE),
        )) {
            assertEquals(Notice.EDIT_MODE_REQUIRED, requireNotNull(state).notice)
        }
        assertEquals(commits, store.commits)
        assertEquals("Old title", requireNotNull(detail.load(id)).name)
    }

    @Test
    public fun theKeyIsReadFromTextAndEmptyTextClearsIt() {
        val keyed = requireNotNull(detail.setKey(id, " F# minor ", Mode.EDIT))
        assertEquals(Notice.SHEET_SAVED, keyed.notice)
        assertEquals("F# minor", keyed.key)
        assertEquals(Notice.INVALID_KEY, requireNotNull(detail.setKey(id, "H major", Mode.EDIT)).notice)
        assertEquals("F# minor", requireNotNull(detail.load(id)).key)
        val cleared = requireNotNull(detail.setKey(id, "  ", Mode.EDIT))
        assertNull(cleared.key)
        assertEquals(Notice.SHEET_SAVED, cleared.notice)
    }

    @Test
    public fun lyricsAndCuesAreSavedPerSectionAndShownAsAbsentUntilEntered() {
        val added = requireNotNull(detail.addSection(id, "Verse", Mode.EDIT))
        val section = added.sections.single()
        assertEquals("", section.lyrics)
        assertEquals("", section.cue)
        detail.setLyrics(id, section.id, "Line one\nLine two", Mode.EDIT)
        val state = requireNotNull(detail.setCue(id, section.id, "Softly", Mode.EDIT))
        assertEquals(Notice.SHEET_SAVED, state.notice)
        assertEquals("Line one\nLine two", state.sections.single().lyrics)
        assertEquals("Softly", state.sections.single().cue)
        val tooLong = requireNotNull(detail.setLyrics(id, section.id, "x".repeat(5000), Mode.EDIT))
        assertEquals(Notice.TEXT_TOO_LONG, tooLong.notice)
        assertEquals("Line one\nLine two", tooLong.sections.single().lyrics)
    }

    @Test
    public fun sheetEditsAreRefusedInPerformanceMode() {
        val section = requireNotNull(detail.addSection(id, "Verse", Mode.EDIT)).sections.single()
        val commits = store.commits
        for (state in listOf(
            detail.setKey(id, "C major", Mode.PERFORMANCE),
            detail.setLyrics(id, section.id, "la", Mode.PERFORMANCE),
            detail.setCue(id, section.id, "la", Mode.PERFORMANCE),
        )) {
            assertEquals(Notice.EDIT_MODE_REQUIRED, requireNotNull(state).notice)
        }
        assertEquals(commits, store.commits)
    }

    @Test
    public fun unknownRevisionIsRefusedAndAStorageFailureKeepsTheSong() {
        assertEquals(Notice.FAILED, requireNotNull(detail.restoreRevision(id, 9, Mode.EDIT)).notice)
        store.failNext = true
        val state = requireNotNull(detail.rename(id, "Lost", Mode.EDIT))
        assertEquals(Notice.STORAGE_FAILED, state.notice)
        assertEquals("Old title", state.name)
    }
}
