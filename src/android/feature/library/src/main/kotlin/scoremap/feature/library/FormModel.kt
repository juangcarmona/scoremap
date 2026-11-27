package scoremap.feature.library

import scoremap.library.ChordCommands
import scoremap.library.ChordRequest
import scoremap.library.ChordSpec
import scoremap.library.EventId
import scoremap.library.Fraction
import scoremap.library.IdSource
import scoremap.library.Library
import scoremap.library.LibraryService
import scoremap.library.MeasureId
import scoremap.library.MeasureRef
import scoremap.library.Meter
import scoremap.library.Mode
import scoremap.library.Outcome
import scoremap.library.SectionId
import scoremap.library.SectionRef
import scoremap.library.SongId

/** Measure and chord editing of one section. Each action answers what the musician is told. */
public class FormModel(
    private val service: LibraryService,
    private val ids: IdSource,
    private val commandIds: IdSource,
) {
    /** Blank text means 4/4. */
    public fun addMeasure(
        songId: String,
        sectionId: String,
        meterText: String,
        mode: Mode,
    ): Notice {
        val meter = if (meterText.isBlank()) Meter.COMMON else Meter.parse(meterText)
        return if (meter == null) {
            Notice.INVALID_METER
        } else {
            run(Notice.MEASURE_ADDED) { ChordCommands.addMeasure(it, mode, ref(songId, sectionId), meter, ids) }
        }
    }

    /** "Dm7" or "Dm7 2": the chord goes after the last one in the measure and lasts the given beats (default 1). */
    public fun addChord(
        songId: String,
        sectionId: String,
        measureId: String,
        text: String,
        mode: Mode,
    ): Notice {
        val words = text.trim().split(Regex("\\s+"))
        val chord = ChordSpec.parse(words.first())
        val beats = if (words.size > 1) Fraction.parse(words[1]) else Fraction.ONE
        val usable = beats != null && beats > Fraction.ZERO && words.size <= 2
        return if (chord == null || beats == null || !usable) {
            Notice.INVALID_CHORD
        } else {
            run(Notice.CHORD_ADDED) { library ->
                val start = nextFree(library, songId, sectionId, measureId)
                val request = ChordRequest(start, beats, chord)
                ChordCommands.addChord(
                    library,
                    mode,
                    MeasureRef(ref(songId, sectionId), MeasureId(measureId)),
                    request,
                    ids,
                )
            }
        }
    }

    public fun removeChord(
        songId: String,
        sectionId: String,
        eventId: String,
        mode: Mode,
        reconcile: Boolean = false,
    ): Notice =
        run(Notice.SHEET_SAVED) {
            ChordCommands.removeChord(it, mode, ref(songId, sectionId), EventId(eventId), reconcile)
        }

    public fun removeMeasure(
        songId: String,
        sectionId: String,
        measureId: String,
        mode: Mode,
        reconcile: Boolean = false,
    ): Notice =
        run(Notice.SHEET_SAVED) {
            ChordCommands.removeMeasure(it, mode, ref(songId, sectionId), MeasureId(measureId), reconcile)
        }

    /** Blank text removes the link; otherwise it is the character position in the lyrics. */
    public fun linkLyric(
        songId: String,
        sectionId: String,
        eventId: String,
        text: String,
        mode: Mode,
    ): Notice {
        val index = if (text.isBlank()) null else text.trim().toIntOrNull()
        return if (text.isNotBlank() && index == null) {
            Notice.INVALID_LINK
        } else {
            run(
                Notice.SHEET_SAVED,
            ) { ChordCommands.linkLyric(it, mode, ref(songId, sectionId), EventId(eventId), index) }
        }
    }

    private fun ref(
        songId: String,
        sectionId: String,
    ) = SectionRef(SongId(songId), SectionId(sectionId))

    private fun nextFree(
        library: Library,
        songId: String,
        sectionId: String,
        measureId: String,
    ): Fraction {
        val section =
            library.songs.firstOrNull { it.id.value == songId }?.sections?.firstOrNull {
                it.id.value ==
                    sectionId
            }
        val last =
            section
                ?.measures
                ?.firstOrNull { it.id.value == measureId }
                ?.events
                ?.lastOrNull()
        return last?.let { it.start + it.duration } ?: Fraction.ZERO
    }

    private fun run(
        success: Notice,
        command: (Library) -> Outcome<Library>,
    ): Notice = resultNotice(service.execute(commandIds.next(), command), success)
}
