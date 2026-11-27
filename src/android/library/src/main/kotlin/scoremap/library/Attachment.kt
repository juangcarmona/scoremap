package scoremap.library

/** Opaque, stable identity of a song-owned PDF attachment. */
@JvmInline
public value class AttachmentId(
    public val value: String,
)

/** The facts about a PDF that the application keeps; the bytes live in a content-addressed blob store. */
public data class Attachment(
    val id: AttachmentId,
    val name: String,
    val sha256: String,
    val bytes: Long,
    val pages: Int,
    val lastPage: Int,
)

/** What an inspector established about a PDF before it is admitted. */
public data class PdfFacts(
    val sha256: String,
    val bytes: Long,
    val pages: Int,
)

/** A named PDF offered for attachment to a song. */
public data class PdfAttachment(
    val name: String,
    val facts: PdfFacts,
)

/** Admission limits taken from the experimental server-side validator, so both realizations agree. */
public object PdfLimits {
    public const val MAX_BYTES: Long = 8L * 1024 * 1024
    public const val MAX_PAGES: Int = 200
}
