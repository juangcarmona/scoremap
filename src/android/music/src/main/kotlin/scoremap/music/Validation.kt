package scoremap.music

internal fun validateSong(song: Song): List<MusicId> {
    val sections = song.sections
    val measures = sections.flatMap { it.measures }
    val parts = song.arrangements.flatMap { it.parts }
    val events = parts.flatMap { it.events }
    val phrases = parts.flatMap { it.phrases }
    val voicings = parts.flatMap { it.voicings } + song.arrangements.flatMap { it.voicings }
    val identities =
        listOf(song.id) + sections.map { it.id } + measures.map { it.id } +
            measures.flatMap { it.harmony }.map { it.id } + sections.flatMap { it.untimedHarmony }.map { it.id } +
            sections.flatMap { it.lyrics }.map { it.id } +
            song.arrangements.map { it.id } + parts.map { it.id } + events.map { it.id } +
            phrases.map { it.id } + voicings.map { it.id } + song.devices.map { it.id } +
            song.arrangements.flatMap { it.bindings }.map { it.id } +
            events.flatMap { it.notes }.map { it.id } + phrases.flatMap { it.notes }.map { it.id } +
            voicings.flatMap { it.notes }.map { it.id } + parts.flatMap { it.ties }.map { it.id } +
            phrases.flatMap { it.steps.orEmpty() }.map { it.id }
    require(identities.distinct().size == identities.size) { "Duplicate identity across the musical graph." }
    val byMeasure = measures.associateBy { it.id }
    events.forEach { event ->
        val measure = requireNotNull(byMeasure[event.measureId]) { "Dangling performed-event measure." }
        event.timing.validateWithin(measure.length)
    }
    song.arrangements.forEach { validateBindings(it, song.devices) }
    parts.forEach { validateTies(it, measures) }
    validateVoicingAssociations(song)
    return owned(identities)
}

private fun validateBindings(
    arrangement: Arrangement,
    devices: List<Device>,
) {
    val parts = arrangement.parts.associateBy { it.id }
    val instruments = devices.associateBy { it.id }
    require(arrangement.deviceIds == null || arrangement.deviceIds.all(instruments::containsKey)) {
        "Missing arrangement device."
    }
    arrangement.bindings.forEach { binding ->
        val part = requireNotNull(parts[binding.partId]) { "Dangling binding part." }
        val device = requireNotNull(instruments[binding.deviceId]) { "Dangling binding device." }
        require(arrangement.deviceIds == null || binding.deviceId in arrangement.deviceIds) {
            "Binding uses another arrangement device."
        }
        require(binding.range.low >= device.range.low && binding.range.high <= device.range.high) {
            "Binding range exceeds its device."
        }
        val byId = part.events.associateBy { it.id }
        val events =
            binding.eventIds?.map { requireNotNull(byId[it]) { "Missing or other-part binding event." } }
                ?: part.events
        val notes = events.flatMap { it.notes }
        require(notes.all { it.pitch in binding.range }) { "Binding excludes authored performed pitches." }
    }
}

private fun validateTies(
    part: Part,
    measures: List<Measure>,
) {
    require(
        part.ties
            .map { it.fromNoteId }
            .distinct()
            .size == part.ties.size &&
            part.ties
                .map { it.toNoteId }
                .distinct()
                .size == part.ties.size,
    ) { "Branching note tie." }
    val occurrences = part.events.flatMap { event -> event.notes.map { it.id to (event to it) } }.toMap()
    part.ties.forEach { tie ->
        val (fromEvent, fromNote) = requireNotNull(occurrences[tie.fromNoteId]) { "Dangling tie source." }
        val (toEvent, toNote) = requireNotNull(occurrences[tie.toNoteId]) { "Dangling tie destination." }
        val fromIndex = measures.indexOfFirst { it.id == fromEvent.measureId }
        val toIndex = measures.indexOfFirst { it.id == toEvent.measureId }
        val fromEnd = fromEvent.timing.start + fromEvent.timing.duration
        val contiguous =
            if (toIndex == fromIndex) {
                fromEnd == toEvent.timing.start
            } else {
                toIndex == fromIndex + 1 && fromEnd == measures[fromIndex].length &&
                    toEvent.timing.start == Rational.of(0)
            }
        require(contiguous && fromNote.pitch == toNote.pitch && fromNote.hand == toNote.hand) {
            "A tie must connect consecutive exact matching occurrences."
        }
    }
}
