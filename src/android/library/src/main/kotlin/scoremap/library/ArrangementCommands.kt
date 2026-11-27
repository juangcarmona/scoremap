package scoremap.library

import scoremap.music.PitchRange

/** A device to add: its name and the inclusive range it can play. */
public data class DeviceSpec(
    val name: String,
    val range: PitchRange,
)

/** Where a device command acts. */
public data class DeviceRef(
    val songId: SongId,
    val deviceId: DeviceId,
)

/** A binding to create. [acceptExcluded] is the musician's explicit answer to notes the range leaves out. */
public data class BindingRequest(
    val part: PartRef,
    val deviceId: DeviceId,
    val range: PitchRange,
    val sound: String = "",
    val acceptExcluded: Boolean = false,
)

/**
 * Devices, part hands and bindings. Devices and bindings never change note content: a range that leaves played
 * notes out is refused until the musician accepts it, and the notes are kept as they are.
 */
public object ArrangementCommands {
    public fun addDevice(
        library: Library,
        mode: Mode,
        songId: SongId,
        spec: DeviceSpec,
        ids: IdSource,
    ): Outcome<Library> =
        SongEdit.run(library, mode, songId) { song ->
            val name = spec.name.trim()
            val id = ids.next()
            when {
                name.isEmpty() -> refuse(Refusal.INVALID_NAME)
                id in library.purged -> refuse(Refusal.PURGED)
                library.identityInUse(id) -> refuse(Refusal.DUPLICATE_ID)
                else -> accept(song.copy(devices = song.devices + Device(DeviceId(id), name, spec.range)))
            }
        }

    /** A device range must keep containing every binding that uses the device. */
    public fun setDeviceRange(
        library: Library,
        mode: Mode,
        ref: DeviceRef,
        range: PitchRange,
    ): Outcome<Library> =
        SongEdit.run(library, mode, ref.songId) { song ->
            when {
                song.devices.none { it.id == ref.deviceId } -> {
                    refuse(Refusal.UNKNOWN_DEVICE)
                }

                song.bindings.any { it.deviceId == ref.deviceId && !it.range.within(range) } -> {
                    refuse(Refusal.OUT_OF_DEVICE_RANGE)
                }

                else -> {
                    accept(
                        song.copy(
                            devices =
                                song.devices.map {
                                    if (it.id ==
                                        ref.deviceId
                                    ) {
                                        it.copy(range = range)
                                    } else {
                                        it
                                    }
                                },
                        ),
                    )
                }
            }
        }

    /** Removing a device removes its bindings, so it needs [confirmed] when any exist; note content is untouched. */
    public fun removeDevice(
        library: Library,
        mode: Mode,
        ref: DeviceRef,
        confirmed: Boolean,
    ): Outcome<Library> =
        SongEdit.run(library, mode, ref.songId) { song ->
            val used = song.bindings.any { it.deviceId == ref.deviceId }
            when {
                song.devices.none { it.id == ref.deviceId } -> {
                    refuse(Refusal.UNKNOWN_DEVICE)
                }

                used && !confirmed -> {
                    refuse(Refusal.IN_USE)
                }

                else -> {
                    accept(
                        song.copy(
                            devices = song.devices.filterNot { it.id == ref.deviceId },
                            bindings = song.bindings.filterNot { it.deviceId == ref.deviceId },
                        ),
                    )
                }
            }
        }

    public fun setPartHand(
        library: Library,
        mode: Mode,
        ref: PartRef,
        hand: HandRole?,
    ): Outcome<Library> = PartEdit.run(library, mode, ref) { _, part -> PartEdit.accept(part.copy(hand = hand)) }

    public fun addBinding(
        library: Library,
        mode: Mode,
        request: BindingRequest,
        ids: IdSource,
    ): Outcome<Library> =
        SongEdit.run(library, mode, request.part.songId) { song ->
            val part = song.parts.firstOrNull { it.id == request.part.partId }
            val device = song.devices.firstOrNull { it.id == request.deviceId }
            val id = ids.next()
            when {
                part == null -> {
                    refuse(Refusal.UNKNOWN_PART)
                }

                device == null -> {
                    refuse(Refusal.UNKNOWN_DEVICE)
                }

                !request.range.within(device.range) -> {
                    refuse(Refusal.OUT_OF_DEVICE_RANGE)
                }

                !request.acceptExcluded && excluded(part, request.range) -> {
                    refuse(Refusal.EXCLUDES_NOTES)
                }

                id in library.purged -> {
                    refuse(Refusal.PURGED)
                }

                library.identityInUse(id) -> {
                    refuse(Refusal.DUPLICATE_ID)
                }

                else -> {
                    accept(
                        song.copy(
                            bindings =
                                song.bindings +
                                    Binding(BindingId(id), part.id, device.id, request.range, request.sound.trim()),
                        ),
                    )
                }
            }
        }

    /** Deleting a binding alone leaves the part's performed content intact. */
    public fun removeBinding(
        library: Library,
        mode: Mode,
        songId: SongId,
        bindingId: BindingId,
    ): Outcome<Library> =
        SongEdit.run(library, mode, songId) { song ->
            if (song.bindings.none { it.id == bindingId }) {
                refuse(Refusal.UNKNOWN_BINDING)
            } else {
                accept(song.copy(bindings = song.bindings.filterNot { it.id == bindingId }))
            }
        }

    /** The pitches a part plays, from its voicings and its phrases. */
    internal fun played(part: Part): Set<Int> =
        part.voicings.flatMap { v -> v.notes.map { it.midi } }.toSet() +
            part.phrases.flatMap { p -> p.items.mapNotNull { it.pitch?.midi } }

    private fun excluded(
        part: Part,
        range: PitchRange,
    ): Boolean = played(part).any { it !in range.lower..range.upper }

    private fun accept(song: Song): Outcome<Song> = Outcome.Accepted(song)

    private fun refuse(refusal: Refusal): Outcome<Song> = Outcome.Refused(refusal)
}
