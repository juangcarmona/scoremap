package scoremap.music

internal fun validateVoicingAssociations(song: Song) {
    val harmonies =
        song.sections
            .flatMap { section ->
                section.untimedHarmony.map { it.id to it.chord } +
                    section.measures.flatMap { it.harmony }.map { it.id to it.chord }
            }.toMap()
    song.arrangements.forEach { arrangement ->
        val shared = arrangement.voicings.associateBy { it.id }
        arrangement.voicings.forEach { validateVoicingNotes(it, it.notes, harmonies) }
        arrangement.parts.forEach { part ->
            val available = shared + part.voicings.associateBy { it.id }
            part.voicings.forEach { validateVoicingNotes(it, it.notes, harmonies) }
            part.events.forEach { event -> validateEventVoicing(event, available, harmonies) }
        }
    }
}

private fun validateEventVoicing(
    event: PerformedEvent,
    available: Map<MusicId, Voicing>,
    harmonies: Map<MusicId, Chord>,
) {
    event.voicingId?.let { id ->
        val voicing = requireNotNull(available[id]) { "Missing or other-part event voicing." }
        require(voicing.harmonicEventId != null && voicing.custom != null) { "Incomplete event voicing." }
        validateVoicingNotes(voicing, event.notes, harmonies)
    }
}

private fun validateVoicingNotes(
    voicing: Voicing,
    notes: List<NoteOccurrence>,
    harmonies: Map<MusicId, Chord>,
) {
    val chord = voicing.harmonicEventId?.let { requireNotNull(harmonies[it]) { "Missing voicing harmony." } }
    require(voicing.custom != false || chord != null) { "Noncustom voicing needs an explicit harmony." }
    if (chord != null && voicing.custom == false) {
        val allowed = (chord.tones + listOfNotNull(chord.bass)).map { it.pitchClass }.toSet()
        require(notes.all { it.pitch.absolute % SEMITONES_PER_OCTAVE in allowed }) {
            "Non-chord pitches need explicit custom reconciliation."
        }
    }
}
