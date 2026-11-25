package scoremap.library

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
)
