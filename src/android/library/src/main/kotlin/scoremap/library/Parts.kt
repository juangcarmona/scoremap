package scoremap.library

import scoremap.music.Piano
import scoremap.music.PitchRange

/** Opaque, stable identity of a performed part. */
@JvmInline
public value class PartId(
    public val value: String,
)

/** Which hand plays a note; it is stated per note and never inferred from the pitch. */
public enum class Hand { LEFT, RIGHT }

/** One exact performed pitch (MIDI 0..127) with the hand that plays it. */
public data class PerformedNote(
    val midi: Int,
    val hand: Hand,
)

/** The exact notes played for one harmonic event; this is the performance, never the theoretical chord. */
public data class Voicing(
    val eventId: EventId,
    val notes: List<PerformedNote>,
)

/** An independent performed part of a song; any number of parts may exist and none is tied to a hand or device. */
public data class Part(
    val id: PartId,
    val name: String,
    val voicings: List<Voicing> = emptyList(),
    val phrases: List<Phrase> = emptyList(),
    /** Optional hand metadata; null means unassigned. */
    val hand: HandRole? = null,
)

/** Opaque, stable identity of a prepared phrase. */
@JvmInline
public value class PhraseId(
    public val value: String,
)

/**
 * One step of a phrase: an exact pitch with its hand, or a rest. [duration] is in quarter notes and null when
 * the musician did not supply timing, so no rhythm is ever invented.
 */
public data class PhraseItem(
    val pitch: PerformedNote?,
    val duration: Fraction? = null,
) {
    init {
        require(duration == null || duration > Fraction.ZERO) { "A duration is positive." }
    }

    public val rest: Boolean get() = pitch == null
}

/** An ordered sequence of exact notes and rests prepared for a passage; order and register are preserved. */
public data class Phrase(
    val id: PhraseId,
    val name: String,
    /** The section the phrase is prepared for, or null. */
    val section: SectionId? = null,
    val items: List<PhraseItem> = emptyList(),
)

/** Opaque, stable identity of a keyboard or other playing device. */
@JvmInline
public value class DeviceId(
    public val value: String,
)

/** Opaque, stable identity of a binding between a part and a device. */
@JvmInline
public value class BindingId(
    public val value: String,
)

/** Optional metadata about which hand a part is for; a part may leave it unassigned. */
public enum class HandRole { LEFT, RIGHT, BOTH, CONTEXTUAL }

/** A keyboard with the inclusive pitch range it can play; any number may exist and the default is all 88 keys. */
public data class Device(
    val id: DeviceId,
    val name: String,
    val range: PitchRange = Piano.range,
)

/**
 * A part assigned to a device over an inclusive physical range, with optional sound or layer text. Several parts
 * may share a device and ranges may overlap (splits and layers); a binding never copies or erases note content.
 */
public data class Binding(
    val id: BindingId,
    val partId: PartId,
    val deviceId: DeviceId,
    val range: PitchRange,
    val sound: String = "",
)
