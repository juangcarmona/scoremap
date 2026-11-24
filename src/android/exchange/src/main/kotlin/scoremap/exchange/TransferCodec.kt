package scoremap.exchange

import scoremap.library.GraphSection
import scoremap.library.GraphSet
import scoremap.library.GraphSong
import scoremap.library.TransferGraph
import java.util.Base64

public const val TRANSFER_FORMAT: String = "scoremap-transfer"
public const val TRANSFER_VERSION: Int = 1

/** Packages that carry PDF bytes use this version; plain song and set packages stay on version 1. */
public const val TRANSFER_VERSION_WITH_PDFS: Int = 2

private const val DEFAULT_MAX_CHARACTERS = 64 * 1024 * 1024
private const val DEFAULT_MAX_SONGS = 500
private const val DEFAULT_MAX_SECTIONS = 500
private const val DEFAULT_MAX_DEPTH = 16
private const val DEFAULT_MAX_PDF_BYTES = 8 * 1024 * 1024
private const val DEFAULT_MAX_TOTAL_PDF_BYTES = 32 * 1024 * 1024
private const val DEFAULT_MAX_PDFS_PER_SONG = 20

/** Bounds on the PDFs a package carries; the per-file bound matches the PDF admission limit. */
public data class AttachmentLimits(
    val maxBytes: Int = DEFAULT_MAX_PDF_BYTES,
    val maxTotalBytes: Int = DEFAULT_MAX_TOTAL_PDF_BYTES,
    val maxPerSong: Int = DEFAULT_MAX_PDFS_PER_SONG,
)

/** Bounds applied before and while a package is read; anything larger is refused, never truncated. */
public data class TransferLimits(
    val maxCharacters: Int = DEFAULT_MAX_CHARACTERS,
    val maxSongs: Int = DEFAULT_MAX_SONGS,
    val maxSectionsPerSong: Int = DEFAULT_MAX_SECTIONS,
    val maxDepth: Int = DEFAULT_MAX_DEPTH,
    val attachments: AttachmentLimits = AttachmentLimits(),
)

public enum class Rejection { MALFORMED, OVERSIZED, UNSUPPORTED_FORMAT, UNSUPPORTED_VERSION, INVALID_STRUCTURE }

public sealed interface DecodeOutcome {
    public data class Decoded(
        val graph: TransferGraph,
    ) : DecodeOutcome

    public data class Rejected(
        val reason: Rejection,
    ) : DecodeOutcome
}

/** The versioned text format of a song or ordered set. Decoding validates shape and bounds only. */
public object TransferCodec {
    public fun encode(graph: TransferGraph): String {
        val withPdfs = graph.songs.any { it.attachments.isNotEmpty() }
        val version = if (withPdfs) TRANSFER_VERSION_WITH_PDFS else TRANSFER_VERSION
        val songs = graph.songs.joinToString(",", "[", "]") { encodeSong(it) }
        val set =
            graph.set
                ?.let { set ->
                    ",\"set\":{\"name\":${JsonWriter.quote(set.name)},\"songKeys\":" +
                        set.songKeys.joinToString(",", "[", "]") { JsonWriter.quote(it) } + "}"
                }.orEmpty()
        return "{\"format\":\"$TRANSFER_FORMAT\",\"version\":$version,\"songs\":$songs$set}"
    }

    private fun encodeSong(song: GraphSong): String {
        val sections =
            song.sections.joinToString(",", "[", "]") {
                "{\"name\":${JsonWriter.quote(it.name)},\"repeats\":${it.repeats}}"
            }
        val attachments =
            if (song.attachments.isEmpty()) {
                ""
            } else {
                song.attachments.joinToString(",", ",\"attachments\":[", "]") {
                    val data = Base64.getEncoder().encodeToString(it.pdf.bytes)
                    "{\"name\":${JsonWriter.quote(it.name)},\"data\":${JsonWriter.quote(data)}}"
                }
            }
        return "{\"key\":${JsonWriter.quote(song.key)},\"name\":${JsonWriter.quote(song.name)}," +
            "\"sections\":$sections$attachments}"
    }

    public fun decode(
        text: String,
        limits: TransferLimits = TransferLimits(),
    ): DecodeOutcome =
        if (text.length > limits.maxCharacters) {
            DecodeOutcome.Rejected(Rejection.OVERSIZED)
        } else {
            parse(text, limits)
        }

    private fun parse(
        text: String,
        limits: TransferLimits,
    ): DecodeOutcome =
        try {
            val root = JsonReader.read(text, limits.maxDepth)
            if (root is Json.Obj) DocumentReader(limits).read(root) else DecodeOutcome.Rejected(Rejection.MALFORMED)
        } catch (failure: JsonFailure) {
            DecodeOutcome.Rejected(if (failure.tooDeep) Rejection.OVERSIZED else Rejection.MALFORMED)
        }
}
