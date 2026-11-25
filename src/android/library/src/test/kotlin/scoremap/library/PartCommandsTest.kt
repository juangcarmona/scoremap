package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Test

public class PartCommandsTest {
    private val ids = SequentialIds()
    private val c = ChordSpec("C", "major")

    private class Fixture(
        val library: Library,
        val section: SectionRef,
        val measure: MeasureId,
        val event: EventId,
        val part: PartRef,
    )

    private fun fixture(): Fixture {
        var library = accepted(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "Song", ids))
        val songId = library.songs.single().id
        library = accepted(LibraryCommands.insertSection(library, Mode.EDIT, songId, "Verse", ids))
        val section =
            SectionRef(
                songId,
                library.songs
                    .single()
                    .sections
                    .single()
                    .id,
            )
        library = accepted(ChordCommands.addMeasure(library, Mode.EDIT, section, Meter.COMMON, ids))
        val measure =
            library.songs
                .single()
                .sections
                .single()
                .measures
                .single()
                .id
        val request = ChordRequest(Fraction.ZERO, Fraction.of(2, 1), c)
        library = accepted(ChordCommands.addChord(library, Mode.EDIT, MeasureRef(section, measure), request, ids))
        val event =
            library.songs
                .single()
                .sections
                .single()
                .measures
                .single()
                .events
                .single()
                .id
        library = accepted(PartCommands.addPart(library, Mode.EDIT, songId, "  Right hand ", ids))
        return Fixture(
            library,
            section,
            measure,
            event,
            PartRef(
                songId,
                library.songs
                    .single()
                    .parts
                    .single()
                    .id,
            ),
        )
    }

    private fun notes(vararg pairs: Pair<Int, Hand>) = pairs.map { PerformedNote(it.first, it.second) }

    @Test
    public fun aSongStartsWithNoPartsAndAnyNumberOfPartsIsValid() {
        var library = accepted(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "Song", ids))
        val songId = library.songs.single().id
        assertEquals(emptyList<Part>(), library.songs.single().parts)
        repeat(5) { library = accepted(PartCommands.addPart(library, Mode.EDIT, songId, "Part $it", ids)) }
        assertEquals(
            5,
            library.songs
                .single()
                .parts
                .map { it.id }
                .toSet()
                .size,
        )
        assertEquals(Refusal.INVALID_NAME, refusal(PartCommands.addPart(library, Mode.EDIT, songId, "  ", ids)))
    }

    @Test
    public fun renamesAPartAndRefusesUnknownOrBlank() {
        val f = fixture()
        val renamed = accepted(PartCommands.renamePart(f.library, Mode.EDIT, f.part, " Left hand "))
        assertEquals(
            "Left hand",
            renamed.songs
                .single()
                .parts
                .single()
                .name,
        )
        assertEquals(Refusal.INVALID_NAME, refusal(PartCommands.renamePart(f.library, Mode.EDIT, f.part, " ")))
        val missing = f.part.copy(partId = PartId("x"))
        assertEquals(Refusal.UNKNOWN_PART, refusal(PartCommands.renamePart(f.library, Mode.EDIT, missing, "A")))
    }

    @Test
    public fun storesExactNotesWithTheirHandsSortedByPitchAndWithoutDuplicates() {
        val f = fixture()
        val chosen =
            notes(
                64 to Hand.RIGHT,
                48 to Hand.LEFT,
                64 to Hand.RIGHT,
                64 to Hand.LEFT,
                21 to Hand.LEFT,
                108 to Hand.RIGHT,
            )
        val library = accepted(PartCommands.setVoicing(f.library, Mode.EDIT, f.part, f.event, chosen))
        val voicing =
            library.songs
                .single()
                .parts
                .single()
                .voicings
                .single()
        assertEquals(f.event, voicing.eventId)
        assertEquals(
            notes(21 to Hand.LEFT, 48 to Hand.LEFT, 64 to Hand.LEFT, 64 to Hand.RIGHT, 108 to Hand.RIGHT),
            voicing.notes,
        )
        val replaced = accepted(PartCommands.setVoicing(library, Mode.EDIT, f.part, f.event, notes(60 to Hand.RIGHT)))
        assertEquals(
            notes(60 to Hand.RIGHT),
            replaced.songs
                .single()
                .parts
                .single()
                .voicings
                .single()
                .notes,
        )
        val cleared = accepted(PartCommands.setVoicing(replaced, Mode.EDIT, f.part, f.event, emptyList()))
        assertEquals(
            emptyList<Voicing>(),
            cleared.songs
                .single()
                .parts
                .single()
                .voicings,
        )
    }

    @Test
    public fun pitchesOutsideThe88KeysAreKeptButOutsideMidiAreRefused() {
        val f = fixture()
        val outside =
            accepted(
                PartCommands.setVoicing(
                    f.library,
                    Mode.EDIT,
                    f.part,
                    f.event,
                    notes(
                        0 to Hand.LEFT,
                        127 to Hand.RIGHT,
                    ),
                ),
            )
        assertEquals(
            listOf(0, 127),
            outside.songs
                .single()
                .parts
                .single()
                .voicings
                .single()
                .notes
                .map { it.midi },
        )
        for (bad in listOf(-1, 128)) {
            val outcome = PartCommands.setVoicing(f.library, Mode.EDIT, f.part, f.event, notes(bad to Hand.LEFT))
            assertEquals(Refusal.INVALID_PITCH, refusal(outcome))
        }
    }

    @Test
    public fun aVoicingNeedsAnExistingPartAndAnExistingEvent() {
        val f = fixture()
        val one = notes(60 to Hand.RIGHT)
        assertEquals(
            Refusal.UNKNOWN_EVENT,
            refusal(PartCommands.setVoicing(f.library, Mode.EDIT, f.part, EventId("x"), one)),
        )
        val missing = f.part.copy(partId = PartId("x"))
        assertEquals(
            Refusal.UNKNOWN_PART,
            refusal(PartCommands.setVoicing(f.library, Mode.EDIT, missing, f.event, one)),
        )
        val noSong = f.part.copy(songId = SongId("x"))
        assertEquals(Refusal.UNKNOWN_SONG, refusal(PartCommands.setVoicing(f.library, Mode.EDIT, noSong, f.event, one)))
    }

    @Test
    public fun removingAChordOrMeasureUsedByAVoicingNeedsExplicitReconciliation() {
        val f = fixture()
        val voiced = accepted(PartCommands.setVoicing(f.library, Mode.EDIT, f.part, f.event, notes(60 to Hand.RIGHT)))
        assertEquals(
            Refusal.IN_USE,
            refusal(ChordCommands.removeChord(voiced, Mode.EDIT, f.section, f.event)),
        )
        assertEquals(
            Refusal.IN_USE,
            refusal(ChordCommands.removeMeasure(voiced, Mode.EDIT, f.section, f.measure)),
        )
        val chordGone = accepted(ChordCommands.removeChord(voiced, Mode.EDIT, f.section, f.event, reconcile = true))
        assertEquals(
            emptyList<Voicing>(),
            chordGone.songs
                .single()
                .parts
                .single()
                .voicings,
        )
        assertEquals(
            emptyList<ChordEvent>(),
            chordGone.songs
                .single()
                .sections
                .single()
                .measures
                .single()
                .events,
        )
        val measureGone =
            accepted(ChordCommands.removeMeasure(voiced, Mode.EDIT, f.section, f.measure, reconcile = true))
        assertEquals(
            emptyList<Measure>(),
            measureGone.songs
                .single()
                .sections
                .single()
                .measures,
        )
        assertEquals(
            emptyList<Voicing>(),
            measureGone.songs
                .single()
                .parts
                .single()
                .voicings,
        )
        accepted(ChordCommands.removeChord(f.library, Mode.EDIT, f.section, f.event))
    }

    @Test
    public fun removingAPartWithVoicingsNeedsConfirmationAndOtherPartsAreUntouched() {
        val f = fixture()
        val second = accepted(PartCommands.addPart(f.library, Mode.EDIT, f.part.songId, "Bass", ids))
        val other =
            PartRef(
                f.part.songId,
                second.songs
                    .single()
                    .parts
                    .last()
                    .id,
            )
        var library = accepted(PartCommands.setVoicing(second, Mode.EDIT, f.part, f.event, notes(60 to Hand.RIGHT)))
        library = accepted(PartCommands.setVoicing(library, Mode.EDIT, other, f.event, notes(36 to Hand.LEFT)))
        assertEquals(Refusal.IN_USE, refusal(PartCommands.removePart(library, Mode.EDIT, f.part, false)))
        val removed = accepted(PartCommands.removePart(library, Mode.EDIT, f.part, true))
        assertEquals(
            listOf("Bass"),
            removed.songs
                .single()
                .parts
                .map { it.name },
        )
        assertEquals(
            notes(36 to Hand.LEFT),
            removed.songs
                .single()
                .parts
                .single()
                .voicings
                .single()
                .notes,
        )
        accepted(PartCommands.removePart(second, Mode.EDIT, other, false))
    }

    @Test
    public fun partsAndVoicingsAreRevisionsAndRestoreBringsThemBack() {
        val f = fixture()
        val voiced = accepted(PartCommands.setVoicing(f.library, Mode.EDIT, f.part, f.event, notes(60 to Hand.RIGHT)))
        val kept = voiced.songs.single().revision
        val removed = accepted(PartCommands.removePart(voiced, Mode.EDIT, f.part, true))
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
        assertEquals(voiced.songs.single().parts, restored.songs.single().parts)
        assertSame(
            voiced,
            accepted(PartCommands.setVoicing(voiced, Mode.EDIT, f.part, f.event, notes(60 to Hand.RIGHT))),
        )
    }

    @Test
    public fun performanceModeRefusesEveryPartEditBeforeValidating() {
        val f = fixture()
        val attempts =
            listOf(
                PartCommands.addPart(f.library, Mode.PERFORMANCE, f.part.songId, " ", ids),
                PartCommands.renamePart(f.library, Mode.PERFORMANCE, f.part, " "),
                PartCommands.removePart(f.library, Mode.PERFORMANCE, f.part, true),
                PartCommands.setVoicing(f.library, Mode.PERFORMANCE, f.part, EventId("x"), notes(999 to Hand.LEFT)),
                ChordCommands.removeChord(f.library, Mode.PERFORMANCE, f.section, EventId("x")),
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
