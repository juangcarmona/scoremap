package scoremap.feature.library

import scoremap.library.ChordEvent
import scoremap.library.Library
import scoremap.library.LibraryService
import scoremap.library.PerformedNote
import scoremap.library.Section
import scoremap.library.Song
import scoremap.music.Piano

/** One lyric line with the chords linked to positions in it, aligned for a monospace font. */
public data class SheetLine(
    val chords: String,
    val lyrics: String,
)

/** A section of the focused sheet: repeats, cue, chord loop, aligned lyrics and, on request, performed notes. */
public data class SheetSection(
    val title: String,
    val cue: String?,
    /** Every chord of the section in order, measure by measure, such as "| C | G7 Dm |". */
    val loop: String?,
    val lines: List<SheetLine>,
    val performed: List<String>,
    val positions: List<PerformedPosition> = emptyList(),
)

/** Exact authored pitches for a chord and owning part; never inferred from chord theory. */
public data class PerformedPosition(
    val chord: String,
    val part: String,
    val notes: List<PerformedNote>,
)

/** The consult view of a song: title, declared key (or its absence) and ordered sections. Nothing is invented. */
public data class SheetView(
    val title: String,
    val key: String,
    val sections: List<SheetSection>,
)

/** Builds the song sheet from what was acknowledged; missing key, lyrics or chords stay visibly absent. */
internal object SheetLayout {
    fun of(
        song: Song,
        showPerformed: Boolean,
    ): SheetView =
        SheetView(
            song.name,
            song.key?.let { "Key: ${it.label}" } ?: "Key not set",
            song.sections.map { section(song, it, showPerformed) },
        )

    private fun section(
        song: Song,
        section: Section,
        showPerformed: Boolean,
    ): SheetSection {
        val title = if (section.repeats > 1) "${section.name} ×${section.repeats}" else section.name
        val events = section.measures.flatMap { it.events }
        val loop =
            section.measures
                .takeIf { it.isNotEmpty() }
                ?.joinToString(
                    " | ",
                    "| ",
                    " |",
                ) { m -> m.events.joinToString(" ") { it.chord.symbol }.ifEmpty { "-" } }
        return SheetSection(
            title,
            section.cue.ifEmpty { null },
            loop,
            lines(section.lyrics, events),
            if (showPerformed) performed(song, events) else emptyList(),
            if (showPerformed) positions(song, events) else emptyList(),
        )
    }

    /** Places each linked chord above the character it is linked to; unlinked chords appear only in the loop. */
    fun lines(
        lyrics: String,
        events: List<ChordEvent>,
    ): List<SheetLine> {
        if (lyrics.isEmpty()) return emptyList()
        var start = 0
        return lyrics.split('\n').map { text ->
            val end = start + text.length
            val linked =
                events
                    .filter { e ->
                        e.lyricIndex != null && e.lyricIndex in start..end
                    }.sortedBy { it.lyricIndex }
            val line = SheetLine(chordLine(linked.map { (it.lyricIndex!! - start) to it.chord.symbol }), text)
            start = end + 1
            line
        }
    }

    private fun chordLine(placed: List<Pair<Int, String>>): String {
        val line = StringBuilder()
        for ((column, symbol) in placed) {
            val at = maxOf(column, if (line.isEmpty()) 0 else line.length + 1)
            while (line.length < at) line.append(' ')
            line.append(symbol)
        }
        return line.toString()
    }

    private fun positions(
        song: Song,
        events: List<ChordEvent>,
    ): List<PerformedPosition> =
        events.flatMap { event ->
            song.parts.mapNotNull { part ->
                part.voicings.firstOrNull { it.eventId == event.id }?.let { voicing ->
                    PerformedPosition(event.chord.symbol, part.name, voicing.notes)
                }
            }
        }

    private fun performed(
        song: Song,
        events: List<ChordEvent>,
    ): List<String> =
        events.flatMap { event ->
            song.parts.mapNotNull { part ->
                part.voicings.firstOrNull { it.eventId == event.id }?.let { voicing ->
                    val notes = voicing.notes.joinToString(", ") { "${Piano.label(it.midi)} (${handName(it.hand)})" }
                    "${event.chord.symbol} — ${part.name}: $notes"
                }
            }
        }
}

/** Reads the acknowledged library for the song sheet. */
public class SheetModel(
    private val service: LibraryService,
) {
    /** Null when the song is not an active song. */
    public fun load(
        songId: String,
        showPerformed: Boolean,
    ): SheetView? = songOf(service.current().library, songId)?.let { SheetLayout.of(it, showPerformed) }

    private fun songOf(
        library: Library,
        id: String,
    ): Song? = library.songs.firstOrNull { it.id.value == id }
}
