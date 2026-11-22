package scoremap.music

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotSame
import org.junit.Assert.assertSame
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

public class MusicContractTest {
    @Test
    public fun rationalThirdsSumToExactlyOne() {
        assertEquals(Rational.of(1), Rational.of(1, 3) + Rational.of(2, 3))
        assertEquals(Rational.of(1, 2), Rational.of(2, 4))
        assertEquals(Rational.of(0), Rational.of(-1, 3) + Rational.of(1, 3))
        assertThrows(IllegalArgumentException::class.java) { Rational.of(1, 0) }
        assertThrows(ArithmeticException::class.java) { Rational.of(Long.MAX_VALUE) + Rational.of(1) }
    }

    @Test
    public fun timingAndMeterRequireExactPositiveWithinMeasureValues() {
        assertEquals(Rational.of(4), Meter().quarterLength)
        assertEquals(Rational.of(3, 2), Meter(3, 8).quarterLength)
        Timing(Rational.of(1, 3), Rational.of(2, 3)).validateWithin(Meter(1, 4))
        assertThrows(
            IllegalArgumentException::class.java,
        ) { Timing(Rational.of(3), Rational.of(2)).validateWithin(Meter()) }
        assertThrows(IllegalArgumentException::class.java) { Timing(Rational.of(0), Rational.of(0)) }
        assertThrows(IllegalArgumentException::class.java) { Timing(Rational.of(-1), Rational.of(1)) }
        assertThrows(IllegalArgumentException::class.java) { Meter(4, 3) }
        assertThrows(IllegalArgumentException::class.java) { Meter(0, 4) }
    }

    @Test
    public fun enharmonicHarmonyRetainsIndependentLiteralSpellings() {
        val sharp = Chord(Spelling(Letter.F, 1), ChordQuality.MAJOR)
        val flat = Chord(Spelling(Letter.G, -1), ChordQuality.MAJOR)
        assertEquals(listOf("F#", "A#", "C#"), sharp.tones.map { it.toString() })
        assertEquals(listOf("Gb", "Bb", "Db"), flat.tones.map { it.toString() })
        assertEquals(listOf(6, 10, 1), sharp.tones.map { it.pitchClass })
        assertEquals(listOf(6, 10, 1), flat.tones.map { it.pitchClass })
        assertEquals(listOf("C", "E", "G", "B"), major7.tones.map { it.toString() })
        assertEquals(
            listOf("C", "Eb", "Gb", "Bbb"),
            Chord(Spelling(Letter.C), ChordQuality.DIMINISHED7).tones.map {
                it.toString()
            },
        )
    }

    @Test
    public fun fullCatalogueHasLiteralFormulasAndAliases() {
        val expected =
            listOf(
                listOf(0, 4, 7),
                listOf(0, 3, 7),
                listOf(0, 3, 6),
                listOf(0, 4, 8),
                listOf(0, 2, 7),
                listOf(0, 5, 7),
                listOf(0, 7),
                listOf(0, 4, 7, 9),
                listOf(0, 3, 7, 9),
                listOf(0, 4, 7, 9, 2),
                listOf(0, 3, 7, 9, 2),
                listOf(0, 4, 7, 10),
                listOf(0, 4, 7, 11),
                listOf(0, 3, 7, 10),
                listOf(0, 3, 6, 10),
                listOf(0, 3, 6, 9),
                listOf(0, 3, 7, 11),
                listOf(0, 4, 8, 10),
                listOf(0, 4, 8, 11),
                listOf(0, 2, 7, 10),
                listOf(0, 5, 7, 10),
                listOf(0, 4, 7, 10, 2),
                listOf(0, 4, 7, 11, 2),
                listOf(0, 3, 7, 10, 2),
                listOf(0, 4, 7, 10, 2, 5),
                listOf(0, 4, 7, 11, 2, 5),
                listOf(0, 3, 7, 10, 2, 5),
                listOf(0, 4, 7, 10, 2, 5, 9),
                listOf(0, 4, 7, 11, 2, 5, 9),
                listOf(0, 3, 7, 10, 2, 5, 9),
                listOf(0, 4, 7, 2),
                listOf(0, 3, 7, 2),
            )
        assertEquals(32, ChordQuality.entries.size)
        assertEquals(
            expected,
            ChordQuality.entries.map {
                Chord(Spelling(Letter.C), it).tones.map { tone ->
                    tone.pitchClass
                }
            },
        )
        assertEquals(ChordQuality.MAJOR7, ChordQuality.fromSuffix("Δ7"))
        assertEquals(ChordQuality.HALF_DIMINISHED7, ChordQuality.fromSuffix("ø7"))
        assertEquals(ChordQuality.MINOR_ADD9, ChordQuality.fromSuffix("m(add9)"))
        assertThrows(IllegalStateException::class.java) { ChordQuality.fromSuffix("maj14") }
    }

    @Test
    public fun alterationsAndBassNeverInferPerformanceOrRegister() {
        val altered =
            Chord(
                Spelling(Letter.C),
                ChordQuality.DOMINANT7,
                listOf(Degree(5, -1), Degree(9, -1)),
                Spelling(Letter.D, -1),
            )
        assertEquals(listOf("C", "E", "Gb", "Bb", "Db"), altered.tones.map { it.toString() })
        assertEquals("Db", altered.bass.toString())
        assertEquals("E", major7.inversion(1).toString())
        assertThrows(IllegalArgumentException::class.java) { major7.inversion(4) }
        assertThrows(IllegalArgumentException::class.java) {
            Chord(Spelling(Letter.C), ChordQuality.MAJOR, listOf(Degree(9, -1)))
        }
        assertThrows(IllegalArgumentException::class.java) {
            Chord(Spelling(Letter.C), ChordQuality.DOMINANT7, listOf(Degree(5, -1), Degree(5, 1)))
        }
        assertThrows(IllegalArgumentException::class.java) { Chord(Spelling(Letter.C, 2), ChordQuality.MAJOR) }
    }

    @Test
    public fun writtenPitchIsIndependentOfScientificOctaveBounds() {
        assertEquals(60, Pitch(Spelling(Letter.B, 1), 3, 60).absolute)
        assertEquals(59, Pitch(Spelling(Letter.C, -1), 4, 59).absolute)
        assertEquals(0, Pitch(Spelling(Letter.B, 1), -2, 0).absolute)
        assertEquals(127, Pitch(Spelling(Letter.G), 9, 127).absolute)
        assertThrows(IllegalArgumentException::class.java) { Pitch(Spelling(Letter.C), 4, 61) }
        assertThrows(IllegalArgumentException::class.java) { Pitch(Spelling(Letter.C), -1, -1) }
        assertThrows(IllegalArgumentException::class.java) { Pitch(Spelling(Letter.G, 1), 9, 128) }
        assertEquals(21, Pitch(Spelling(Letter.A), 0, 21).absolute)
        assertEquals(108, Pitch(Spelling(Letter.C), 8, 108).absolute)
    }

    @Test
    public fun exactHandsAndOutOfViewportPitchesAreNotTransposed() {
        val phrase =
            PreparedPhrase(
                id("phrase"),
                "Opening",
                listOf(
                    pitchedNote("left-db", Spelling(Letter.D, -1), 3, 49, Hand.LEFT),
                    note("left-f", Letter.F, 3, 53, Hand.LEFT),
                    pitchedNote("right-ab", Spelling(Letter.A, -1), 4, 68, Hand.RIGHT),
                    note("outside-low", Letter.C, 2, 36, Hand.CONTEXTUAL),
                    note("outside-high", Letter.B, 5, 83, Hand.UNASSIGNED),
                ),
            )
        assertEquals(listOf(49, 53, 68, 36, 83), phrase.notes.map { it.pitch.absolute })
        assertEquals(
            listOf(Hand.LEFT, Hand.LEFT, Hand.RIGHT, Hand.CONTEXTUAL, Hand.UNASSIGNED),
            phrase.notes.map { it.hand },
        )
        val visible = PitchRange(48, 71)
        assertFalse(phrase.notes[3].pitch in visible)
        assertFalse(phrase.notes[4].pitch in visible)
        assertEquals(5, phrase.notes.size)
    }

    @Test
    public fun emptyFormAndUnknownKeyDoNotFabricateMusic() {
        val song = Song(id = id("song"), header = SongHeader(title = "The Quiet Atlas"))
        assertTrue(song.sections.isEmpty())
        assertTrue(song.arrangements.isEmpty())
        assertSame(Key.Unknown, song.key)
        assertThrows(IllegalArgumentException::class.java) {
            Song(
                id = id("song"),
                header = SongHeader(title = " \t\n"),
            )
        }
        assertThrows(IllegalArgumentException::class.java) { MusicId(" ") }
    }

    @Test
    public fun repeatBoundariesAreExactAndPreservePriorSection() {
        val section = Section(id("section"), "Verse", RepeatCount.of(2))
        for (invalid in listOf(0.0, -1.0, 100.0, 1.5, Double.NaN, Double.POSITIVE_INFINITY)) {
            assertThrows(IllegalArgumentException::class.java) { RepeatCount.fromNumber(invalid) }
        }
        assertEquals(1, RepeatCount.of(1).value)
        assertEquals(99, RepeatCount.of(99).value)
        assertEquals(
            listOf(SectionOccurrence(id("section"), 1), SectionOccurrence(id("section"), 2)),
            section.occurrences(),
        )
        assertEquals(2, section.repeats.value)
    }

    @Test
    public fun reorderPreservesIdentityContentAndReferences() {
        val verse = sectionWithLyrics()
        val chorus = Section(id("chorus"), "Chorus")
        val song =
            Song(
                id = id("song"),
                header =
                    SongHeader(
                        title = "The Quiet Atlas",
                        artist = "Synthetic",
                        key =
                            Key.Known(
                                Spelling(
                                    Letter.D,
                                    -1,
                                ),
                                "major",
                            ),
                    ),
                sections =
                    listOf(
                        verse,
                        chorus,
                    ),
            )
        val reordered = song.reorderSections(listOf(chorus.id, verse.id))
        assertEquals(listOf("chorus", "verse"), reordered.sections.map { it.id.value })
        assertSame(verse, reordered.sections[1])
        assertSame(chorus, reordered.sections[0])
        assertSame(song.key, reordered.key)
        assertEquals("hold  the line\n", reordered.sections[1].lyrics[0].text)
        assertEquals(2, reordered.sections[1].repeats.value)
        assertEquals("Softly", reordered.sections[1].cue)
        assertThrows(IllegalArgumentException::class.java) { song.reorderSections(listOf(verse.id, verse.id)) }
        assertThrows(IllegalArgumentException::class.java) { song.reorderSections(listOf(verse.id)) }
        assertEquals(listOf(verse, chorus), song.sections)
    }

    @Test
    public fun harmonicOverlapAndDanglingLyricsAreRefused() {
        assertThrows(IllegalArgumentException::class.java) {
            Measure(id("measure"), harmony = listOf(harmonic("a", 0, 2), harmonic("b", 1, 1)))
        }
        assertThrows(IllegalArgumentException::class.java) {
            Section(
                id("section"),
                "Verse",
                lyrics = listOf(LyricLine(id("lyric"), "hello", listOf(LyricAnchor(id("missing"), 0)))),
            )
        }
        assertThrows(IllegalArgumentException::class.java) {
            LyricLine(id("lyric"), "abc", listOf(LyricAnchor(id("chord"), 4)))
        }
    }

    @Test
    public fun oneOccurrencePitchChangePreservesOtherNotesLayersAndArrangements() {
        val original = performanceSong()
        val arrangement = original.arrangements[0]
        val replacement = arrangement.replaceNote(id("p"), id("event-p"), id("b"), Pitch(Spelling(Letter.B), 5, 83))
        val changed = original.withArrangements(listOf(replacement, original.arrangements[1]))
        assertEquals(
            listOf(36, 43, 64, 83),
            changed.arrangements[0]
                .parts[0]
                .events[0]
                .notes
                .map { it.pitch.absolute },
        )
        assertEquals(
            listOf(36, 43, 64, 71),
            original.arrangements[0]
                .parts[0]
                .events[0]
                .notes
                .map { it.pitch.absolute },
        )
        assertSame(original.arrangements[1], changed.arrangements[1])
        val independentPart = changed.arrangements[1].parts[0]
        assertEquals(
            71,
            independentPart.events[0]
                .notes[0]
                .pitch.absolute,
        )
        assertSame(original.sections[0], changed.sections[0])
        assertEquals(arrangement.bindings, replacement.bindings)
        assertEquals(
            id("b"),
            replacement.parts[0]
                .events[0]
                .notes[3]
                .id,
        )
        assertEquals(
            Hand.RIGHT,
            replacement.parts[0]
                .events[0]
                .notes[3]
                .hand,
        )
        assertSame(arrangement.parts[0].events[0].timing, replacement.parts[0].events[0].timing)
        assertSame(
            major7,
            changed.sections[0]
                .measures[0]
                .harmony[0]
                .chord,
        )
        assertNotSame(original, changed)
    }

    @Test
    public fun simultaneousPartsAndFourthPartRemainIndependent() {
        val song = performanceSong()
        assertEquals(4, song.arrangements[0].parts.size)
        assertEquals(
            64,
            song.arrangements[0]
                .parts[0]
                .events[0]
                .notes[2]
                .pitch.absolute,
        )
        assertEquals(
            64,
            song.arrangements[0]
                .parts[1]
                .events[0]
                .notes[0]
                .pitch.absolute,
        )
        assertEquals(2, song.arrangements[0].bindings.size)
        assertEquals(
            1,
            song.arrangements[0]
                .parts[0]
                .events.size,
        )
        assertEquals(
            1,
            song.arrangements[0]
                .parts[1]
                .events.size,
        )
    }

    @Test
    public fun invalidReferenceAndExcludingBindingRefuseWholeGraph() {
        val event =
            PerformedEvent(
                id("event"),
                id("missing"),
                Timing(Rational.of(0), Rational.of(1)),
                listOf(note("n", Letter.C, 4, 60)),
            )
        assertThrows(IllegalArgumentException::class.java) {
            Song(
                id = id("s"),
                header = SongHeader(title = "Synthetic"),
                arrangements =
                    listOf(
                        Arrangement(
                            id("a"),
                            "Main",
                            listOf(
                                Part(
                                    id = id("p"),
                                    profile = PartProfile(label = "Keys"),
                                    events = listOf(event),
                                ),
                            ),
                        ),
                    ),
            )
        }
        val song = performanceSong()
        val arrangement = song.arrangements[0]
        for (invalid in listOf(
            LayerBinding(id("bad"), id("missing"), id("device"), PitchRange(0, 127), "Piano"),
            LayerBinding(id("bad"), id("p"), id("missing"), PitchRange(0, 127), "Piano"),
            LayerBinding(id("bad"), id("p"), id("device"), PitchRange(48, 71), "Piano"),
        )) {
            assertThrows(IllegalArgumentException::class.java) {
                song.withArrangements(
                    listOf(Arrangement(arrangement.id, arrangement.label, arrangement.parts, listOf(invalid))),
                )
            }
        }
    }

    @Test
    public fun untimedPhraseHasNoInventedRestOrDurationAndOwnershipIsDefensive() {
        val mutable = mutableListOf(pitchedNote("a", Spelling(Letter.D, -1), 3, 49, Hand.LEFT))
        val phrase = PreparedPhrase(id("phrase"), "Opening", mutable)
        mutable.clear()
        assertEquals(listOf(49), phrase.notes.map { it.pitch.absolute })
        assertThrows(UnsupportedOperationException::class.java) { (phrase.notes as MutableList).clear() }
        val rest =
            PerformedEvent(
                id("rest"),
                id("measure"),
                Timing(Rational.of(1), Rational.of(1)),
                emptyList(),
                isRest = true,
            )
        assertTrue(rest.isRest)
        assertThrows(IllegalArgumentException::class.java) {
            PerformedEvent(id("bad"), id("measure"), rest.timing, emptyList())
        }
        assertThrows(IllegalArgumentException::class.java) {
            PerformedEvent(id("bad"), id("measure"), rest.timing, phrase.notes, isRest = true)
        }
    }

    @Test
    public fun duplicateIdentityAcrossIndependentPartsIsRefused() {
        val first = Part(id = id("same"), profile = PartProfile(label = "Keys"))
        val second = Part(id = id("same"), profile = PartProfile(label = "Synth"))
        assertThrows(IllegalArgumentException::class.java) { Arrangement(id("a"), "Main", listOf(first, second)) }
        assertThrows(IllegalArgumentException::class.java) {
            Song(
                id = id("same"),
                header = SongHeader(title = "Synthetic"),
                sections =
                    listOf(
                        Section(
                            id("same"),
                            "Verse",
                        ),
                    ),
            )
        }
    }

    @Test
    public fun measureOrderAndExplicitShortLengthPreserveOwnedContent() {
        val pickup =
            Measure(
                id("pickup"),
                length = Rational.of(1, 3),
                harmony =
                    listOf(
                        HarmonicEvent(id("pickup-chord"), Timing(Rational.of(0), Rational.of(1, 3)), major7),
                    ),
            )
        val normal = Measure(id("normal"))
        val section = Section(id("section"), "Pickup", measures = listOf(pickup, normal))
        val reordered = section.reorderMeasures(listOf(normal.id, pickup.id))
        assertEquals(listOf("normal", "pickup"), reordered.measures.map { it.id.value })
        assertSame(pickup, reordered.measures[1])
        assertEquals(Rational.of(1, 3), reordered.measures[1].length)
        assertThrows(IllegalArgumentException::class.java) { section.reorderMeasures(listOf(pickup.id, pickup.id)) }
        assertThrows(IllegalArgumentException::class.java) { Measure(id("bad"), length = Rational.of(0)) }
    }

    @Test
    public fun explicitPhraseTimingPreservesDurationsRestsAndOrder() {
        val first = pitchedNote("first", Spelling(Letter.D, -1), 3, 49, Hand.LEFT)
        val second = pitchedNote("second", Spelling(Letter.A, -1), 4, 68, Hand.RIGHT)
        val steps =
            mutableListOf(
                PhraseStep(id("step-one"), first.id, Rational.of(1, 3)),
                PhraseStep(id("rest-step"), null, Rational.of(2, 3)),
                PhraseStep(id("step-two"), second.id, Rational.of(1)),
            )
        val phrase = PreparedPhrase(id("phrase"), "Exact phrase", listOf(first, second), steps)
        steps.clear()
        assertEquals(
            listOf(Rational.of(1, 3), Rational.of(2, 3), Rational.of(1)),
            requireNotNull(phrase.steps).map {
                it.duration
            },
        )
        assertEquals(listOf(first.id, null, second.id), requireNotNull(phrase.steps).map { it.noteId })
        assertEquals(null, PreparedPhrase(id("untimed"), "Unknown timing", listOf(first, second)).steps)
        assertThrows(IllegalArgumentException::class.java) {
            PreparedPhrase(
                id("bad"),
                "Wrong order",
                listOf(first, second),
                listOf(PhraseStep(id("step"), second.id, Rational.of(1))),
            )
        }
        assertThrows(IllegalArgumentException::class.java) { PhraseStep(id("bad"), first.id, Rational.of(0)) }
    }

    @Test
    public fun explicitTiesRequireConsecutiveMatchingIdentifiedOccurrences() {
        val measures = listOf(Measure(id("m1")), Measure(id("m2")), Measure(id("m3")))
        val before =
            PerformedEvent(
                id("before"),
                id("m1"),
                Timing(Rational.of(3), Rational.of(1)),
                listOf(note("n1", Letter.C, 4, 60, Hand.RIGHT)),
            )
        val after =
            PerformedEvent(
                id("after"),
                id("m2"),
                Timing(Rational.of(0), Rational.of(2)),
                listOf(note("n2", Letter.C, 4, 60, Hand.RIGHT)),
            )
        val tie = NoteTie(id("tie"), id("n1"), id("n2"))

        assertEquals(tie, tiedSong(measures, listOf(before, after), listOf(tie)).arrangements[0].parts[0].ties[0])
        assertThrows(IllegalArgumentException::class.java) {
            tiedSong(measures, listOf(before, after), listOf(tie.copy(toNoteId = id("missing"))))
        }
        val withinBefore =
            PerformedEvent(before.id, before.measureId, Timing(Rational.of(0), Rational.of(1)), before.notes)
        val withinAfter =
            PerformedEvent(after.id, before.measureId, Timing(Rational.of(1), Rational.of(1)), after.notes)
        assertEquals(
            tie,
            tiedSong(measures, listOf(withinBefore, withinAfter), listOf(tie)).arrangements[0].parts[0].ties[0],
        )
        val skipped = PerformedEvent(after.id, id("m3"), after.timing, after.notes)
        assertThrows(IllegalArgumentException::class.java) { tiedSong(measures, listOf(before, skipped), listOf(tie)) }
        val different = after.replaceNote(id("n2"), Pitch(Spelling(Letter.C), 5, 72))
        assertThrows(
            IllegalArgumentException::class.java,
        ) { tiedSong(measures, listOf(before, different), listOf(tie)) }
    }

    @Test
    public fun constructorAliasesCannotMutateAnyOwnedGraphCollection() {
        val (song, clearInputs) = aliasedGraph()
        clearInputs()
        assertEquals(
            60,
            song.arrangements[0]
                .parts[0]
                .events[0]
                .notes[0]
                .pitch.absolute,
        )
        assertEquals("exact text", song.sections[0].lyrics[0].text)
        assertEquals(
            id("h"),
            song.sections[0]
                .lyrics[0]
                .anchors[0]
                .eventId,
        )
        assertSame(
            major7,
            song.sections[0]
                .measures[0]
                .harmony[0]
                .chord,
        )
        assertEquals(1, song.arrangements[0].bindings.size)
        assertEquals(1, song.devices.size)
        assertThrows(UnsupportedOperationException::class.java) { (song.sections as MutableList).clear() }
        assertThrows(UnsupportedOperationException::class.java) { (song.arrangements[0].parts as MutableList).clear() }
    }

    @Test
    public fun copiedPresetIsSnapshotProvenanceAndOptionalSoundDoesNotConstrainParts() {
        val notes = mutableListOf(note("voiced", Letter.F, 3, 53, Hand.BOTH))
        val voicing = Voicing(id("voicing"), notes, PresetReference(id("external-preset"), 3))
        notes.clear()
        val part =
            Part(
                id = id("part"),
                profile =
                    PartProfile(
                        label = "Aux",
                        role = "Atmosphere",
                    ),
                voicings = listOf(voicing),
            )
        val binding = LayerBinding(id("binding"), part.id, id("device"), PitchRange(0, 127))
        val arrangement = Arrangement(id("a"), "Main", listOf(part), listOf(binding))
        val song =
            Song(
                id = id("s"),
                header = SongHeader(title = "Snapshot"),
                arrangements = listOf(arrangement),
                devices =
                    listOf(
                        Device(
                            id("device"),
                            "Device",
                            PitchRange(
                                0,
                                127,
                            ),
                        ),
                    ),
            )
        assertEquals("Atmosphere", song.arrangements[0].parts[0].role)
        assertEquals(53, voicing.notes[0].pitch.absolute)
        assertEquals(id("external-preset"), requireNotNull(voicing.provenance).id)
        assertEquals(null, binding.sound)
    }

    @Test
    public fun addingFourthAssignedPartLeavesAllPriorMusicAndDevicesUntouched() {
        val song = fourKeyboardSong()
        val devices = song.devices
        val original = song.arrangements[0]
        val independent = song.arrangements[1]
        val added =
            song.withArrangements(
                listOf(original.addPart(fourthPart(4), listOf(fourthBinding(4))), independent),
            )
        assertEquals(4, added.arrangements[0].parts.size)
        assertEquals(4, added.arrangements[0].bindings.size)
        for (index in 0..2) {
            assertSame(original.parts[index], added.arrangements[0].parts[index])
            assertSame(original.bindings[index], added.arrangements[0].bindings[index])
        }
        assertEquals(
            Hand.UNASSIGNED,
            added.arrangements[0]
                .parts[3]
                .events[0]
                .notes[0]
                .hand,
        )
        assertSame(independent, added.arrangements[1])
        assertSame(song.sections[0], added.sections[0])
        devices.forEachIndexed { index, device -> assertSame(device, added.devices[index]) }
        val unbound = Arrangement(original.id, original.label, original.parts)
        assertSame(original.parts[0], unbound.parts[0])
        assertEquals(1, unbound.parts[0].events.size)
    }
}

internal fun id(value: String): MusicId = MusicId(value)

internal val major7: Chord = Chord(Spelling(Letter.C), ChordQuality.MAJOR7)

internal fun note(
    name: String,
    letter: Letter,
    octave: Int,
    absolute: Int,
    hand: Hand = Hand.UNASSIGNED,
): NoteOccurrence = pitchedNote(name, Spelling(letter), octave, absolute, hand)

internal fun pitchedNote(
    name: String,
    spelling: Spelling,
    octave: Int,
    absolute: Int,
    hand: Hand,
): NoteOccurrence = NoteOccurrence(id(name), Pitch(spelling, octave, absolute), hand)

internal fun harmonic(
    name: String,
    start: Long,
    duration: Long,
): HarmonicEvent = HarmonicEvent(id(name), Timing(Rational.of(start), Rational.of(duration)), major7)

internal fun sectionWithLyrics(): Section =
    Section(
        id("verse"),
        "Verse",
        RepeatCount.of(2),
        listOf(Measure(id("measure"), harmony = listOf(harmonic("h", 0, 4)))),
        listOf(LyricLine(id("lyric"), "hold  the line\n", listOf(LyricAnchor(id("h"), 6)))),
        "Softly",
    )

internal fun performanceSong(): Song {
    val notes =
        listOf(
            note("c", Letter.C, 2, 36, Hand.LEFT),
            note("g", Letter.G, 2, 43, Hand.LEFT),
            note("e", Letter.E, 4, 64, Hand.RIGHT),
            note("b", Letter.B, 4, 71, Hand.RIGHT),
        )
    val event = PerformedEvent(id("event-p"), id("measure"), Timing(Rational.of(0), Rational.of(4)), notes)
    val parallel =
        PerformedEvent(
            id("event-q"),
            id("measure"),
            Timing(Rational.of(0), Rational.of(4)),
            listOf(note("q-e", Letter.E, 4, 64)),
        )
    val parts =
        listOf(
            Part(id = id("p"), profile = PartProfile(label = "Stage keys"), events = listOf(event)),
            Part(id = id("q"), profile = PartProfile(label = "Synth"), events = listOf(parallel)),
            Part(id = id("aux"), profile = PartProfile(label = "Auxiliary")),
            Part(id = id("fourth"), profile = PartProfile(label = "Fourth authored part")),
        )
    val layers =
        listOf(
            LayerBinding(id("layer-piano"), id("p"), id("device"), PitchRange(21, 108), "Piano"),
            LayerBinding(id("layer-pad"), id("p"), id("device"), PitchRange(21, 108), "Pad"),
        )
    return Song(
        id = id("song"),
        header = SongHeader(title = "The Quiet Atlas"),
        sections = listOf(sectionWithLyrics()),
        arrangements =
            listOf(
                Arrangement(id("a"), "Main", parts, layers),
                Arrangement(
                    id("independent"),
                    "Independent",
                    listOf(
                        independentPart(),
                    ),
                ),
            ),
        devices = listOf(Device(id("device"), "88-key controller", PitchRange(21, 108))),
    )
}

internal fun tiedSong(
    measures: List<Measure>,
    events: List<PerformedEvent>,
    ties: List<NoteTie>,
): Song =
    Song(
        id = id("s"),
        header = SongHeader(title = "Tied phrase"),
        sections =
            listOf(
                Section(
                    id("section"),
                    "Verse",
                    measures = measures,
                ),
            ),
        arrangements =
            listOf(
                Arrangement(
                    id("a"),
                    "Main",
                    listOf(
                        Part(
                            id = id("p"),
                            profile = PartProfile(label = "Keys"),
                            events = events,
                            ties = ties,
                        ),
                    ),
                ),
            ),
    )

internal fun aliasedGraph(): Pair<Song, () -> Unit> {
    val notes = mutableListOf(note("note", Letter.C, 4, 60))
    val event = PerformedEvent(id("event"), id("m"), Timing(Rational.of(0), Rational.of(1)), notes)
    val events = mutableListOf(event)
    val part = Part(id = id("part"), profile = PartProfile(label = "Keys"), events = events)
    val parts = mutableListOf(part)
    val bindings = mutableListOf(LayerBinding(id("binding"), part.id, id("device"), PitchRange(0, 127)))
    val arrangement = Arrangement(id("arrangement"), "Main", parts, bindings)
    val harmony = mutableListOf(harmonic("h", 0, 1))
    val measures = mutableListOf(Measure(id("m"), harmony = harmony))
    val anchors = mutableListOf(LyricAnchor(id("h"), 0))
    val lyrics = mutableListOf(LyricLine(id("lyric"), "exact text", anchors))
    val sections = mutableListOf(Section(id("section"), "Verse", measures = measures, lyrics = lyrics))
    val arrangements = mutableListOf(arrangement)
    val devices = mutableListOf(Device(id("device"), "Controller", PitchRange(0, 127)))
    val song =
        Song(
            id = id("song"),
            header = SongHeader(title = "Immutable"),
            sections = sections,
            arrangements = arrangements,
            devices = devices,
        )
    return song to {
        listOf(
            notes,
            events,
            parts,
            bindings,
            harmony,
            measures,
            anchors,
            lyrics,
            sections,
            arrangements,
            devices,
        ).forEach {
            it.clear()
        }
    }
}

internal fun fourthPart(index: Int): Part =
    Part(
        id = id("part-$index"),
        profile =
            PartProfile(
                label = "Part $index",
                role = "Role $index",
            ),
        events =
            listOf(
                PerformedEvent(
                    id("event-$index"),
                    id("m"),
                    Timing(Rational.of(0), Rational.of(1)),
                    listOf(note("note-$index", Letter.C, 4, 60)),
                ),
            ),
    )

internal fun fourthBinding(index: Int): LayerBinding =
    LayerBinding(
        id("binding-$index"),
        id("part-$index"),
        id("device-$index"),
        PitchRange(21, 108),
        "Sound $index",
    )

internal fun fourKeyboardSong(): Song {
    val devices = (1..4).map { Device(id("device-$it"), "Keyboard $it", PitchRange(21, 108)) }

    val original = Arrangement(id("a"), "Main", (1..3).map(::fourthPart), (1..3).map(::fourthBinding))
    val independent = Arrangement(id("q"), "Independent", emptyList())
    val song =
        Song(
            id = id("s"),
            header = SongHeader(title = "Four keyboards"),
            sections =
                listOf(
                    Section(
                        id("section"),
                        "Verse",
                        measures = listOf(Measure(id("m"))),
                    ),
                ),
            arrangements =
                listOf(
                    original,
                    independent,
                ),
            devices = devices,
        )
    return song
}

internal fun independentPart(): Part =
    Part(
        id("independent-p"),
        PartProfile("Other"),
        events =
            listOf(
                PerformedEvent(
                    id("independent-event"),
                    id("measure"),
                    Timing(Rational.of(0), Rational.of(4)),
                    listOf(note("independent-b", Letter.B, 4, 71, Hand.RIGHT)),
                ),
            ),
    )
