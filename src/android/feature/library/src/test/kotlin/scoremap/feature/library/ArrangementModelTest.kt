package scoremap.feature.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import scoremap.library.Hand
import scoremap.library.HandRole
import scoremap.library.LibraryService
import scoremap.library.Mode
import scoremap.library.PerformedNote
import scoremap.music.Piano
import scoremap.music.PitchRange

public class ArrangementModelTest {
    private val store = MemoryStore()
    private val service = LibraryService(store)
    private val songs = LibraryScreenModel(service, Ids("song"), Ids("songcmd"))
    private val detail = SongDetailModel(service, Ids("section"), Ids("detailcmd"))
    private val form = FormModel(service, Ids("form"), Ids("formcmd"))
    private val parts = PartsModel(service, Ids("part"), Ids("partcmd"))
    private val arrangement = ArrangementModel(service, Ids("arr"), Ids("arrcmd"))
    private val songId =
        songs
            .createSong("Song", Mode.EDIT)
            .songs
            .single()
            .id
    private val partId: String

    init {
        parts.addPart(songId, "Right hand", Mode.EDIT)
        partId = state().parts.single().id
    }

    private fun state() = requireNotNull(detail.load(songId))

    private fun bind(
        range: String,
        deviceId: String = state().devices.first().id,
    ): Notice {
        val own = state().devices.first { it.id == deviceId }.range
        val whole = ArrangementModel.parseRange(own) ?: Piano.range
        return arrangement.bind(BindText(songId, partId, deviceId, range, "", whole), Mode.EDIT)
    }

    @Test
    public fun aDeviceDefaultsToAll88KeysAndAcceptsARangeInExactPitches() {
        assertEquals(Notice.DEVICE_ADDED, arrangement.addDevice(songId, " Stage piano ", "", Mode.EDIT))
        assertEquals(Notice.DEVICE_ADDED, arrangement.addDevice(songId, "Mini", "C3-C6", Mode.EDIT))
        assertEquals(listOf("Stage piano" to "A0-C8", "Mini" to "C3-C6"), state().devices.map { it.name to it.range })
        assertEquals(Notice.INVALID_RANGE, arrangement.addDevice(songId, "X", "C6-C3", Mode.EDIT))
        assertEquals(Notice.INVALID_RANGE, arrangement.addDevice(songId, "X", "H1-C3", Mode.EDIT))
        assertEquals(Notice.INVALID_NAME, arrangement.addDevice(songId, " ", "", Mode.EDIT))
    }

    @Test
    public fun bindingTakesTheWholeDeviceWhenTheRangeIsBlankAndKeepsSplitsAndLayers() {
        arrangement.addDevice(songId, "Mini", "C3-C6", Mode.EDIT)
        assertEquals(Notice.BOUND, bind(""))
        assertEquals(Notice.BOUND, bind("C3-B4"))
        assertEquals(Notice.BOUND, bind("C5-C6"))
        assertEquals(
            listOf("Mini C3-C6", "Mini C3-B4", "Mini C5-C6"),
            state().parts.single().bindings.map {
                "${it.device} ${it.range}"
            },
        )
        assertEquals(Notice.OUT_OF_DEVICE, bind("A0-C4"))
        assertEquals(Notice.INVALID_RANGE, bind("nonsense"))
    }

    @Test
    public fun aRangeThatLeavesPlayedNotesOutNeedsTheBangAndTheNotesAreKept() {
        detail.addSection(songId, "Verse", Mode.EDIT)
        val sectionId = state().sections.single().id
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
            "C",
            Mode.EDIT,
        )
        parts.saveVoicing(
            songId,
            partId,
            state().chords.single().eventId,
            listOf(PerformedNote(40, Hand.LEFT), PerformedNote(72, Hand.RIGHT)),
            Mode.EDIT,
        )
        arrangement.addDevice(songId, "Stage piano", "", Mode.EDIT)
        assertEquals(Notice.EXCLUDES_NOTES, bind("C4-C6"))
        assertEquals(Notice.BOUND, bind("C4-C6!"))
        assertEquals(
            listOf(40, 72),
            state()
                .parts
                .single()
                .voicings
                .single()
                .notes
                .map { it.midi },
        )
    }

    @Test
    public fun handsAreOptionalAndRemovingADeviceNeedsConfirmationWhenBound() {
        assertNull(state().parts.single().hand)
        assertEquals(Notice.SHEET_SAVED, arrangement.setHand(songId, partId, HandRole.CONTEXTUAL, Mode.EDIT))
        assertEquals(HandRole.CONTEXTUAL, state().parts.single().hand)
        arrangement.setHand(songId, partId, null, Mode.EDIT)
        assertNull(state().parts.single().hand)
        arrangement.addDevice(songId, "Stage piano", "", Mode.EDIT)
        val device = state().devices.single().id
        bind("")
        assertEquals(1, state().devices.single().bindingCount)
        assertEquals(Notice.IN_USE, arrangement.removeDevice(songId, device, false, Mode.EDIT))
        assertEquals(Notice.SHEET_SAVED, arrangement.removeDevice(songId, device, true, Mode.EDIT))
        assertEquals(emptyList<DeviceItem>(), state().devices)
        assertEquals(emptyList<BindingItem>(), state().parts.single().bindings)
    }

    @Test
    public fun aBindingCanBeRemovedAloneAndTheDeviceRangeCannotExcludeIt() {
        arrangement.addDevice(songId, "Stage piano", "", Mode.EDIT)
        val device = state().devices.single().id
        bind("C2-C6")
        assertEquals(Notice.OUT_OF_DEVICE, arrangement.setDeviceRange(songId, device, "C3-C6", Mode.EDIT))
        assertEquals(Notice.SHEET_SAVED, arrangement.setDeviceRange(songId, device, "C1-C7", Mode.EDIT))
        assertEquals("C1-C7", state().devices.single().range)
        assertEquals(Notice.INVALID_RANGE, arrangement.setDeviceRange(songId, device, "", Mode.EDIT))
        val binding =
            state()
                .parts
                .single()
                .bindings
                .single()
                .id
        assertEquals(Notice.SHEET_SAVED, arrangement.removeBinding(songId, binding, Mode.EDIT))
        assertEquals(emptyList<BindingItem>(), state().parts.single().bindings)
    }

    @Test
    public fun everyArrangementEditIsRefusedInPerformanceMode() {
        arrangement.addDevice(songId, "Stage piano", "", Mode.EDIT)
        val device = state().devices.single().id
        val commits = store.commits
        val refused =
            listOf(
                arrangement.addDevice(songId, "X", "", Mode.PERFORMANCE),
                arrangement.setDeviceRange(songId, device, "C1-C7", Mode.PERFORMANCE),
                arrangement.removeDevice(songId, device, true, Mode.PERFORMANCE),
                arrangement.setHand(songId, partId, HandRole.LEFT, Mode.PERFORMANCE),
                arrangement.bind(BindText(songId, partId, device, "", "", PitchRange(21, 108)), Mode.PERFORMANCE),
                arrangement.removeBinding(songId, "x", Mode.PERFORMANCE),
            )
        for (notice in refused) assertEquals(Notice.EDIT_MODE_REQUIRED, notice)
        assertEquals(commits, store.commits)
    }
}
