package scoremap.library

/** A chord event as carried by a package: times are exact, identities are never imported. */
public data class GraphEvent(
    val start: Fraction,
    val duration: Fraction,
    val chord: ChordSpec,
    val lyricIndex: Int? = null,
)

public data class GraphMeasure(
    val meter: Meter,
    val events: List<GraphEvent> = emptyList(),
)

/** Where a chord sits inside a song: section, measure and event positions, so no identity is needed. */
public data class EventPosition(
    val section: Int,
    val measure: Int,
    val event: Int,
)

public data class GraphVoicing(
    val at: EventPosition,
    val notes: List<PerformedNote>,
)

/** A prepared phrase as carried by a package; [section] is the position of its section in the song, if any. */
public data class GraphPhrase(
    val name: String,
    val section: Int? = null,
    val items: List<PhraseItem> = emptyList(),
)

public data class GraphPart(
    val name: String,
    val voicings: List<GraphVoicing> = emptyList(),
    val phrases: List<GraphPhrase> = emptyList(),
)

/** A section as carried by a transfer package; identities are never imported. */
public data class GraphSection(
    val name: String,
    val repeats: Int,
    val lyrics: String = "",
    val cue: String = "",
    val measures: List<GraphMeasure> = emptyList(),
)

/** PDF bytes with content equality, so packages can be compared value by value. */
public class PdfBytes(
    public val bytes: ByteArray,
) {
    override fun equals(other: Any?): Boolean = other is PdfBytes && bytes.contentEquals(other.bytes)

    override fun hashCode(): Int = bytes.contentHashCode()

    override fun toString(): String = "PdfBytes(${bytes.size} bytes)"
}

/** A PDF attached to a song inside a package: its name and its complete bytes. */
public data class GraphAttachment(
    val name: String,
    val pdf: PdfBytes,
)

/** A song as carried by a transfer package. [key] only links set members inside the package. */
public data class GraphSong(
    val key: String,
    val name: String,
    val sections: List<GraphSection>,
    val attachments: List<GraphAttachment> = emptyList(),
    /** The declared key as text such as "F# minor"; null while unknown. */
    val songKey: String? = null,
    val parts: List<GraphPart> = emptyList(),
)

public data class GraphSet(
    val name: String,
    val songKeys: List<String>,
)

/** The complete, identity-free content of one song or one ordered set with all of its songs. */
public data class TransferGraph(
    val songs: List<GraphSong>,
    val set: GraphSet?,
) {
    public companion object {
        public fun ofSong(song: Song): TransferGraph = TransferGraph(listOf(graphSong(song)), null)

        public fun ofSet(
            library: Library,
            set: MusicSet,
        ): TransferGraph {
            val byId = library.songs.associateBy { it.id }
            return TransferGraph(
                set.songIds.map { graphSong(byId.getValue(it)) },
                GraphSet(set.name, set.songIds.map { it.value }),
            )
        }

        private fun graphMeasure(measure: Measure): GraphMeasure =
            GraphMeasure(
                measure.meter,
                measure.events.map { GraphEvent(it.start, it.duration, it.chord, it.lyricIndex) },
            )

        private fun graphSong(song: Song): GraphSong =
            GraphSong(
                song.id.value,
                song.name,
                song.sections.map {
                    GraphSection(
                        it.name,
                        it.repeats,
                        it.lyrics,
                        it.cue,
                        it.measures.map(::graphMeasure),
                    )
                },
                songKey = song.key?.label,
                parts = song.parts.map { graphPart(song, it) },
            )

        private fun graphPart(
            song: Song,
            part: Part,
        ): GraphPart {
            val positions =
                song.sections
                    .flatMapIndexed { s, section ->
                        section.measures.flatMapIndexed { m, measure ->
                            measure.events.mapIndexed { e, event -> event.id to EventPosition(s, m, e) }
                        }
                    }.toMap()
            val sectionIndex = song.sections.map { it.id }
            return GraphPart(
                part.name,
                part.voicings.map { GraphVoicing(positions.getValue(it.eventId), it.notes) },
                part.phrases.map { p -> GraphPhrase(p.name, p.section?.let(sectionIndex::indexOf), p.items) },
            )
        }
    }
}
