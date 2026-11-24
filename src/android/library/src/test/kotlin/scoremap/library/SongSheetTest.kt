package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Test
import scoremap.music.MusicRuleViolation
import scoremap.music.SpelledNote

public class SongSheetTest {
    private val ids = SequentialIds()

    private fun libraryWithSection(): Triple<Library, SongId, SectionId> {
        var library = accepted(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "Song", ids))
        val songId = library.songs.single().id
        library = accepted(LibraryCommands.insertSection(library, Mode.EDIT, songId, "Verse", ids))
        return Triple(
            library,
            songId,
            library.songs
                .single()
                .sections
                .single()
                .id,
        )
    }

    @Test
    public fun aNewSongHasNoKnownKeyAndNoLyricsOrCues() {
        val (library, _, _) = libraryWithSection()
        assertNull(library.songs.single().key)
        assertEquals(
            "",
            library.songs
                .single()
                .sections
                .single()
                .lyrics,
        )
        assertEquals(
            "",
            library.songs
                .single()
                .sections
                .single()
                .cue,
        )
    }

    @Test
    public fun setsAndClearsTheKnownKeyAsRevisionsOfTheHistory() {
        val (start, songId, _) = libraryWithSection()
        val key = SongKey(SpelledNote.parseRoot("Bb"), minor = false)
        val keyed = accepted(SheetCommands.setKey(start, Mode.EDIT, songId, key))
        assertEquals(key, keyed.songs.single().key)
        assertEquals(start.songs.single().revision + 1, keyed.songs.single().revision)
        val cleared = accepted(SheetCommands.setKey(keyed, Mode.EDIT, songId, null))
        assertNull(cleared.songs.single().key)
        val history = RetentionCommands.history(cleared, songId)
        assertEquals(key, history.first { it.number == 3L }.key)
        assertNull(history.first { it.number == 4L }.key)
    }

    @Test
    public fun keyRulesRefuseUnsupportedSpellings() {
        for (bad in listOf("H", "C##", "Dbb", "c", "")) {
            val failed = runCatching { SongKey(SpelledNote.parseRoot(bad), minor = true) }.exceptionOrNull()
            assertEquals(bad, true, failed is MusicRuleViolation)
        }
        assertEquals("F# minor", SongKey(SpelledNote.parseRoot("F#"), minor = true).label)
        assertEquals("Eb major", SongKey(SpelledNote.parseRoot("Eb"), minor = false).label)
    }

    @Test
    public fun aKeyLabelReadsBackAndCorruptTextIsAnUnknownKey() {
        for (label in listOf("C major", "F# minor", "Eb major", "Bb minor")) {
            assertEquals(label, SongKey.parse(label)?.label)
        }
        for (bad in listOf(null, "", "C", "C maj", "H major", "C## minor", "C major extra", "c major")) {
            assertNull(bad, SongKey.parse(bad))
        }
    }

    @Test
    public fun savesLyricsAndCuesPerSectionWithoutTouchingOtherContent() {
        val (start, songId, sectionId) = libraryWithSection()
        val text = "Autumn leaves\r\nfall past the window\n"
        var library = accepted(SheetCommands.setLyrics(start, Mode.EDIT, songId, sectionId, text))
        library = accepted(SheetCommands.setCue(library, Mode.EDIT, songId, sectionId, "  Softly, tacet first time  "))
        val section =
            library.songs
                .single()
                .sections
                .single()
        assertEquals("Autumn leaves\nfall past the window", section.lyrics)
        assertEquals("Softly, tacet first time", section.cue)
        assertEquals("Verse", section.name)
        assertEquals(1, section.repeats)
        assertEquals(start.songs.single().revision + 2, library.songs.single().revision)
    }

    @Test
    public fun blankTextIsAbsentNotAnEmptyClaim() {
        val (start, songId, sectionId) = libraryWithSection()
        val written = accepted(SheetCommands.setLyrics(start, Mode.EDIT, songId, sectionId, "la"))
        val cleared = accepted(SheetCommands.setLyrics(written, Mode.EDIT, songId, sectionId, " \n\t "))
        assertEquals(
            "",
            cleared.songs
                .single()
                .sections
                .single()
                .lyrics,
        )
    }

    @Test
    public fun repeatingTheSameValueCreatesNoEmptyRevision() {
        val (start, songId, sectionId) = libraryWithSection()
        val written = accepted(SheetCommands.setLyrics(start, Mode.EDIT, songId, sectionId, "la"))
        val again = accepted(SheetCommands.setLyrics(written, Mode.EDIT, songId, sectionId, "la"))
        assertSame(written, again)
        val key = SongKey(SpelledNote.parseRoot("C"), minor = false)
        val keyed = accepted(SheetCommands.setKey(written, Mode.EDIT, songId, key))
        assertSame(keyed, accepted(SheetCommands.setKey(keyed, Mode.EDIT, songId, key)))
    }

    @Test
    public fun refusesTooLongTextAndUnknownTargets() {
        val (library, songId, sectionId) = libraryWithSection()
        val tooLong = "x".repeat(SheetCommands.MAX_LYRICS + 1)
        assertEquals(
            Refusal.TEXT_TOO_LONG,
            refusal(SheetCommands.setLyrics(library, Mode.EDIT, songId, sectionId, tooLong)),
        )
        assertEquals(
            Refusal.TEXT_TOO_LONG,
            refusal(SheetCommands.setCue(library, Mode.EDIT, songId, sectionId, "y".repeat(SheetCommands.MAX_CUE + 1))),
        )
        accepted(SheetCommands.setLyrics(library, Mode.EDIT, songId, sectionId, "x".repeat(SheetCommands.MAX_LYRICS)))
        assertEquals(
            Refusal.UNKNOWN_SONG,
            refusal(SheetCommands.setLyrics(library, Mode.EDIT, SongId("x"), sectionId, "a")),
        )
        assertEquals(
            Refusal.UNKNOWN_SECTION,
            refusal(SheetCommands.setCue(library, Mode.EDIT, songId, SectionId("x"), "a")),
        )
        assertEquals(Refusal.UNKNOWN_SONG, refusal(SheetCommands.setKey(library, Mode.EDIT, SongId("x"), null)))
    }

    @Test
    public fun performanceModeRefusesEverySheetEditBeforeValidating() {
        val (library, songId, sectionId) = libraryWithSection()
        val key = SongKey(SpelledNote.parseRoot("G"), minor = false)
        val attempts =
            listOf(
                SheetCommands.setKey(library, Mode.PERFORMANCE, songId, key),
                SheetCommands.setLyrics(library, Mode.PERFORMANCE, songId, sectionId, "la"),
                SheetCommands.setLyrics(library, Mode.PERFORMANCE, SongId("x"), sectionId, "la"),
                SheetCommands.setCue(library, Mode.PERFORMANCE, songId, sectionId, "x".repeat(10_000)),
            )
        for (outcome in attempts) assertEquals(Refusal.PERFORMANCE_MODE, refusal(outcome))
    }

    @Test
    public fun restoringARevisionBringsBackKeyLyricsAndCues() {
        val (start, songId, sectionId) = libraryWithSection()
        val key = SongKey(SpelledNote.parseRoot("D"), minor = true)
        var library = accepted(SheetCommands.setKey(start, Mode.EDIT, songId, key))
        library = accepted(SheetCommands.setLyrics(library, Mode.EDIT, songId, sectionId, "first"))
        val keptRevision = library.songs.single().revision
        library = accepted(SheetCommands.setLyrics(library, Mode.EDIT, songId, sectionId, "second"))
        library = accepted(SheetCommands.setKey(library, Mode.EDIT, songId, null))
        val restored =
            accepted(
                RetentionCommands.restoreRevision(
                    library,
                    Mode.EDIT,
                    songId,
                    keptRevision,
                    library.songs.single().revision,
                ),
            )
        assertEquals(key, restored.songs.single().key)
        assertEquals(
            "first",
            restored.songs
                .single()
                .sections
                .single()
                .lyrics,
        )
    }

    private fun accepted(outcome: Outcome<Library>): Library = (outcome as Outcome.Accepted<Library>).value

    private fun refusal(outcome: Outcome<Library>): Refusal = (outcome as Outcome.Refused).refusal

    private class SequentialIds : IdSource {
        private var n = 0

        override fun next(): String = "id-${++n}"
    }
}
