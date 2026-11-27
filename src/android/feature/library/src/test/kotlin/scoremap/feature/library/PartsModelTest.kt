package scoremap.feature.library

import org.junit.Assert.assertEquals
import org.junit.Test
import scoremap.library.Hand
import scoremap.library.LibraryService
import scoremap.library.Mode
import scoremap.library.PerformedNote

public class PartsModelTest {
    private val store = MemoryStore()
    private val service = LibraryService(store)
    private val songs = LibraryScreenModel(service, Ids("song"), Ids("songcmd"))
    private val detail = SongDetailModel(service, Ids("section"), Ids("detailcmd"))
    private val form = FormModel(service, Ids("form"), Ids("formcmd"))
    private val parts = PartsModel(service, Ids("part"), Ids("partcmd"))
    private val songId =
        songs
            .createSong("Song", Mode.EDIT)
            .songs
            .single()
            .id
    private val sectionId = requireNotNull(detail.addSection(songId, "Verse", Mode.EDIT)).sections.single().id

    private fun state() = requireNotNull(detail.load(songId))

    private fun withChord(): Pair<String, String> {
        form.addMeasure(songId, sectionId, "", Mode.EDIT)
        form.addChord(
            songId,
            sectionId,
            state()
                .sections
                .single()
                .measures
                .single()
                .id,
            "Dm7",
            Mode.EDIT,
        )
        parts.addPart(songId, " Right hand ", Mode.EDIT)
        return state().parts.single().id to state().chords.single().eventId
    }

    @Test
    public fun partsAreAddedNamedAndListedAndBlankNamesAreRefused() {
        assertEquals(Notice.PART_ADDED, parts.addPart(songId, " Right hand ", Mode.EDIT))
        assertEquals(Notice.INVALID_NAME, parts.addPart(songId, " ", Mode.EDIT))
        assertEquals(listOf("Right hand"), state().parts.map { it.name })
        val id = state().parts.single().id
        assertEquals(Notice.SHEET_SAVED, parts.renamePart(songId, id, "Pad", Mode.EDIT))
        assertEquals(listOf("Pad"), state().parts.map { it.name })
    }

    @Test
    public fun aSavedVoicingIsListedWithExactLabelsAndHands() {
        val (partId, eventId) = withChord()
        val notes = listOf(PerformedNote(64, Hand.RIGHT), PerformedNote(50, Hand.LEFT), PerformedNote(108, Hand.RIGHT))
        assertEquals(Notice.VOICING_SAVED, parts.saveVoicing(songId, partId, eventId, notes, Mode.EDIT))
        val voicing =
            state()
                .parts
                .single()
                .voicings
                .single()
        assertEquals("Dm7", voicing.chord)
        assertEquals(
            listOf("D3" to Hand.LEFT, "E4" to Hand.RIGHT, "C8" to Hand.RIGHT),
            voicing.notes.map {
                it.label to
                    it.hand
            },
        )
        assertEquals(
            true,
            state()
                .sections
                .single()
                .measures
                .single()
                .events
                .single()
                .voiced,
        )
        assertEquals("Verse, measure 1: Dm7", state().chords.single().label)
    }

    @Test
    public fun removingAVoicedChordNeedsTheReconcilingChoiceAndThenRemovesTheVoicings() {
        val (partId, eventId) = withChord()
        parts.saveVoicing(songId, partId, eventId, listOf(PerformedNote(60, Hand.RIGHT)), Mode.EDIT)
        assertEquals(Notice.IN_USE, form.removeChord(songId, sectionId, eventId, Mode.EDIT))
        assertEquals(
            1,
            state()
                .parts
                .single()
                .voicings.size,
        )
        assertEquals(Notice.SHEET_SAVED, form.removeChord(songId, sectionId, eventId, Mode.EDIT, reconcile = true))
        assertEquals(emptyList<VoicingItem>(), state().parts.single().voicings)
    }

    @Test
    public fun removingAPartWithVoicingsNeedsConfirmation() {
        val (partId, eventId) = withChord()
        parts.saveVoicing(songId, partId, eventId, listOf(PerformedNote(60, Hand.RIGHT)), Mode.EDIT)
        assertEquals(Notice.IN_USE, parts.removePart(songId, partId, false, Mode.EDIT))
        assertEquals(Notice.SHEET_SAVED, parts.removePart(songId, partId, true, Mode.EDIT))
        assertEquals(emptyList<PartItem>(), state().parts)
    }

    @Test
    public fun partEditsAreRefusedInPerformanceModeAndInvalidPitchesAreRefused() {
        val (partId, eventId) = withChord()
        val commits = store.commits
        val refused =
            listOf(
                parts.addPart(songId, "X", Mode.PERFORMANCE),
                parts.renamePart(songId, partId, "X", Mode.PERFORMANCE),
                parts.removePart(songId, partId, true, Mode.PERFORMANCE),
                parts.saveVoicing(songId, partId, eventId, emptyList(), Mode.PERFORMANCE),
            )
        for (notice in refused) assertEquals(Notice.EDIT_MODE_REQUIRED, notice)
        assertEquals(commits, store.commits)
        assertEquals(
            Notice.FAILED,
            parts.saveVoicing(songId, partId, eventId, listOf(PerformedNote(200, Hand.LEFT)), Mode.EDIT),
        )
    }
}
