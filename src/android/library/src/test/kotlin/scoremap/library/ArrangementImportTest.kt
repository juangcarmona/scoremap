package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Test
import scoremap.music.PitchRange

public class ArrangementImportTest {
    private val ids = SequentialIds()

    private fun graph(
        devices: List<GraphDevice> = listOf(GraphDevice(" Stage piano "), GraphDevice("Mini", PitchRange(48, 84))),
        bindings: List<GraphBinding> =
            listOf(GraphBinding(0, 0, PitchRange(60, 108), " Piano "), GraphBinding(1, 1, PitchRange(48, 84))),
        parts: List<GraphPart> = listOf(GraphPart("Right", hand = HandRole.RIGHT), GraphPart("Pad")),
    ) = TransferGraph(
        listOf(GraphSong("a", "Song", emptyList(), parts = parts, devices = devices, bindings = bindings)),
        null,
    )

    @Test
    public fun importsDevicesBindingsAndHandsWithFreshConsistentIdentities() {
        val song = ok(ImportCommands.importGraph(Library.empty(), Mode.EDIT, graph(), ids)).songs.single()
        assertEquals(listOf("Stage piano", "Mini"), song.devices.map { it.name })
        assertEquals(listOf(HandRole.RIGHT, null), song.parts.map { it.hand })
        assertEquals(listOf(song.parts[0].id, song.parts[1].id), song.bindings.map { it.partId })
        assertEquals(listOf(song.devices[0].id, song.devices[1].id), song.bindings.map { it.deviceId })
        assertEquals(listOf("Piano", ""), song.bindings.map { it.sound })
        val identities =
            song.devices.map { it.id.value } + song.bindings.map { it.id.value } + song.parts.map { it.id.value }
        assertEquals(identities.size, identities.toSet().size)
    }

    @Test
    public fun refusesDanglingPositionsRangesOutsideTheDeviceAndBlankNames() {
        val cases =
            listOf(
                Refusal.DANGLING_REFERENCE to graph(bindings = listOf(GraphBinding(5, 0, PitchRange(60, 72)))),
                Refusal.DANGLING_REFERENCE to graph(bindings = listOf(GraphBinding(0, 9, PitchRange(60, 72)))),
                Refusal.OUT_OF_DEVICE_RANGE to graph(bindings = listOf(GraphBinding(1, 1, PitchRange(40, 84)))),
                Refusal.INVALID_NAME to
                    graph(devices = listOf(GraphDevice(" "), GraphDevice("Mini")), bindings = emptyList()),
            )
        for ((refusal, g) in cases) {
            assertEquals(
                refusal,
                (ImportCommands.importGraph(Library.empty(), Mode.EDIT, g, ids) as Outcome.Refused).refusal,
            )
        }
    }

    @Test
    public fun exportAndImportAgainKeepsTheArrangement() {
        val first = ok(ImportCommands.importGraph(Library.empty(), Mode.EDIT, graph(), ids))
        val exported = TransferGraph.ofSong(first.songs.single())
        assertEquals(
            graph()
                .songs
                .single()
                .devices
                .map { it.copy(name = it.name.trim()) },
            exported.songs.single().devices,
        )
        assertEquals(
            graph()
                .songs
                .single()
                .bindings
                .map { it.copy(sound = it.sound.trim()) },
            exported.songs.single().bindings,
        )
        assertEquals(
            listOf(HandRole.RIGHT, null),
            exported.songs
                .single()
                .parts
                .map { it.hand },
        )
        assertEquals(2, ok(ImportCommands.importGraph(first, Mode.EDIT, exported, ids)).songs.size)
    }

    private fun ok(outcome: Outcome<Library>): Library =
        (outcome as? Outcome.Accepted)?.value ?: error("Expected acceptance but got $outcome")

    private class SequentialIds : IdSource {
        private var next = 0

        override fun next(): String = "new-${next++}"
    }
}
