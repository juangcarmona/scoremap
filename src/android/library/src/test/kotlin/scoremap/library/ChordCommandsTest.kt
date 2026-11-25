package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

public class ChordCommandsTest {
    private val ids = SequentialIds()
    private val g7 = ChordSpec("G", "dominant-seventh")
    private val c = ChordSpec("C", "major")

    private fun setup(): Triple<Library, SectionRef, MeasureId> {
        var library = accepted(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "Song", ids))
        val songId = library.songs.single().id
        library = accepted(LibraryCommands.insertSection(library, Mode.EDIT, songId, "Verse", ids))
        val ref =
            SectionRef(
                songId,
                library.songs
                    .single()
                    .sections
                    .single()
                    .id,
            )
        library = accepted(ChordCommands.addMeasure(library, Mode.EDIT, ref, Meter.COMMON, ids))
        return Triple(
            library,
            ref,
            library.songs
                .single()
                .sections
                .single()
                .measures
                .single()
                .id,
        )
    }

    private fun measure(library: Library): Measure =
        library.songs
            .single()
            .sections
            .single()
            .measures
            .single()

    private fun request(
        start: Long,
        duration: Long = 1,
        chord: ChordSpec = c,
        link: Int? = null,
    ) = ChordRequest(Fraction.of(start, 1), Fraction.of(duration, 1), chord, link)

    @Test
    public fun aSectionStartsWithNoMeasuresAndAMeasureWithNoEvents() {
        val (library, _, _) = setup()
        assertEquals(Meter.COMMON, measure(library).meter)
        assertEquals(emptyList<ChordEvent>(), measure(library).events)
    }

    @Test
    public fun placesChordsInTimeOrderWithExactOffsetsAndStableIdentities() {
        val (start, ref, measureId) = setup()
        var library =
            accepted(ChordCommands.addChord(start, Mode.EDIT, MeasureRef(ref, measureId), request(2, 2, g7), ids))
        library = accepted(ChordCommands.addChord(library, Mode.EDIT, MeasureRef(ref, measureId), request(0, 2), ids))
        val events = measure(library).events
        assertEquals(listOf(Fraction.ZERO, Fraction.of(2, 1)), events.map { it.start })
        assertEquals(listOf(c, g7), events.map { it.chord })
        assertEquals(2, events.map { it.id }.toSet().size)
        val half = ChordRequest(Fraction.of(1, 3), Fraction.of(1, 6), c)
        val sixth = accepted(ChordCommands.addChord(start, Mode.EDIT, MeasureRef(ref, measureId), half, ids))
        assertEquals(Fraction.of(1, 3), measure(sixth).events.single().start)
    }

    @Test
    public fun refusesOverlapsAndTimesOutsideTheMeasure() {
        val (start, ref, measureId) = setup()
        val library = accepted(ChordCommands.addChord(start, Mode.EDIT, MeasureRef(ref, measureId), request(1, 2), ids))

        fun refusal(request: ChordRequest) =
            refusal(ChordCommands.addChord(library, Mode.EDIT, MeasureRef(ref, measureId), request, ids))
        assertEquals(Refusal.OVERLAP, refusal(request(0, 2)))
        assertEquals(Refusal.OVERLAP, refusal(request(2, 1)))
        assertEquals(Refusal.INVALID_TIME, refusal(request(4, 1)))
        assertEquals(Refusal.INVALID_TIME, refusal(request(3, 2)))
        assertEquals(Refusal.INVALID_TIME, refusal(request(0, 0)))
        assertEquals(Refusal.INVALID_TIME, refusal(request(-1, 1)))
        accepted(ChordCommands.addChord(library, Mode.EDIT, MeasureRef(ref, measureId), request(0, 1), ids))
        accepted(ChordCommands.addChord(library, Mode.EDIT, MeasureRef(ref, measureId), request(3, 1), ids))
    }

    @Test
    public fun theMeterSetsTheMeasureLength() {
        val (start, ref, _) = setup()
        val library = accepted(ChordCommands.addMeasure(start, Mode.EDIT, ref, Meter(3, 8), ids))
        val short =
            library.songs
                .single()
                .sections
                .single()
                .measures
                .last()
                .id
        val half = Fraction.of(1, 2)
        val ok = ChordRequest(Fraction.of(1, 1), half, c)
        accepted(ChordCommands.addChord(library, Mode.EDIT, MeasureRef(ref, short), ok, ids))
        val past = ChordRequest(Fraction.of(1, 1), Fraction.of(3, 2), c)
        assertEquals(
            Refusal.INVALID_TIME,
            refusal(ChordCommands.addChord(library, Mode.EDIT, MeasureRef(ref, short), past, ids)),
        )
    }

    @Test
    public fun lyricLinksAreExplicitOptionalAndWithinTheLyrics() {
        val (start, ref, measureId) = setup()
        var library = accepted(SheetCommands.setLyrics(start, Mode.EDIT, ref.songId, ref.sectionId, "Autumn leaves"))
        library =
            accepted(ChordCommands.addChord(library, Mode.EDIT, MeasureRef(ref, measureId), request(0, 2, c, 7), ids))
        val event = measure(library).events.single()
        assertEquals(7, event.lyricIndex)
        assertEquals(
            Refusal.INVALID_LYRIC_LINK,
            refusal(ChordCommands.addChord(library, Mode.EDIT, MeasureRef(ref, measureId), request(2, 1, g7, 14), ids)),
        )
        library = accepted(ChordCommands.linkLyric(library, Mode.EDIT, ref, event.id, 13))
        assertEquals(13, measure(library).events.single().lyricIndex)
        assertEquals(
            Refusal.INVALID_LYRIC_LINK,
            refusal(ChordCommands.linkLyric(library, Mode.EDIT, ref, event.id, -1)),
        )
        library = accepted(ChordCommands.linkLyric(library, Mode.EDIT, ref, event.id, null))
        assertNull(measure(library).events.single().lyricIndex)
    }

    @Test
    public fun shorteningLyricsPastALinkedChordIsRefusedUntilTheLinkIsRemoved() {
        val (start, ref, measureId) = setup()
        var library = accepted(SheetCommands.setLyrics(start, Mode.EDIT, ref.songId, ref.sectionId, "Autumn leaves"))
        library =
            accepted(ChordCommands.addChord(library, Mode.EDIT, MeasureRef(ref, measureId), request(0, 1, c, 13), ids))
        val event = measure(library).events.single()
        val shorter = SheetCommands.setLyrics(library, Mode.EDIT, ref.songId, ref.sectionId, "Autumn")
        assertEquals(Refusal.DANGLING_REFERENCE, refusal(shorter))
        accepted(SheetCommands.setLyrics(library, Mode.EDIT, ref.songId, ref.sectionId, "Autumn leaves, falling"))
        library = accepted(ChordCommands.linkLyric(library, Mode.EDIT, ref, event.id, null))
        accepted(SheetCommands.setLyrics(library, Mode.EDIT, ref.songId, ref.sectionId, "Autumn"))
    }

    @Test
    public fun removingChordsAndMeasuresAndReorderingKeepIdentitiesAndContent() {
        val (start, ref, first) = setup()
        var library = accepted(ChordCommands.addChord(start, Mode.EDIT, MeasureRef(ref, first), request(0), ids))
        library = accepted(ChordCommands.addMeasure(library, Mode.EDIT, ref, Meter(3, 4), ids))
        val (m1, m2) =
            library.songs
                .single()
                .sections
                .single()
                .measures
        val reordered = accepted(ChordCommands.reorderMeasures(library, Mode.EDIT, ref, listOf(m2.id, m1.id)))
        assertEquals(
            listOf(m2, m1),
            reordered.songs
                .single()
                .sections
                .single()
                .measures,
        )
        assertEquals(
            Refusal.NOT_A_PERMUTATION,
            refusal(ChordCommands.reorderMeasures(library, Mode.EDIT, ref, listOf(m1.id))),
        )
        val noChord = accepted(ChordCommands.removeChord(library, Mode.EDIT, ref, m1.events.single().id))
        assertEquals(
            emptyList<ChordEvent>(),
            noChord.songs
                .single()
                .sections
                .single()
                .measures
                .first()
                .events,
        )
        assertEquals(Refusal.UNKNOWN_EVENT, refusal(ChordCommands.removeChord(library, Mode.EDIT, ref, EventId("x"))))
        val noMeasure = accepted(ChordCommands.removeMeasure(library, Mode.EDIT, ref, m1.id))
        assertEquals(
            listOf(m2),
            noMeasure.songs
                .single()
                .sections
                .single()
                .measures,
        )
        assertEquals(
            Refusal.UNKNOWN_MEASURE,
            refusal(ChordCommands.removeMeasure(library, Mode.EDIT, ref, MeasureId("x"))),
        )
    }

    @Test
    public fun everyEditIsARevisionAndRestoringARevisionBringsBackTheForm() {
        val (start, ref, measureId) = setup()
        val library = accepted(ChordCommands.addChord(start, Mode.EDIT, MeasureRef(ref, measureId), request(0), ids))
        val song = library.songs.single()
        assertEquals(start.songs.single().revision + 1, song.revision)
        val removed = accepted(ChordCommands.removeMeasure(library, Mode.EDIT, ref, measureId))
        val restored =
            accepted(
                RetentionCommands.restoreRevision(
                    removed,
                    Mode.EDIT,
                    ref.songId,
                    song.revision,
                    removed.songs.single().revision,
                ),
            )
        assertEquals(1, measure(restored).events.size)
    }

    @Test
    public fun performanceModeRefusesEveryFormEditBeforeValidating() {
        val (library, ref, measureId) = setup()
        val attempts =
            listOf(
                ChordCommands.addMeasure(library, Mode.PERFORMANCE, ref, Meter.COMMON, ids),
                ChordCommands.removeMeasure(library, Mode.PERFORMANCE, ref, MeasureId("x")),
                ChordCommands.reorderMeasures(library, Mode.PERFORMANCE, ref, emptyList()),
                ChordCommands.addChord(library, Mode.PERFORMANCE, MeasureRef(ref, measureId), request(9, 9), ids),
                ChordCommands.removeChord(library, Mode.PERFORMANCE, ref, EventId("x")),
                ChordCommands.linkLyric(library, Mode.PERFORMANCE, ref, EventId("x"), -5),
            )
        for (outcome in attempts) assertEquals(Refusal.PERFORMANCE_MODE, refusal(outcome))
    }

    @Test
    public fun refusesUnknownTargetsAndReusedIdentities() {
        val (library, ref, measureId) = setup()
        val missing = SectionRef(SongId("x"), ref.sectionId)
        assertEquals(
            Refusal.UNKNOWN_SONG,
            refusal(ChordCommands.addMeasure(library, Mode.EDIT, missing, Meter.COMMON, ids)),
        )
        val noSection = SectionRef(ref.songId, SectionId("x"))
        assertEquals(
            Refusal.UNKNOWN_SECTION,
            refusal(ChordCommands.addMeasure(library, Mode.EDIT, noSection, Meter.COMMON, ids)),
        )
        assertEquals(
            Refusal.UNKNOWN_MEASURE,
            refusal(ChordCommands.addChord(library, Mode.EDIT, MeasureRef(ref, MeasureId("x")), request(0), ids)),
        )
        assertEquals(
            Refusal.DUPLICATE_ID,
            refusal(
                ChordCommands.addChord(
                    library,
                    Mode.EDIT,
                    MeasureRef(ref, measureId),
                    request(0),
                    FixedIds(measureId.value),
                ),
            ),
        )
    }

    private fun accepted(outcome: Outcome<Library>): Library = (outcome as Outcome.Accepted<Library>).value

    private fun refusal(outcome: Outcome<Library>): Refusal = (outcome as Outcome.Refused).refusal

    private class SequentialIds : IdSource {
        private var n = 0

        override fun next(): String = "id-${++n}"
    }

    private class FixedIds(
        private val id: String,
    ) : IdSource {
        override fun next(): String = id
    }
}
