package scoremap.feature.library

import org.junit.Assert.assertEquals
import org.junit.Test
import scoremap.library.Fraction
import scoremap.library.Hand
import scoremap.library.LibraryService
import scoremap.library.Mode
import scoremap.library.PerformedNote
import scoremap.library.PhraseItem

public class PhrasesModelTest {
    private val store = MemoryStore()
    private val service = LibraryService(store)
    private val songs = LibraryScreenModel(service, Ids("song"), Ids("songcmd"))
    private val detail = SongDetailModel(service, Ids("section"), Ids("detailcmd"))
    private val parts = PartsModel(service, Ids("part"), Ids("partcmd"))
    private val phrases = PhrasesModel(service, Ids("phrase"), Ids("phrasecmd"))
    private val songId =
        songs
            .createSong("Song", Mode.EDIT)
            .songs
            .single()
            .id
    private val partId: String

    init {
        detail.addSection(songId, "Verse", Mode.EDIT)
        parts.addPart(songId, "Melody", Mode.EDIT)
        partId = requireNotNull(detail.load(songId)).parts.single().id
    }

    private fun view() = requireNotNull(detail.load(songId)).parts.single().phrases

    @Test
    public fun aPhraseIsAddedSavedWithItsStepsAndListedInOrder() {
        assertEquals(Notice.PHRASE_ADDED, phrases.addPhrase(songId, partId, " Theme ", null, Mode.EDIT))
        val id = view().single().id
        val items =
            listOf(
                PhraseItem(PerformedNote(76, Hand.RIGHT), Fraction.of(1, 2)),
                PhraseItem(null),
                PhraseItem(PerformedNote(48, Hand.LEFT)),
            )
        assertEquals(Notice.PHRASE_SAVED, phrases.saveItems(songId, partId, id, items, Mode.EDIT))
        assertEquals("Theme", view().single().name)
        assertEquals(items, view().single().items)
        assertEquals(
            listOf("1. E5 (right hand), 1/2 beats", "2. rest, timing not set", "3. C3 (left hand), timing not set"),
            view().single().lines,
        )
    }

    @Test
    public fun aPhraseInASectionShowsTheSectionAndRemovalDropsIt() {
        val section = requireNotNull(detail.load(songId)).sections.single().id
        phrases.addPhrase(songId, partId, "Intro line", section, Mode.EDIT)
        assertEquals("Verse", view().single().section)
        assertEquals(Notice.SHEET_SAVED, phrases.removePhrase(songId, partId, view().single().id, Mode.EDIT))
        assertEquals(emptyList<PhraseView>(), view())
        assertEquals(Notice.FAILED, phrases.addPhrase(songId, partId, "X", "missing", Mode.EDIT))
    }

    @Test
    public fun editsAreRefusedInPerformanceModeAndInvalidInputIsRefused() {
        phrases.addPhrase(songId, partId, "Theme", null, Mode.EDIT)
        val id = view().single().id
        val commits = store.commits
        val refused =
            listOf(
                phrases.addPhrase(songId, partId, "X", null, Mode.PERFORMANCE),
                phrases.removePhrase(songId, partId, id, Mode.PERFORMANCE),
                phrases.saveItems(songId, partId, id, emptyList(), Mode.PERFORMANCE),
            )
        for (notice in refused) assertEquals(Notice.EDIT_MODE_REQUIRED, notice)
        assertEquals(commits, store.commits)
        assertEquals(Notice.INVALID_NAME, phrases.addPhrase(songId, partId, " ", null, Mode.EDIT))
        val bad = listOf(PhraseItem(PerformedNote(300, Hand.LEFT)))
        assertEquals(Notice.FAILED, phrases.saveItems(songId, partId, id, bad, Mode.EDIT))
    }
}
