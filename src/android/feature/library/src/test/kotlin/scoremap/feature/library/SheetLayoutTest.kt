package scoremap.feature.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import scoremap.library.Hand
import scoremap.library.LibraryService
import scoremap.library.Mode
import scoremap.library.PerformedNote

public class SheetLayoutTest {
    private val service = LibraryService(MemoryStore())
    private val songs = LibraryScreenModel(service, Ids("song"), Ids("songcmd"))
    private val detail = SongDetailModel(service, Ids("section"), Ids("detailcmd"))
    private val form = FormModel(service, Ids("form"), Ids("formcmd"))
    private val parts = PartsModel(service, Ids("part"), Ids("partcmd"))
    private val sheet = SheetModel(service)
    private val songId =
        songs
            .createSong("Autumn Leaves", Mode.EDIT)
            .songs
            .single()
            .id
    private val sectionId = requireNotNull(detail.addSection(songId, "Verse", Mode.EDIT)).sections.single().id

    private fun chord(
        text: String,
        measure: String,
    ) = form.addChord(songId, sectionId, measure, text, Mode.EDIT)

    private fun measures() = requireNotNull(detail.load(songId)).sections.single().measures

    private fun view(performed: Boolean = false) = requireNotNull(sheet.load(songId, performed))

    @Test
    public fun aBareSongShowsItsTitleAnUnknownKeyAndNothingInvented() {
        val v = view()
        assertEquals("Autumn Leaves", v.title)
        assertEquals("Key not set", v.key)
        val section = v.sections.single()
        assertEquals("Verse", section.title)
        assertNull(section.cue)
        assertNull(section.loop)
        assertEquals(emptyList<SheetLine>(), section.lines)
    }

    @Test
    public fun keyRepeatsAndCueAreShown() {
        detail.setKey(songId, "F# minor", Mode.EDIT)
        detail.setCue(songId, sectionId, "Softly", Mode.EDIT)
        service.execute("r") {
            scoremap.library.LibraryCommands.setRepeats(
                it,
                Mode.EDIT,
                scoremap.library.SongId(songId),
                scoremap.library.SectionId(sectionId),
                2,
            )
        }
        val v = view()
        assertEquals("Key: F# minor", v.key)
        assertEquals("Verse ×2", v.sections.single().title)
        assertEquals("Softly", v.sections.single().cue)
    }

    @Test
    public fun theChordLoopListsEveryChordMeasureByMeasureAndShowsEmptyMeasures() {
        form.addMeasure(songId, sectionId, "", Mode.EDIT)
        form.addMeasure(songId, sectionId, "3/4", Mode.EDIT)
        form.addMeasure(songId, sectionId, "", Mode.EDIT)
        val (first, second) = measures()
        chord("C 2", first.id)
        chord("G7", first.id)
        chord("Dm7 3", second.id)
        assertEquals("| C G7 | Dm7 | - |", view().sections.single().loop)
    }

    @Test
    public fun linkedChordsSitAboveTheirLyricPositionAndUnlinkedOnesOnlyInTheLoop() {
        detail.setLyrics(songId, sectionId, "Autumn leaves\nfall slowly", Mode.EDIT)
        form.addMeasure(songId, sectionId, "", Mode.EDIT)
        val measure = measures().single().id
        listOf("C 1", "G7 1", "Dm 1", "Am 1").forEach { chord(it, measure) }
        val ids = measures().single().events.map { it.id }
        form.linkLyric(songId, sectionId, ids[0], "0", Mode.EDIT)
        form.linkLyric(songId, sectionId, ids[1], "7", Mode.EDIT)
        form.linkLyric(songId, sectionId, ids[2], "14", Mode.EDIT)
        val lines = view().sections.single().lines
        assertEquals(listOf(SheetLine("C      G7", "Autumn leaves"), SheetLine("Dm", "fall slowly")), lines)
        assertEquals("| C G7 Dm Am |", view().sections.single().loop)
    }

    @Test
    public fun chordsLinkedToTheSameOrNearbyPositionAreKeptApartNotMerged() {
        detail.setLyrics(songId, sectionId, "la la la", Mode.EDIT)
        form.addMeasure(songId, sectionId, "", Mode.EDIT)
        val measure = measures().single().id
        listOf("Cmaj7 1", "G 1", "Am 1").forEach { chord(it, measure) }
        val ids = measures().single().events.map { it.id }
        form.linkLyric(songId, sectionId, ids[0], "0", Mode.EDIT)
        form.linkLyric(songId, sectionId, ids[1], "2", Mode.EDIT)
        form.linkLyric(songId, sectionId, ids[2], "8", Mode.EDIT)
        assertEquals(listOf(SheetLine("Cmaj7 G Am", "la la la")), view().sections.single().lines)
    }

    @Test
    public fun lyricsWithoutLinksShowNoChordLineAndPerformedNotesAppearOnlyOnRequest() {
        detail.setLyrics(songId, sectionId, "la", Mode.EDIT)
        form.addMeasure(songId, sectionId, "", Mode.EDIT)
        chord("C 4", measures().single().id)
        parts.addPart(songId, "Right hand", Mode.EDIT)
        val state = requireNotNull(detail.load(songId))
        val notes = listOf(PerformedNote(48, Hand.LEFT), PerformedNote(64, Hand.RIGHT))
        parts.saveVoicing(songId, state.parts.single().id, state.chords.single().eventId, notes, Mode.EDIT)
        assertEquals(listOf(SheetLine("", "la")), view().sections.single().lines)
        assertEquals(emptyList<String>(), view().sections.single().performed)
        assertEquals(
            listOf("C — Right hand: C3 (left hand), E4 (right hand)"),
            view(performed = true).sections.single().performed,
        )
        assertEquals(emptyList<PerformedPosition>(), view().sections.single().positions)
        assertEquals(
            listOf(PerformedPosition("C", "Right hand", notes)),
            view(performed = true).sections.single().positions,
        )
        assertNull(sheet.load("missing", false))
    }
}
