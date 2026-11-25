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

    public fun removeMeasure(
        library: Library,
        mode: Mode,
        ref: SectionRef,
        measureId: MeasureId,
    ): Outcome<Library> =
        SectionEdit.run(library, mode, ref) { section ->
            if (section.measures.none { it.id == measureId }) {
                refuse(Refusal.UNKNOWN_MEASURE)
            } else {
                accept(section.copy(measures = section.measures.filterNot { it.id == measureId }))
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

    public fun removeChord(
        library: Library,
        mode: Mode,
        ref: SectionRef,
        eventId: EventId,
    ): Outcome<Library> =
        SectionEdit.run(library, mode, ref) { section ->
            if (section.measures.none { m -> m.events.any { it.id == eventId } }) {
                refuse(Refusal.UNKNOWN_EVENT)
            } else {
                accept(
                    section.copy(
                        measures =
                            section.measures.map { m ->
                                m.copy(
                                    events =
                                        m.events.filterNot {
                                            it.id ==
                                                eventId
                                        },
                                )
                            },
                    ),
                )
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
    ): Outcome<Library> {
        val song = library.songs.firstOrNull { it.id == ref.songId }
        val section = song?.sections?.firstOrNull { it.id == ref.sectionId }
        val outcome =
            when {
                mode != Mode.EDIT -> Outcome.Refused(Refusal.PERFORMANCE_MODE)
                song == null -> Outcome.Refused(Refusal.UNKNOWN_SONG)
                section == null -> Outcome.Refused(Refusal.UNKNOWN_SECTION)
                else -> change(section)
            }
        return when (outcome) {
            is Outcome.Refused -> outcome
            is Outcome.Accepted -> Outcome.Accepted(replace(library, song!!, outcome.value))
        }
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

    private fun replace(
        library: Library,
        song: Song,
        section: Section,
    ): Library {
        val sections = song.sections.map { if (it.id == section.id) section else it }
        return if (sections == song.sections) library else library.revise(song.copy(sections = sections))
    }
}
