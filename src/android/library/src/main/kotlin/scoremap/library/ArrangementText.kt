package scoremap.library

import scoremap.music.PitchRange

/** A lossless text form of a song's devices and bindings for adapters that store them in one column. */
public object ArrangementText {
    public fun encode(
        devices: List<Device>,
        bindings: List<Binding>,
    ): String =
        (
            devices.map { "D|${escapeText(it.id.value)}|${escapeText(it.name)}|${it.range.lower}|${it.range.upper}" } +
                bindings.map {
                    "B|${escapeText(it.id.value)}|${escapeText(it.partId.value)}|${escapeText(it.deviceId.value)}|" +
                        "${it.range.lower}|${it.range.upper}|${escapeText(it.sound)}"
                }
        ).joinToString("\n")

    /** Reads text written by [encode]; text that is not valid is a corrupt store and is never half-read. */
    public fun decode(text: String): Pair<List<Device>, List<Binding>> {
        val lines = if (text.isEmpty()) emptyList() else text.split('\n').map { it.split('|') }
        val devices = lines.filter { it.firstOrNull() == "D" }.map(::readDevice)
        val bindings = lines.filter { it.firstOrNull() == "B" }.map(::readBinding)
        check(devices.size + bindings.size == lines.size) { "Corrupt arrangement" }
        return devices to bindings
    }

    private fun readDevice(f: List<String>): Device {
        check(f.size == DEVICE_FIELDS) { "Corrupt device" }
        return Device(DeviceId(unescapeText(f[ID])), unescapeText(f[NAME]), range(f[LOWER], f[UPPER]))
    }

    private fun readBinding(f: List<String>): Binding {
        check(f.size == BINDING_FIELDS) { "Corrupt binding" }
        return Binding(
            BindingId(unescapeText(f[ID])),
            PartId(unescapeText(f[PART])),
            DeviceId(unescapeText(f[DEVICE])),
            range(f[BINDING_LOWER], f[BINDING_UPPER]),
            unescapeText(f[SOUND]),
        )
    }

    private fun range(
        lower: String,
        upper: String,
    ): PitchRange {
        val low = checkNotNull(lower.toIntOrNull()) { "Corrupt range" }
        return PitchRange(low, checkNotNull(upper.toIntOrNull()) { "Corrupt range" })
    }

    private const val DEVICE_FIELDS = 5
    private const val BINDING_FIELDS = 7
    private const val ID = 1
    private const val NAME = 2
    private const val LOWER = 3
    private const val UPPER = 4
    private const val PART = 2
    private const val DEVICE = 3
    private const val BINDING_LOWER = 4
    private const val BINDING_UPPER = 5
    private const val SOUND = 6
}
