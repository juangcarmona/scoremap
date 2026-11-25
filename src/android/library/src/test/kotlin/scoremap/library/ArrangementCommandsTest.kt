package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import scoremap.music.Piano
import scoremap.music.PitchRange

public class ArrangementCommandsTest {
    private val ids = SequentialIds()
    private val full = Piano.range

    private class Fixture(
        val library: Library,
        val songId: SongId,
        val part: PartRef,
        val device: DeviceRef,
    )

    private fun fixture(): Fixture {
        var library = accepted(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "Song", ids))
        val songId = library.songs.single().id
        library = accepted(PartCommands.addPart(library, Mode.EDIT, songId, "Right hand", ids))
        library =
            accepted(ArrangementCommands.addDevice(library, Mode.EDIT, songId, DeviceSpec("  Stage piano ", full), ids))
        val song = library.songs.single()
        return Fixture(
            library,
            songId,
            PartRef(songId, song.parts.single().id),
            DeviceRef(songId, song.devices.single().id),
        )
    }

    private fun bind(
        f: Fixture,
        library: Library = f.library,
        range: PitchRange = PitchRange(48, 72),
        accept: Boolean = false,
        sound: String = " Piano ",
    ) = ArrangementCommands.addBinding(
        library,
        Mode.EDIT,
        BindingRequest(f.part, f.device.deviceId, range, sound, accept),
        ids,
    )

    private fun notes(
        library: Library,
        f: Fixture,
        vararg midi: Int,
    ): Library {
        val withSection = accepted(LibraryCommands.insertSection(library, Mode.EDIT, f.songId, "Verse", ids))
        val ref =
            SectionRef(
                f.songId,
                withSection.songs
                    .single()
                    .sections
                    .single()
                    .id,
            )
        val withMeasure = accepted(ChordCommands.addMeasure(withSection, Mode.EDIT, ref, Meter.COMMON, ids))
        val measure =
            withMeasure.songs
                .single()
                .sections
                .single()
                .measures
                .single()
                .id
        val request = ChordRequest(Fraction.ZERO, Fraction.of(4, 1), ChordSpec("C", "major"))
        val chord = accepted(ChordCommands.addChord(withMeasure, Mode.EDIT, MeasureRef(ref, measure), request, ids))
        val event =
            chord.songs
                .single()
                .sections
                .single()
                .measures
                .single()
                .events
                .single()
                .id
        return accepted(
            PartCommands.setVoicing(chord, Mode.EDIT, f.part, event, midi.map { PerformedNote(it, Hand.RIGHT) }),
        )
    }

    @Test
    public fun aSongStartsWithNoDevicesAndAnyNumberOfDevicesAndPartsIsValid() {
        var library = accepted(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "Song", ids))
        val songId = library.songs.single().id
        assertEquals(emptyList<Device>(), library.songs.single().devices)
        repeat(4) {
            library =
                accepted(ArrangementCommands.addDevice(library, Mode.EDIT, songId, DeviceSpec("Keys $it", full), ids))
            library = accepted(PartCommands.addPart(library, Mode.EDIT, songId, "Part $it", ids))
        }
        assertEquals(
            4,
            library.songs
                .single()
                .devices.size,
        )
        assertEquals(
            4,
            library.songs
                .single()
                .parts.size,
        )
        assertEquals(
            Refusal.INVALID_NAME,
            refusal(ArrangementCommands.addDevice(library, Mode.EDIT, songId, DeviceSpec(" ", full), ids)),
        )
    }

    @Test
    public fun bindsAPartToADeviceOverAnInclusiveRangeAndKeepsSplitsAndLayersApart() {
        val f = fixture()
        val split = accepted(bind(f, range = PitchRange(21, 59), sound = ""))
        val layered = accepted(bind(f, split, PitchRange(48, 108), sound = "Strings"))
        val bindings = layered.songs.single().bindings
        assertEquals(listOf(PitchRange(21, 59), PitchRange(48, 108)), bindings.map { it.range })
        assertEquals(listOf("", "Strings"), bindings.map { it.sound })
        assertEquals(2, bindings.map { it.id }.toSet().size)
        assertEquals(f.part.partId, bindings.first().partId)
        assertEquals(
            f.library.songs
                .single()
                .parts,
            layered.songs.single().parts,
        )
    }

    @Test
    public fun aRangeMustLieWithinTheConfiguredDeviceRange() {
        val f = fixture()
        val small = accepted(ArrangementCommands.setDeviceRange(f.library, Mode.EDIT, f.device, PitchRange(36, 96)))
        assertEquals(
            PitchRange(36, 96),
            small.songs
                .single()
                .devices
                .single()
                .range,
        )
        assertEquals(Refusal.OUT_OF_DEVICE_RANGE, refusal(bind(f, small, PitchRange(21, 60))))
        assertEquals(Refusal.OUT_OF_DEVICE_RANGE, refusal(bind(f, small, PitchRange(60, 100))))
        val bound = accepted(bind(f, small, PitchRange(36, 96)))
        assertEquals(
            Refusal.OUT_OF_DEVICE_RANGE,
            refusal(ArrangementCommands.setDeviceRange(bound, Mode.EDIT, f.device, PitchRange(40, 96))),
        )
        assertEquals(
            PitchRange(36, 96),
            bound.songs
                .single()
                .devices
                .single()
                .range,
        )
        assertEquals(
            Refusal.UNKNOWN_DEVICE,
            refusal(
                ArrangementCommands.setDeviceRange(f.library, Mode.EDIT, f.device.copy(deviceId = DeviceId("x")), full),
            ),
        )
    }

    @Test
    public fun aRangeThatLeavesPlayedNotesOutIsRefusedUntilAcceptedAndNothingIsChanged() {
        val f = fixture()
        val played = notes(f.library, f, 40, 60, 100)
        assertEquals(Refusal.EXCLUDES_NOTES, refusal(bind(f, played, PitchRange(48, 72))))
        accepted(bind(f, played, PitchRange(21, 108)))
        val accepted = accepted(bind(f, played, PitchRange(48, 72), accept = true))
        assertEquals(played.songs.single().parts, accepted.songs.single().parts)
        assertEquals(
            listOf(40, 60, 100),
            accepted.songs
                .single()
                .parts
                .single()
                .voicings
                .single()
                .notes
                .map { it.midi },
        )
    }

    @Test
    public fun phraseNotesCountAsPlayedNotesToo() {
        val f = fixture()
        var library = accepted(PhraseCommands.addPhrase(f.library, Mode.EDIT, PhraseTarget(f.part, "Theme"), ids))
        val phrase =
            library.songs
                .single()
                .parts
                .single()
                .phrases
                .single()
                .id
        val items = listOf(PhraseItem(PerformedNote(100, Hand.RIGHT)), PhraseItem(null))
        library = accepted(PhraseCommands.setItems(library, Mode.EDIT, PhraseRef(f.part, phrase), items))
        assertEquals(Refusal.EXCLUDES_NOTES, refusal(bind(f, library, PitchRange(48, 72))))
    }

    @Test
    public fun handMetadataIsOptionalPerPartAndNeedsNoOneToOneMapping() {
        val f = fixture()
        assertNull(
            f.library.songs
                .single()
                .parts
                .single()
                .hand,
        )
        for (role in HandRole.entries) {
            val library = accepted(ArrangementCommands.setPartHand(f.library, Mode.EDIT, f.part, role))
            assertEquals(
                role,
                library.songs
                    .single()
                    .parts
                    .single()
                    .hand,
            )
        }
        val cleared = accepted(ArrangementCommands.setPartHand(f.library, Mode.EDIT, f.part, null))
        assertNull(
            cleared.songs
                .single()
                .parts
                .single()
                .hand,
        )
        val two = accepted(PartCommands.addPart(f.library, Mode.EDIT, f.songId, "Left hand", ids))
        val both = accepted(ArrangementCommands.setPartHand(two, Mode.EDIT, f.part, HandRole.BOTH))
        assertEquals(
            listOf(HandRole.BOTH, null),
            both.songs
                .single()
                .parts
                .map { it.hand },
        )
        assertEquals(
            Refusal.UNKNOWN_PART,
            refusal(ArrangementCommands.setPartHand(f.library, Mode.EDIT, f.part.copy(partId = PartId("x")), null)),
        )
    }

    @Test
    public fun removingABindingLeavesTheContentAndRemovingAReferencedDeviceNeedsConfirmation() {
        val f = fixture()
        val library = accepted(bind(f, notes(f.library, f, 60)))
        val bindingId =
            library.songs
                .single()
                .bindings
                .single()
                .id
        assertEquals(Refusal.IN_USE, refusal(ArrangementCommands.removeDevice(library, Mode.EDIT, f.device, false)))
        val unbound = accepted(ArrangementCommands.removeBinding(library, Mode.EDIT, f.songId, bindingId))
        assertEquals(library.songs.single().parts, unbound.songs.single().parts)
        assertEquals(emptyList<Binding>(), unbound.songs.single().bindings)
        assertEquals(
            Refusal.UNKNOWN_BINDING,
            refusal(ArrangementCommands.removeBinding(library, Mode.EDIT, f.songId, BindingId("x"))),
        )
        val gone = accepted(ArrangementCommands.removeDevice(library, Mode.EDIT, f.device, true))
        assertEquals(emptyList<Device>(), gone.songs.single().devices)
        assertEquals(emptyList<Binding>(), gone.songs.single().bindings)
        assertEquals(library.songs.single().parts, gone.songs.single().parts)
        accepted(ArrangementCommands.removeDevice(f.library, Mode.EDIT, f.device, false))
    }

    @Test
    public fun removingABoundPartNeedsConfirmationAndRemovesItsBindingsOnly() {
        val f = fixture()
        val second = accepted(PartCommands.addPart(f.library, Mode.EDIT, f.songId, "Bass", ids))
        val other =
            PartRef(
                f.songId,
                second.songs
                    .single()
                    .parts
                    .last()
                    .id,
            )
        var library = accepted(bind(f, second))
        val request = BindingRequest(other, f.device.deviceId, PitchRange(21, 47))
        library = accepted(ArrangementCommands.addBinding(library, Mode.EDIT, request, ids))
        assertEquals(Refusal.IN_USE, refusal(PartCommands.removePart(library, Mode.EDIT, f.part, false)))
        val removed = accepted(PartCommands.removePart(library, Mode.EDIT, f.part, true))
        assertEquals(
            listOf(other.partId),
            removed.songs
                .single()
                .bindings
                .map { it.partId },
        )
        assertEquals(
            listOf(f.device.deviceId),
            removed.songs
                .single()
                .devices
                .map { it.id },
        )
    }

    @Test
    public fun restoringARevisionBringsBackDevicesAndBindings() {
        val f = fixture()
        val bound = accepted(bind(f))
        val kept = bound.songs.single().revision
        val cleared = accepted(ArrangementCommands.removeDevice(bound, Mode.EDIT, f.device, true))
        val restored =
            accepted(
                RetentionCommands.restoreRevision(cleared, Mode.EDIT, f.songId, kept, cleared.songs.single().revision),
            )
        assertEquals(bound.songs.single().devices, restored.songs.single().devices)
        assertEquals(bound.songs.single().bindings, restored.songs.single().bindings)
    }

    @Test
    public fun performanceModeRefusesEveryArrangementEditBeforeValidating() {
        val f = fixture()
        val missing = f.device.copy(deviceId = DeviceId("x"))
        val attempts =
            listOf(
                ArrangementCommands.addDevice(f.library, Mode.PERFORMANCE, f.songId, DeviceSpec(" ", full), ids),
                ArrangementCommands.setDeviceRange(f.library, Mode.PERFORMANCE, missing, full),
                ArrangementCommands.removeDevice(f.library, Mode.PERFORMANCE, missing, true),
                ArrangementCommands.setPartHand(f.library, Mode.PERFORMANCE, f.part, HandRole.LEFT),
                ArrangementCommands.addBinding(
                    f.library,
                    Mode.PERFORMANCE,
                    BindingRequest(f.part, f.device.deviceId, full),
                    ids,
                ),
                ArrangementCommands.removeBinding(f.library, Mode.PERFORMANCE, f.songId, BindingId("x")),
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
