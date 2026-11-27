package scoremap.library

import scoremap.music.HarmonyCatalogue
import scoremap.music.HarmonyIdentity
import scoremap.music.MusicRuleViolation

private const val QUARTERS_PER_WHOLE = 4L
private const val MAX_BEATS = 64
private const val MAX_UNIT_EXPONENT = 5
private val DENOMINATORS = (0..MAX_UNIT_EXPONENT).map { 1 shl it }.toSet()

/** Opaque, stable identity of a measure. */
@JvmInline
public value class MeasureId(
    public val value: String,
)

/** Opaque, stable identity of a harmonic event. */
@JvmInline
public value class EventId(
    public val value: String,
)

/** A meter: a positive integer numerator over a power-of-two denominator. */
public data class Meter(
    val beats: Int,
    val unit: Int,
) {
    init {
        if (beats !in 1..MAX_BEATS || unit !in DENOMINATORS) throw MusicRuleViolation("Unsupported meter $beats/$unit.")
    }

    /** The exact measure length in quarter notes. */
    public val length: Fraction get() = Fraction.of(QUARTERS_PER_WHOLE * beats, unit.toLong())

    public val label: String get() = "$beats/$unit"

    public companion object {
        public val COMMON: Meter = Meter(4, 4)

        public fun parse(text: String): Meter? {
            val parts = text.trim().split('/').map { it.toIntOrNull() }
            return if (parts.size == 2 && parts.none { it == null }) {
                runCatching { Meter(parts[0]!!, parts[1]!!) }.getOrNull()
            } else {
                null
            }
        }
    }
}

/** A theoretical chord identity in storable form: spelled root, catalogue quality, alterations, optional bass. */
public data class ChordSpec(
    val root: String,
    val quality: String,
    val alterations: List<String> = emptyList(),
    val bass: String? = null,
) {
    init {
        identity()
    }

    public fun identity(): HarmonyIdentity = HarmonyIdentity.of(root, quality, alterations, bass)

    /** The chord as the musician reads it, such as "Bb7", "Dm7" or "C/E". */
    public val symbol: String
        get() {
            val suffix = HarmonyCatalogue.quality(quality)?.symbol.orEmpty()
            val altered = if (alterations.isEmpty()) "" else alterations.joinToString(",", "(", ")")
            return root + suffix + altered + (bass?.let { "/$it" }.orEmpty())
        }

    public companion object {
        /** Reads a plain symbol such as "F#m7b5" or "C/E"; null when it is not a catalogue chord. */
        public fun parse(text: String): ChordSpec? {
            val (body, bass) = text.trim().substringBefore('/') to text.trim().substringAfter('/', "").ifEmpty { null }
            val root = Regex("^[A-G](#|b)?").find(body)?.value
            val rest = root?.let { body.removePrefix(it) }
            val quality = rest?.let { r -> HarmonyCatalogue.qualities.firstOrNull { r in it.aliases } }
            return if (root != null && quality != null) {
                runCatching { ChordSpec(root, quality.id, emptyList(), bass) }.getOrNull()
            } else {
                null
            }
        }
    }
}

/** A chord placed in a measure at an exact offset, optionally linked to a position in the section's lyrics. */
public data class ChordEvent(
    val id: EventId,
    val start: Fraction,
    val duration: Fraction,
    val chord: ChordSpec,
    /** Character offset into the section lyrics (0..length), or null when no association was supplied. */
    val lyricIndex: Int? = null,
)

/** A measure with its stable identity, its meter and its non-overlapping harmonic events in time order. */
public data class Measure(
    val id: MeasureId,
    val meter: Meter,
    val events: List<ChordEvent> = emptyList(),
)
