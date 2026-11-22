package scoremap.music

public data class NoteOccurrence(
    public val id: MusicId,
    public val pitch: Pitch,
    public val hand: Hand = Hand.UNASSIGNED,
)

public class PerformedEvent(
    public val id: MusicId,
    public val measureId: MusicId,
    public val timing: Timing,
    notes: List<NoteOccurrence>,
    public val isRest: Boolean = false,
) {
    public val notes: List<NoteOccurrence> = owned(notes)

    init {
        require(isRest == notes.isEmpty()) { "Supply exact notes or an explicit rest." }
        requireUnique(notes) { it.id }
    }

    public fun replaceNote(
        noteId: MusicId,
        pitch: Pitch,
    ): PerformedEvent {
        require(notes.any { it.id == noteId }) { "Unknown note occurrence." }
        return PerformedEvent(
            id,
            measureId,
            timing,
            notes.map {
                if (it.id ==
                    noteId
                ) {
                    it.copy(pitch = pitch)
                } else {
                    it
                }
            },
            isRest,
        )
    }
}

public data class PhraseStep(
    public val id: MusicId,
    public val noteId: MusicId?,
    public val duration: Rational,
) {
    init {
        require(duration > Rational.of(0)) { "Phrase duration must be positive." }
    }
}

public class PreparedPhrase(
    public val id: MusicId,
    public val label: String,
    notes: List<NoteOccurrence>,
    steps: List<PhraseStep>? = null,
) {
    public val steps: List<PhraseStep>? = steps?.let(::owned)
    public val notes: List<NoteOccurrence> = owned(notes)

    init {
        require(label.isNotBlank()) { "A prepared phrase needs a label." }
        requireUnique(notes) { it.id }
        if (steps != null) {
            requireUnique(steps) { it.id }
            require(
                steps.mapNotNull {
                    it.noteId
                } == notes.map { it.id },
            ) { "Phrase timing must retain exact note order and references." }
        }
    }
}

public data class PresetReference(
    public val id: MusicId,
    public val revision: Long,
) {
    init {
        require(revision >= 0) { "Invalid preset revision." }
    }
}

public class Voicing(
    public val id: MusicId,
    notes: List<NoteOccurrence>,
    public val provenance: PresetReference? = null,
) {
    public val notes: List<NoteOccurrence> = owned(notes)

    init {
        requireUnique(notes) { it.id }
    }
}

public data class NoteTie(
    public val id: MusicId,
    public val fromNoteId: MusicId,
    public val toNoteId: MusicId,
)

public data class PartProfile(
    public val label: String,
    public val role: String? = null,
) {
    init {
        require(label.isNotBlank()) { "A part label must be nonblank." }
        require(role == null || role.isNotBlank()) { "A supplied role must be nonblank." }
    }
}

public class Part(
    public val id: MusicId,
    public val profile: PartProfile,
    events: List<PerformedEvent> = emptyList(),
    phrases: List<PreparedPhrase> = emptyList(),
    voicings: List<Voicing> = emptyList(),
    ties: List<NoteTie> = emptyList(),
) {
    public val label: String get() = profile.label
    public val role: String? get() = profile.role
    public val events: List<PerformedEvent> = owned(events)
    public val phrases: List<PreparedPhrase> = owned(phrases)
    public val voicings: List<Voicing> = owned(voicings)
    public val ties: List<NoteTie> = owned(ties)

    init {
        require(label.isNotBlank()) { "A part label must be nonblank." }
        requireUnique(events) { it.id }
        requireUnique(phrases) { it.id }
        requireUnique(voicings) { it.id }
        requireUnique(ties) { it.id }
    }

    public fun replaceNote(
        eventId: MusicId,
        noteId: MusicId,
        pitch: Pitch,
    ): Part {
        require(events.any { it.id == eventId }) { "Unknown performed event." }
        return Part(
            id = id,
            profile = PartProfile(label = label, role = role),
            events =
                events.map {
                    if (it.id ==
                        eventId
                    ) {
                        it.replaceNote(noteId, pitch)
                    } else {
                        it
                    }
                },
            phrases = phrases,
            voicings = voicings,
            ties = ties,
        )
    }
}

public data class Device(
    public val id: MusicId,
    public val label: String,
    public val range: PitchRange,
) {
    init {
        require(label.isNotBlank()) { "A device label must be nonblank." }
    }
}

public data class LayerBinding(
    public val id: MusicId,
    public val partId: MusicId,
    public val deviceId: MusicId,
    public val range: PitchRange,
    public val sound: String? = null,
) {
    init {
        require(sound == null || sound.isNotBlank()) { "A sound binding needs an authored reference." }
    }
}

public class Arrangement(
    public val id: MusicId,
    public val label: String,
    parts: List<Part>,
    bindings: List<LayerBinding> = emptyList(),
) {
    public val parts: List<Part> = owned(parts)
    public val bindings: List<LayerBinding> = owned(bindings)

    init {
        require(label.isNotBlank()) { "An arrangement label must be nonblank." }
        requireUnique(parts) { it.id }
        requireUnique(bindings) { it.id }
    }

    public fun addPart(
        part: Part,
        bindings: List<LayerBinding> = emptyList(),
    ): Arrangement = Arrangement(id, label, parts + part, this.bindings + bindings)

    public fun replaceNote(
        partId: MusicId,
        eventId: MusicId,
        noteId: MusicId,
        pitch: Pitch,
    ): Arrangement {
        require(parts.any { it.id == partId }) { "Unknown part." }
        return Arrangement(
            id,
            label,
            parts.map {
                if (it.id ==
                    partId
                ) {
                    it.replaceNote(eventId, noteId, pitch)
                } else {
                    it
                }
            },
            bindings,
        )
    }
}
