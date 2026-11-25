package scoremap.feature.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import scoremap.library.LibraryService
import scoremap.library.Mode

public class FormModelTest {
    private val store = MemoryStore()
    private val service = LibraryService(store)
    private val songs = LibraryScreenModel(service, Ids("song"), Ids("songcmd"))
    private val detail = SongDetailModel(service, Ids("section"), Ids("detailcmd"))
    private val form = FormModel(service, Ids("form"), Ids("formcmd"))
    private val songId =
        songs
            .createSong("Song", Mode.EDIT)
            .songs
            .single()
            .id
    private val sectionId = requireNotNull(detail.addSection(songId, "Verse", Mode.EDIT)).sections.single().id

    private fun measures() = requireNotNull(detail.load(songId)).sections.single().measures

    @Test
    public fun aBlankMeterMeansFourFourAndAnInvalidOneIsRefused() {
        assertEquals(Notice.MEASURE_ADDED, form.addMeasure(songId, sectionId, " ", Mode.EDIT))
        assertEquals(Notice.MEASURE_ADDED, form.addMeasure(songId, sectionId, "6/8", Mode.EDIT))
        assertEquals(Notice.INVALID_METER, form.addMeasure(songId, sectionId, "4/3", Mode.EDIT))
        assertEquals(listOf("4/4", "6/8"), measures().map { it.meter })
    }

    @Test
    public fun chordsAreAppendedAfterTheLastOneWithTheirLength() {
        form.addMeasure(songId, sectionId, "", Mode.EDIT)
        val measure = measures().single().id
        assertEquals(Notice.CHORD_ADDED, form.addChord(songId, sectionId, measure, "Dm7 2", Mode.EDIT))
        assertEquals(Notice.CHORD_ADDED, form.addChord(songId, sectionId, measure, "G7", Mode.EDIT))
        val events = measures().single().events
        assertEquals(listOf("Dm7", "G7"), events.map { it.symbol })
        assertEquals(listOf("0", "2"), events.map { it.start })
        assertEquals(listOf("2", "1"), events.map { it.duration })
        assertEquals(Notice.CHORD_ADDED, form.addChord(songId, sectionId, measure, "C 1/2", Mode.EDIT))
        assertEquals(
            "1/2",
            measures()
                .single()
                .events
                .last()
                .duration,
        )
    }

    @Test
    public fun aChordThatDoesNotFitOrCannotBeReadIsRefusedWithoutChange() {
        form.addMeasure(songId, sectionId, "", Mode.EDIT)
        val measure = measures().single().id
        form.addChord(songId, sectionId, measure, "C 4", Mode.EDIT)
        assertEquals(Notice.NO_ROOM, form.addChord(songId, sectionId, measure, "G", Mode.EDIT))
        for (bad in listOf("", "H7", "C 0x", "C 1 2", "C -1")) {
            assertEquals(bad, Notice.INVALID_CHORD, form.addChord(songId, sectionId, measure, bad, Mode.EDIT))
        }
        assertEquals(1, measures().single().events.size)
    }

    @Test
    public fun lyricLinksAreSetClearedAndKeptInsideTheLyrics() {
        detail.setLyrics(songId, sectionId, "Autumn leaves", Mode.EDIT)
        form.addMeasure(songId, sectionId, "", Mode.EDIT)
        val measure = measures().single().id
        form.addChord(songId, sectionId, measure, "C", Mode.EDIT)
        val event =
            measures()
                .single()
                .events
                .single()
                .id
        assertEquals(Notice.SHEET_SAVED, form.linkLyric(songId, sectionId, event, "7", Mode.EDIT))
        assertEquals(
            7,
            measures()
                .single()
                .events
                .single()
                .lyricIndex,
        )
        assertEquals(Notice.INVALID_LINK, form.linkLyric(songId, sectionId, event, "99", Mode.EDIT))
        assertEquals(Notice.INVALID_LINK, form.linkLyric(songId, sectionId, event, "x", Mode.EDIT))
        assertEquals(Notice.LINKED_LYRICS, requireNotNull(detail.setLyrics(songId, sectionId, "Au", Mode.EDIT)).notice)
        assertEquals(Notice.SHEET_SAVED, form.linkLyric(songId, sectionId, event, " ", Mode.EDIT))
        assertNull(
            measures()
                .single()
                .events
                .single()
                .lyricIndex,
        )
    }

    @Test
    public fun removingChordsAndMeasuresAndTheEditGuard() {
        form.addMeasure(songId, sectionId, "", Mode.EDIT)
        val measure = measures().single().id
        form.addChord(songId, sectionId, measure, "C", Mode.EDIT)
        val event =
            measures()
                .single()
                .events
                .single()
                .id
        val commits = store.commits
        val refused =
            listOf(
                form.addMeasure(songId, sectionId, "", Mode.PERFORMANCE),
                form.addChord(songId, sectionId, measure, "G", Mode.PERFORMANCE),
                form.removeChord(songId, sectionId, event, Mode.PERFORMANCE),
                form.removeMeasure(songId, sectionId, measure, Mode.PERFORMANCE),
                form.linkLyric(songId, sectionId, event, "", Mode.PERFORMANCE),
            )
        for (notice in refused) assertEquals(Notice.EDIT_MODE_REQUIRED, notice)
        assertEquals(commits, store.commits)
        assertEquals(Notice.SHEET_SAVED, form.removeChord(songId, sectionId, event, Mode.EDIT))
        assertEquals(emptyList<EventItem>(), measures().single().events)
        assertEquals(Notice.SHEET_SAVED, form.removeMeasure(songId, sectionId, measure, Mode.EDIT))
        assertEquals(emptyList<MeasureItem>(), measures())
    }
}
