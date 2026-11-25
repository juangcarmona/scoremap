package scoremap.exchange

import scoremap.library.GraphBinding
import scoremap.library.GraphDevice
import scoremap.library.GraphSong

/** Writes the devices and bindings of a song, addressing parts and devices by position. */
internal object ArrangementWriter {
    fun song(song: GraphSong): String = devices(song) + bindings(song)

    private fun devices(song: GraphSong): String =
        if (song.devices.isEmpty()) "" else song.devices.joinToString(",", ",\"devices\":[", "]") { device(it) }

    private fun bindings(song: GraphSong): String =
        if (song.bindings.isEmpty()) "" else song.bindings.joinToString(",", ",\"bindings\":[", "]") { binding(it) }

    private fun device(device: GraphDevice): String =
        "{\"name\":${JsonWriter.quote(device.name)},\"lower\":${device.range.lower},\"upper\":${device.range.upper}}"

    private fun binding(binding: GraphBinding): String {
        val sound = if (binding.sound.isEmpty()) "" else ",\"sound\":${JsonWriter.quote(binding.sound)}"
        return "{\"part\":${binding.part},\"device\":${binding.device},\"lower\":${binding.range.lower}," +
            "\"upper\":${binding.range.upper}$sound}"
    }
}
