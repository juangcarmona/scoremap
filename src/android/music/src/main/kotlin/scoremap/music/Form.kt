package scoremap.music

public class RepeatCount private constructor(
    public val value: Int,
) {
    public companion object {
        public fun of(value: Int): RepeatCount {
            require(value in 1..MAXIMUM_REPEATS) { "Repeat count must be an integer in 1..MAXIMUM_REPEATS." }
            return RepeatCount(value)
        }

        public fun fromNumber(value: Double): RepeatCount {
            require(
                value.isFinite() && value % 1.0 == 0.0 && value in 1.0..MAXIMUM_REPEATS.toDouble(),
            ) { "Invalid repeat count." }
            return of(value.toInt())
        }
    }
}

public data class HarmonicEvent(
    public val id: MusicId,
    public val timing: Timing,
    public val chord: Chord,
)

public class Measure(
    public val id: MusicId,
    public val meter: Meter = Meter(),
    harmony: List<HarmonicEvent> = emptyList(),
    public val length: Rational = meter.quarterLength,
) {
    public val harmony: List<HarmonicEvent> = owned(harmony)

    init {
        require(length > Rational.of(0)) { "A measure length must be positive." }
        requireUnique(harmony) { it.id }
        harmony.forEach { it.timing.validateWithin(length) }
        val ordered = harmony.sortedBy { it.timing.start }
        require(ordered.zipWithNext().all { (a, b) -> a.timing.start + a.timing.duration <= b.timing.start }) {
            "Harmonic events overlap."
        }
    }
}

public data class LyricAnchor(
    public val eventId: MusicId,
    public val characterOffset: Int,
) {
    init {
        require(characterOffset >= 0) { "Negative lyric anchor." }
    }
}

public class LyricLine(
    public val id: MusicId,
    public val text: String,
    anchors: List<LyricAnchor> = emptyList(),
) {
    public val anchors: List<LyricAnchor> = owned(anchors)

    init {
        require(anchors.all { it.characterOffset <= text.length }) { "Lyric anchor exceeds exact text." }
    }
}

public class Section(
    public val id: MusicId,
    public val label: String,
    public val repeats: RepeatCount = RepeatCount.of(1),
    measures: List<Measure> = emptyList(),
    lyrics: List<LyricLine> = emptyList(),
    public val cue: String? = null,
) {
    public val measures: List<Measure> = owned(measures)
    public val lyrics: List<LyricLine> = owned(lyrics)

    init {
        require(label.isNotBlank()) { "A section label must be nonblank." }
        requireUnique(measures) { it.id }
        requireUnique(lyrics) { it.id }
        val events = measures.flatMap { it.harmony }.map { it.id }.toSet()
        require(lyrics.flatMap { it.anchors }.all { it.eventId in events }) { "Dangling harmonic lyric anchor." }
    }

    public fun reorderMeasures(order: List<MusicId>): Section {
        require(
            order.size == measures.size && order.distinct().size == order.size &&
                order.toSet() == measures.map { it.id }.toSet(),
        ) {
            "Measure order must be an exact identity permutation."
        }
        val byId = measures.associateBy { it.id }
        return Section(id, label, repeats, order.map { byId.getValue(it) }, lyrics, cue)
    }

    public fun occurrences(): List<SectionOccurrence> = owned((1..repeats.value).map { SectionOccurrence(id, it) })
}

public data class SectionOccurrence(
    public val sectionId: MusicId,
    public val repetition: Int,
) {
    init {
        require(repetition in 1..MAXIMUM_REPEATS) { "Invalid section occurrence." }
    }
}

public data class SongHeader(
    public val title: String,
    public val artist: String? = null,
    public val key: Key = Key.Unknown,
) {
    init {
        require(title.isNotBlank()) { "A song title must be nonblank." }
    }
}

public class Song(
    public val id: MusicId,
    public val header: SongHeader,
    sections: List<Section> = emptyList(),
    arrangements: List<Arrangement> = emptyList(),
    devices: List<Device> = emptyList(),
) {
    public val sections: List<Section> = owned(sections)
    public val arrangements: List<Arrangement> = owned(arrangements)
    public val devices: List<Device> = owned(devices)
    public val title: String get() = header.title
    public val artist: String? get() = header.artist
    public val key: Key get() = header.key
    public val identities: List<MusicId>

    init {
        require(title.isNotBlank()) { "A song title must be nonblank." }
        identities = validateSong(this)
    }

    public fun reorderSections(order: List<MusicId>): Song {
        require(
            order.size == sections.size && order.distinct().size == order.size &&
                order.toSet() == sections.map { it.id }.toSet(),
        ) {
            "Section order must be an exact identity permutation."
        }
        val byId = sections.associateBy { it.id }
        return Song(
            id = id,
            header = SongHeader(title = title, artist = artist, key = key),
            sections =
                order.map {
                    byId.getValue(it)
                },
            arrangements = arrangements,
            devices = devices,
        )
    }

    public fun withArrangements(arrangements: List<Arrangement>): Song =
        Song(
            id = id,
            header = SongHeader(title = title, artist = artist, key = key),
            sections = sections,
            arrangements = arrangements,
            devices = devices,
        )
}
