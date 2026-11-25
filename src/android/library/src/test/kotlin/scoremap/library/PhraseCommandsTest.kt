package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

public class PhraseCommandsTest {
    private val ids = SequentialIds()

    private class Fixture(
        val library: Library,
        val part: PartRef,
        val section: SectionId,
    )

    private fun fixture(): Fixture {
        var library = accepted(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "Song", ids))
        val songId = library.songs.single().id
        library = accepted(LibraryCommands.insertSection(library, Mode.EDIT, songId, "Verse", ids))
        library = accepted(PartCommands.addPart(library, Mode.EDIT, songId, "Melody", ids))
        val song = library.songs.single()
        return Fixture(library, PartRef(songId, song.parts.single().id), song.sections.single().id)
    }

    private fun note(
        midi: Int,
        hand: Hand = Hand.RIGHT,
        duration: Fraction? = null,
    ) = PhraseItem(PerformedNote(midi, hand), duration)

    private fun phrase(library: Library) =
        library.songs
            .single()
            .parts
            .single()
            .phrases
            .single()

    private fun withPhrase(f: Fixture): Pair<Library, PhraseRef> {
        val library =
            accepted(PhraseCommands.addPhrase(f.library, Mode.EDIT, PhraseTarget(f.part, "  Theme ", f.section), ids))
        return library to PhraseRef(f.part, phrase(library).id)
    }

    @Test
    public fun aPartStartsWithNoPhrasesAndAPhraseWithNoItems() {
        val f = fixture()
        assertEquals(
            emptyList<Phrase>(),
            f.library.songs
                .single()
                .parts
                .single()
                .phrases,
        )
        val (library, _) = withPhrase(f)
        assertEquals("Theme", phrase(library).name)
        assertEquals(f.section, phrase(library).section)
        assertEquals(emptyList<PhraseItem>(), phrase(library).items)
    }

    @Test
    public fun keepsTheExactOrderRegisterHandsRestsAndOnlyTheTimingThatWasSupplied() {
        val f = fixture()
        val (start, ref) = withPhrase(f)
        val items =
            listOf(
                note(72),
                note(60, Hand.LEFT, Fraction.of(1, 2)),
                PhraseItem(null, Fraction.of(1, 1)),
                PhraseItem(null),
                note(60),
                note(0),
                note(127, Hand.LEFT, Fraction.of(3, 2)),
            )
        val library = accepted(PhraseCommands.setItems(start, Mode.EDIT, ref, items))
        assertEquals(items, phrase(library).items)
        assertNull(phrase(library).items[0].duration)
        assertNull(phrase(library).items[3].duration)
        assertTrue(phrase(library).items[2].rest)
        val changed = accepted(PhraseCommands.setItems(library, Mode.EDIT, ref, items.reversed()))
        assertEquals(items.reversed(), phrase(changed).items)
        val cleared = accepted(PhraseCommands.setItems(changed, Mode.EDIT, ref, emptyList()))
        assertEquals(emptyList<PhraseItem>(), phrase(cleared).items)
    }

    @Test
    public fun refusesInvalidPitchesAndNonPositiveDurations() {
        val f = fixture()
        val (start, ref) = withPhrase(f)
        for (bad in listOf(-1, 128)) {
            assertEquals(
                Refusal.INVALID_PITCH,
                refusal(PhraseCommands.setItems(start, Mode.EDIT, ref, listOf(note(bad)))),
            )
        }
        for (zero in listOf(Fraction.ZERO, Fraction.of(-1, 2))) {
            assertTrue(runCatching { PhraseItem(null, zero) }.isFailure)
        }
    }

    @Test
    public fun refusesUnknownTargetsAndBlankOrUnknownSections() {
        val f = fixture()
        val (library, ref) = withPhrase(f)
        val missing = ref.copy(phraseId = PhraseId("x"))
        assertEquals(Refusal.UNKNOWN_PHRASE, refusal(PhraseCommands.setItems(library, Mode.EDIT, missing, emptyList())))
        assertEquals(Refusal.UNKNOWN_PHRASE, refusal(PhraseCommands.renamePhrase(library, Mode.EDIT, missing, "A")))
        assertEquals(Refusal.UNKNOWN_PHRASE, refusal(PhraseCommands.removePhrase(library, Mode.EDIT, missing)))
        assertEquals(Refusal.INVALID_NAME, refusal(PhraseCommands.renamePhrase(library, Mode.EDIT, ref, " ")))
        assertEquals(
            Refusal.INVALID_NAME,
            refusal(PhraseCommands.addPhrase(library, Mode.EDIT, PhraseTarget(f.part, " ", null), ids)),
        )
        val badSection = PhraseCommands.addPhrase(library, Mode.EDIT, PhraseTarget(f.part, "A", SectionId("x")), ids)
        assertEquals(Refusal.UNKNOWN_SECTION, refusal(badSection))
        val badPart = f.part.copy(partId = PartId("x"))
        assertEquals(
            Refusal.UNKNOWN_PART,
            refusal(PhraseCommands.addPhrase(library, Mode.EDIT, PhraseTarget(badPart, "A", null), ids)),
        )
        assertNull(
            phrase(
                accepted(PhraseCommands.addPhrase(f.library, Mode.EDIT, PhraseTarget(f.part, "N", null), ids)),
            ).section,
        )
    }

    @Test
    public fun renamingAndRemovingArePerPhraseAndArRevisionsThatRestoreBack() {
        val f = fixture()
        val (library, ref) = withPhrase(f)
        val renamed = accepted(PhraseCommands.renamePhrase(library, Mode.EDIT, ref, " Bridge "))
        assertEquals("Bridge", phrase(renamed).name)
        val kept = renamed.songs.single().revision
        val removed = accepted(PhraseCommands.removePhrase(renamed, Mode.EDIT, ref))
        assertEquals(
            emptyList<Phrase>(),
            removed.songs
                .single()
                .parts
                .single()
                .phrases,
        )
        val restored =
            accepted(
                RetentionCommands.restoreRevision(
                    removed,
                    Mode.EDIT,
                    f.part.songId,
                    kept,
                    removed.songs.single().revision,
                ),
            )
        assertEquals(renamed.songs.single().parts, restored.songs.single().parts)
    }

    @Test
    public fun removingAPartWithPhrasesNeedsConfirmation() {
        val f = fixture()
        val (library, _) = withPhrase(f)
        assertEquals(Refusal.IN_USE, refusal(PartCommands.removePart(library, Mode.EDIT, f.part, false)))
        accepted(PartCommands.removePart(library, Mode.EDIT, f.part, true))
    }

    @Test
    public fun performanceModeRefusesEveryPhraseEditBeforeValidating() {
        val f = fixture()
        val (library, ref) = withPhrase(f)
        val attempts =
            listOf(
                PhraseCommands.addPhrase(library, Mode.PERFORMANCE, PhraseTarget(f.part, " ", null), ids),
                PhraseCommands.renamePhrase(library, Mode.PERFORMANCE, ref, " "),
                PhraseCommands.removePhrase(library, Mode.PERFORMANCE, ref),
                PhraseCommands.setItems(library, Mode.PERFORMANCE, ref, listOf(note(999))),
            )
        for (outcome in attempts) assertEquals(Refusal.PERFORMANCE_MODE, refusal(outcome))
    }

    private fun accepted(outcome: Outcome<Library>): Library = (outcome as Outcome.Accepted<Library>).value

    private fun refusal(outcome: Outcome<Library>): Refusal = (outcome as Outcome.Refused).refusal

    private class SequentialIds : IdSource {
        private var n = 0

        override fun next(): String = "id-${++n}"
    }
}
