package scoremap.exchange

import scoremap.library.GraphBinding
import scoremap.library.GraphDevice
import scoremap.music.PitchRange

/** Reads the devices and bindings of a song; any range or position the domain cannot represent is invalid. */
internal class ArrangementReader(
    private val limits: TransferLimits,
) {
    fun devices(value: Json): List<GraphDevice> {
        val items = (value as? Json.Array ?: invalid()).items
        need(items.size <= limits.maxDevicesPerSong, Rejection.OVERSIZED)
        return items.map(::device)
    }

    fun bindings(value: Json): List<GraphBinding> {
        val items = (value as? Json.Array ?: invalid()).items
        need(items.size <= limits.maxBindingsPerSong, Rejection.OVERSIZED)
        return items.map(::binding)
    }

    private fun device(value: Json): GraphDevice {
        val obj = value as? Json.Obj ?: invalid()
        exactly(obj, setOf("name", "lower", "upper"))
        return GraphDevice(text(obj, "name"), range(obj))
    }

    private fun binding(value: Json): GraphBinding {
        val obj = value as? Json.Obj ?: invalid()
        exactly(obj, setOf("part", "device", "lower", "upper"), optional = setOf("sound"))
        val sound = obj.fields["sound"]?.let { (it as? Json.Text ?: invalid()).value }.orEmpty()
        return GraphBinding(index(obj, "part"), index(obj, "device"), range(obj), sound)
    }

    private fun range(obj: Json.Obj): PitchRange =
        runCatching { PitchRange(index(obj, "lower"), index(obj, "upper")) }.getOrNull() ?: invalid()

    private fun index(
        obj: Json.Obj,
        name: String,
    ): Int {
        val number = (obj.fields[name] as? Json.Integer ?: invalid()).value
        if (number !in 0..Int.MAX_VALUE) invalid()
        return number.toInt()
    }
}
