package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test

public class LibraryRulesTest {
    private val ids = SequentialIds()

    @Test
    public fun startsEmptyAndBecomesPopulatedWithTheFirstValidSong() {
        val empty = Library.empty()
        assertEquals(LibraryState.EMPTY, empty.state)
        assertEquals(emptyList<Song>(), empty.songs)
        val created = accepted(LibraryCommands.createSong(empty, Mode.EDIT, "  Autumn Leaves  ", ids))
        assertEquals(LibraryState.POPULATED, created.state)
        assertEquals("Autumn Leaves", created.songs.single().name)
        assertEquals(emptyList<Section>(), created.songs.single().sections)
    }

    @Test
    public fun refusesInvalidNamesAndKeepsTheLibraryUnchanged() {
        val library = accepted(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "One", ids))
        for (bad in listOf("", "   ", "\t\n", " ")) {
            val outcome = LibraryCommands.createSong(library, Mode.EDIT, bad, ids)
            assertEquals(bad, Refusal.INVALID_NAME, refusal(outcome))
        }
        assertEquals(1, library.songs.size)
    }

    @Test
    public fun givesEverySongAndSectionAStableUniqueIdentity() {
        var library = accepted(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "A", ids))
        library = accepted(LibraryCommands.createSong(library, Mode.EDIT, "A", ids))
        val (first, second) = library.songs
        assertTrue(first.id != second.id)
        val songId = first.id
        library = accepted(LibraryCommands.insertSection(library, Mode.EDIT, songId, "Verse", ids))
        library = accepted(LibraryCommands.insertSection(library, Mode.EDIT, songId, "Chorus", ids))
        val sections = library.songs.first { it.id == songId }.sections
        assertEquals(listOf("Verse", "Chorus"), sections.map { it.name })
        assertEquals(listOf(1, 1), sections.map { it.repeats })
        assertEquals(2, sections.map { it.id }.toSet().size)
    }

    @Test
    public fun reorderingChangesOnlyPositionAndRetainsIdentityAndContent() {
        var library = accepted(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "Song", ids))
        val songId = library.songs.single().id
        for (name in listOf("Intro", "Verse", "Chorus")) {
            library = accepted(LibraryCommands.insertSection(library, Mode.EDIT, songId, name, ids))
        }
        val (intro, verse, chorus) = library.songs.single().sections
        library = accepted(LibraryCommands.setRepeats(library, Mode.EDIT, songId, verse.id, 4))
        val reordered =
            accepted(LibraryCommands.reorderSections(library, Mode.EDIT, songId, listOf(chorus.id, intro.id, verse.id)))
        val after = reordered.songs.single().sections
        assertEquals(listOf(chorus.id, intro.id, verse.id), after.map { it.id })
        assertEquals(mapOf("Intro" to 1, "Verse" to 4, "Chorus" to 1), after.associate { it.name to it.repeats })
        assertEquals(listOf(chorus, intro, verse.copy(repeats = 4)), after)
    }

    @Test
    public fun refusesAnyOrderThatIsNotAnExactPermutationOfTheExistingSections() {
        var library = accepted(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "Song", ids))
        val songId = library.songs.single().id
        for (name in listOf("A", "B")) {
            library =
                accepted(LibraryCommands.insertSection(library, Mode.EDIT, songId, name, ids))
        }
        val (a, b) = library.songs.single().sections
        val unknown = SectionId("missing")
        for (order in listOf(
            listOf(a.id),
            listOf(a.id, a.id),
            listOf(a.id, b.id, unknown),
            listOf(a.id, unknown),
            emptyList(),
        )) {
            assertEquals(
                order.toString(),
                Refusal.NOT_A_PERMUTATION,
                refusal(LibraryCommands.reorderSections(library, Mode.EDIT, songId, order)),
            )
        }
        assertEquals(
            listOf(a.id, b.id),
            library.songs
                .single()
                .sections
                .map { it.id },
        )
    }

    @Test
    public fun acceptsRepeatsOneThroughNinetyNineOnly() {
        var library = accepted(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "Song", ids))
        val songId = library.songs.single().id
        library = accepted(LibraryCommands.insertSection(library, Mode.EDIT, songId, "A", ids))
        val sectionId =
            library.songs
                .single()
                .sections
                .single()
                .id
        for (valid in listOf(1, 2, 98, 99)) {
            library = accepted(LibraryCommands.setRepeats(library, Mode.EDIT, songId, sectionId, valid))
            assertEquals(
                valid,
                library.songs
                    .single()
                    .sections
                    .single()
                    .repeats,
            )
        }
        for (invalid in listOf(0, -1, 100, Int.MAX_VALUE, Int.MIN_VALUE)) {
            assertEquals(
                invalid.toString(),
                Refusal.INVALID_REPEATS,
                refusal(LibraryCommands.setRepeats(library, Mode.EDIT, songId, sectionId, invalid)),
            )
        }
        assertEquals(
            99,
            library.songs
                .single()
                .sections
                .single()
                .repeats,
        )
    }

    @Test
    public fun refusesUnknownSongsAndSections() {
        val library = accepted(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "Song", ids))
        val missingSong = SongId("missing")
        assertEquals(
            Refusal.UNKNOWN_SONG,
            refusal(LibraryCommands.insertSection(library, Mode.EDIT, missingSong, "A", ids)),
        )
        assertEquals(
            Refusal.UNKNOWN_SECTION,
            refusal(LibraryCommands.setRepeats(library, Mode.EDIT, library.songs.single().id, SectionId("x"), 2)),
        )
    }

    @Test
    public fun performanceModeRefusesEveryContentMutationDirectly() {
        var library = accepted(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "Song", ids))
        val songId = library.songs.single().id
        library = accepted(LibraryCommands.insertSection(library, Mode.EDIT, songId, "A", ids))
        val sectionId =
            library.songs
                .single()
                .sections
                .single()
                .id
        val before = library
        val attempts =
            listOf(
                LibraryCommands.createSong(before, Mode.PERFORMANCE, "Another", ids),
                LibraryCommands.insertSection(before, Mode.PERFORMANCE, songId, "B", ids),
                LibraryCommands.setRepeats(before, Mode.PERFORMANCE, songId, sectionId, 3),
                LibraryCommands.reorderSections(before, Mode.PERFORMANCE, songId, listOf(sectionId)),
            )
        for (outcome in attempts) assertEquals(Refusal.PERFORMANCE_MODE, refusal(outcome))
        // The guard runs before validation: even an invalid command is refused for the mode, not for its content.
        assertEquals(Refusal.PERFORMANCE_MODE, refusal(LibraryCommands.createSong(before, Mode.PERFORMANCE, "  ", ids)))
        assertSame(before, library)
    }

    @Test
    public fun refusesAnIdentityThatIsAlreadyInUse() {
        val library = accepted(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "Song", FixedIds("same")))
        assertEquals(
            Refusal.DUPLICATE_ID,
            refusal(LibraryCommands.createSong(library, Mode.EDIT, "Other", FixedIds("same"))),
        )
    }

    private fun accepted(outcome: Outcome<Library>): Library =
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
