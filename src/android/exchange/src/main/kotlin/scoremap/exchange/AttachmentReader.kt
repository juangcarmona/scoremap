package scoremap.exchange

import scoremap.library.GraphAttachment
import scoremap.library.PdfBytes
import java.util.Base64

/** Reads the PDFs of a song, refusing any file or running total beyond the declared limits. */
internal class AttachmentReader(
    private val limits: AttachmentLimits,
) {
    private var total = 0L

    fun read(value: Json): List<GraphAttachment> {
        val items = (value as? Json.Array ?: invalid()).items
        need(items.size <= limits.maxPerSong, Rejection.OVERSIZED)
        return items.map(::attachment)
    }

    private fun attachment(value: Json): GraphAttachment {
        val obj = value as? Json.Obj ?: invalid()
        exactly(obj, setOf("name", "data"))
        val encoded = text(obj, "data")
        // Encoded length bounds the decoded size, so oversized data is refused before it is decoded.
        need(
            encoded.length * BASE64_NUMERATOR / BASE64_DENOMINATOR <= limits.maxBytes + BASE64_SLACK,
            Rejection.OVERSIZED,
        )
        val bytes =
            try {
                Base64.getDecoder().decode(encoded)
            } catch (failure: IllegalArgumentException) {
                failure.message
                invalid()
            }
        need(bytes.size <= limits.maxBytes, Rejection.OVERSIZED)
        total += bytes.size
        need(total <= limits.maxTotalBytes, Rejection.OVERSIZED)
        return GraphAttachment(text(obj, "name"), PdfBytes(bytes))
    }

    private companion object {
        const val BASE64_NUMERATOR = 3L
        const val BASE64_DENOMINATOR = 4L
        const val BASE64_SLACK = 4
    }
}
