package scoremap.library

/** Where a command acts: one section of one song. */
public data class SectionRef(
    val songId: SongId,
    val sectionId: SectionId,
)

/** Where a chord goes: one measure of one section. */
public data class MeasureRef(
    val section: SectionRef,
    val measureId: MeasureId,
)

/** A chord to place: its exact start and duration in quarter notes, its identity and an optional lyric link. */
public data class ChordRequest(
    val start: Fraction,
    val duration: Fraction,
    val chord: ChordSpec,
    val lyricIndex: Int? = null,
)

/**
 * Shared harmonic form edits: measures with a meter and non-overlapping chord events with exact times.
 * The edit-mode guard runs first and a refusal never changes the library it was given.
 */
public object ChordCommands {
    public fun addMeasure(
        library: Library,
        mode: Mode,
        ref: SectionRef,
        meter: Meter,
        ids: IdSource,
    ): Outcome<Library> =
        SectionEdit.run(library, mode, ref) { section ->
            val id = ids.next()
            SectionEdit.fresh(library, id)
                ?: accept(section.copy(measures = section.measures + Measure(MeasureId(id), meter)))
        }

    /**
     * Removes a measure with its chords. Performed voicings that use those chords are never left dangling: the
     * removal is refused unless [reconcile] confirms that they are removed in the same step.
     */
    public fun removeMeasure(
        library: Library,
        mode: Mode,
        ref: SectionRef,
        measureId: MeasureId,
        reconcile: Boolean = false,
    ): Outcome<Library> =
        SectionEdit.runSong(library, mode, ref) { song, section ->
            val measure = section.measures.firstOrNull { it.id == measureId }
            if (measure == null) {
                Outcome.Refused(Refusal.UNKNOWN_MEASURE)
            } else {
                val gone = measure.events.map { it.id }.toSet()
                val without = section.copy(measures = section.measures - measure)
                SectionEdit.withoutVoicings(song, without, gone, reconcile)
            }
        }

    /** Reordering changes position only; identities, meters and events are kept. */
    public fun reorderMeasures(
        library: Library,
        mode: Mode,
        ref: SectionRef,
        order: List<MeasureId>,
    ): Outcome<Library> =
        SectionEdit.run(library, mode, ref) { section ->
            val current = section.measures.associateBy { it.id }
            if (order.size != current.size || order.toSet() != current.keys) {
                refuse(Refusal.NOT_A_PERMUTATION)
            } else {
                accept(section.copy(measures = order.map { current.getValue(it) }))
            }
        }

    public fun addChord(
        library: Library,
        mode: Mode,
        target: MeasureRef,
        request: ChordRequest,
        ids: IdSource,
    ): Outcome<Library> =
        SectionEdit.run(library, mode, target.section) { section ->
            val measure = section.measures.firstOrNull { it.id == target.measureId }
            val id = ids.next()
            when {
                measure == null -> {
                    refuse(Refusal.UNKNOWN_MEASURE)
                }

                else -> {
                    SectionEdit.fresh(library, id)
                        ?: placed(
                            section,
                            measure,
                            ChordEvent(EventId(id), request.start, request.duration, request.chord, request.lyricIndex),
                        )
                }
            }
        }

    /** Removes a chord; see [removeMeasure] for the voicings that used it. */
    public fun removeChord(
        library: Library,
        mode: Mode,
        ref: SectionRef,
        eventId: EventId,
        reconcile: Boolean = false,
    ): Outcome<Library> =
        SectionEdit.runSong(library, mode, ref) { song, section ->
            if (section.measures.none { m -> m.events.any { it.id == eventId } }) {
                Outcome.Refused(Refusal.UNKNOWN_EVENT)
            } else {
                val measures = section.measures.map { m -> m.copy(events = m.events.filterNot { it.id == eventId }) }
                SectionEdit.withoutVoicings(song, section.copy(measures = measures), setOf(eventId), reconcile)
            }
        }

    /** Sets or clears the explicit association between a chord and a position in the section's lyrics. */
    public fun linkLyric(
        library: Library,
        mode: Mode,
        ref: SectionRef,
        eventId: EventId,
        lyricIndex: Int?,
    ): Outcome<Library> =
        SectionEdit.run(library, mode, ref) { section ->
            when {
                section.measures.none { m -> m.events.any { it.id == eventId } } -> {
                    refuse(Refusal.UNKNOWN_EVENT)
                }

                lyricIndex != null && lyricIndex !in 0..section.lyrics.length -> {
                    refuse(Refusal.INVALID_LYRIC_LINK)
                }

                else -> {
                    accept(
                        section.copy(
                            measures =
                                section.measures.map { m ->
                                    m.copy(
                                        events =
                                            m.events.map {
                                                if (it.id ==
                                                    eventId
                                                ) {
                                                    it.copy(lyricIndex = lyricIndex)
                                                } else {
                                                    it
                                                }
                                            },
                                    )
                                },
                        ),
                    )
                }
            }
        }

    private fun placed(
        section: Section,
        measure: Measure,
        event: ChordEvent,
    ): Outcome<Section> {
        val end = event.start + event.duration
        val refusal =
            when {
                event.start < Fraction.ZERO || event.duration <= Fraction.ZERO || event.start >= measure.meter.length ||
                    end > measure.meter.length -> Refusal.INVALID_TIME

                measure.events.any { event.start < it.start + it.duration && it.start < end } -> Refusal.OVERLAP

                event.lyricIndex != null && event.lyricIndex !in 0..section.lyrics.length -> Refusal.INVALID_LYRIC_LINK

                else -> null
            }
        if (refusal != null) return refuse(refusal)
        val events = (measure.events + event).sortedBy { it.start }
        return accept(
            section.copy(
                measures =
                    section.measures.map {
                        if (it.id ==
                            measure.id
                        ) {
                            it.copy(events = events)
                        } else {
                            it
                        }
                    },
            ),
        )
    }

    private fun accept(section: Section): Outcome<Section> = Outcome.Accepted(section)

    private fun refuse(refusal: Refusal): Outcome<Section> = Outcome.Refused(refusal)
}

/** Shared plumbing for commands that replace one section of one song as a single new revision. */
internal object SectionEdit {
    fun run(
        library: Library,
        mode: Mode,
        ref: SectionRef,
        change: (Section) -> Outcome<Section>,
    ): Outcome<Library> =
        runSong(library, mode, ref) { song, section ->
            when (val outcome = change(section)) {
                is Outcome.Refused -> outcome
                is Outcome.Accepted -> Outcome.Accepted(replace(song, outcome.value))
            }
        }

    fun runSong(
        library: Library,
        mode: Mode,
        ref: SectionRef,
        change: (Song, Section) -> Outcome<Song>,
    ): Outcome<Library> =
        SongEdit.run(library, mode, ref.songId) { song ->
            val section = song.sections.firstOrNull { it.id == ref.sectionId }
            if (section == null) Outcome.Refused(Refusal.UNKNOWN_SECTION) else change(song, section)
        }

    /** A refusal when a freshly drawn identity was purged or is already used. */
    fun fresh(
        library: Library,
        id: String,
    ): Outcome<Section>? =
        when {
            id in library.purged -> Outcome.Refused(Refusal.PURGED)
            library.identityInUse(id) -> Outcome.Refused(Refusal.DUPLICATE_ID)
            else -> null
        }

    /** The song with [section] in place; voicings of [gone] events are dropped only when [reconcile] is set. */
    fun withoutVoicings(
        song: Song,
        section: Section,
        gone: Set<EventId>,
        reconcile: Boolean,
    ): Outcome<Song> {
        val used = song.parts.any { part -> part.voicings.any { it.eventId in gone } }
        return if (used && !reconcile) {
            Outcome.Refused(Refusal.IN_USE)
        } else {
            val parts = song.parts.map { p -> p.copy(voicings = p.voicings.filterNot { it.eventId in gone }) }
            Outcome.Accepted(replace(song, section).copy(parts = parts))
        }
    }

    private fun replace(
        song: Song,
        section: Section,
    ): Song = song.copy(sections = song.sections.map { if (it.id == section.id) section else it })
}
