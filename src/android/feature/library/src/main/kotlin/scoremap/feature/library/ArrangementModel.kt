package scoremap.feature.library

import scoremap.library.ArrangementCommands
import scoremap.library.BindingId
import scoremap.library.BindingRequest
import scoremap.library.DeviceId
import scoremap.library.DeviceRef
import scoremap.library.DeviceSpec
import scoremap.library.HandRole
import scoremap.library.IdSource
import scoremap.library.Library
import scoremap.library.LibraryService
import scoremap.library.Mode
import scoremap.library.Outcome
import scoremap.library.PartId
import scoremap.library.PartRef
import scoremap.library.SongId
import scoremap.music.Piano
import scoremap.music.PitchRange

/** Devices, hands and bindings of one song. Each action answers what the musician is told. */
public class ArrangementModel(
    private val service: LibraryService,
    private val ids: IdSource,
    private val commandIds: IdSource,
) {
    /** Blank range text means all 88 keys; otherwise a range such as "C3-B4". */
    public fun addDevice(
        songId: String,
        name: String,
        rangeText: String,
        mode: Mode,
    ): Notice {
        val range = if (rangeText.isBlank()) Piano.range else parseRange(rangeText)
        return if (range == null) {
            Notice.INVALID_RANGE
        } else {
            result(
                Notice.DEVICE_ADDED,
            ) { ArrangementCommands.addDevice(it, mode, SongId(songId), DeviceSpec(name, range), ids) }
        }
    }

    public fun setDeviceRange(
        songId: String,
        deviceId: String,
        rangeText: String,
        mode: Mode,
    ): Notice {
        val range = parseRange(rangeText)
        return if (range == null) {
            Notice.INVALID_RANGE
        } else {
            result(Notice.SHEET_SAVED) {
                ArrangementCommands.setDeviceRange(it, mode, DeviceRef(SongId(songId), DeviceId(deviceId)), range)
            }
        }
    }

    public fun removeDevice(
        songId: String,
        deviceId: String,
        confirmed: Boolean,
        mode: Mode,
    ): Notice =
        result(Notice.SHEET_SAVED) {
            ArrangementCommands.removeDevice(it, mode, DeviceRef(SongId(songId), DeviceId(deviceId)), confirmed)
        }

    /** Null clears the hand metadata. */
    public fun setHand(
        songId: String,
        partId: String,
        hand: HandRole?,
        mode: Mode,
    ): Notice =
        result(Notice.SHEET_SAVED) {
            ArrangementCommands.setPartHand(it, mode, PartRef(SongId(songId), PartId(partId)), hand)
        }

    /**
     * "C3-B4" binds the part over that range; a trailing "!" accepts played notes the range leaves out, which are
     * kept unchanged. Blank text binds over the whole device.
     */
    public fun bind(
        request: BindText,
        mode: Mode,
    ): Notice {
        val accept = request.rangeText.trim().endsWith("!")
        val text = request.rangeText.trim().removeSuffix("!")
        val range = if (text.isBlank()) request.deviceRange else parseRange(text)
        return if (range == null) {
            Notice.INVALID_RANGE
        } else {
            val part = PartRef(SongId(request.songId), PartId(request.partId))
            val binding = BindingRequest(part, DeviceId(request.deviceId), range, request.sound, accept)
            result(Notice.BOUND) { ArrangementCommands.addBinding(it, mode, binding, ids) }
        }
    }

    public fun removeBinding(
        songId: String,
        bindingId: String,
        mode: Mode,
    ): Notice =
        result(Notice.SHEET_SAVED) { ArrangementCommands.removeBinding(it, mode, SongId(songId), BindingId(bindingId)) }

    private fun result(
        success: Notice,
        command: (Library) -> Outcome<Library>,
    ): Notice = resultNotice(service.execute(commandIds.next(), command), success)

    internal companion object {
        /** Reads "C3-B4" into an inclusive range; null when it is not two exact pitches in order. */
        fun parseRange(text: String): PitchRange? {
            val ends = text.trim().split('-', limit = 2)
            val low = ends.getOrNull(0)?.let(Piano::parseLabel)
            val high = ends.getOrNull(1)?.let(Piano::parseLabel)
            return if (low != null && high != null && low <= high) PitchRange(low, high) else null
        }
    }
}

/** What a bind request carries: the part and device, the range text, the sound and the device's own range. */
public data class BindText(
    val songId: String,
    val partId: String,
    val deviceId: String,
    val rangeText: String,
    val sound: String,
    val deviceRange: PitchRange,
)
