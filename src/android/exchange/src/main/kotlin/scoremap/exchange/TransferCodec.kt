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

/** Packages that also carry the song key, lyrics and cues use this version; it may carry PDFs too. */
public const val TRANSFER_VERSION_WITH_SHEET: Int = 3

/** Packages that also carry measures and chord events use this version. */
public const val TRANSFER_VERSION_WITH_FORM: Int = 4

/** Packages that also carry performed parts and voicings use this version. */
public const val TRANSFER_VERSION_WITH_PARTS: Int = 5

/** Packages that also carry prepared phrases use this version. */
public const val TRANSFER_VERSION_WITH_PHRASES: Int = 6

private const val DEFAULT_MAX_CHARACTERS = 64 * 1024 * 1024
private const val DEFAULT_MAX_SONGS = 500
private const val DEFAULT_MAX_SECTIONS = 500
private const val DEFAULT_MAX_DEPTH = 16
private const val DEFAULT_MAX_MEASURES = 1000
private const val DEFAULT_MAX_EVENTS = 64
private const val DEFAULT_MAX_PARTS = 64
private const val DEFAULT_MAX_VOICINGS = 4096
private const val DEFAULT_MAX_NOTES = 128
private const val DEFAULT_MAX_PHRASES = 256
private const val DEFAULT_MAX_ITEMS = 4096
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
    val maxMeasuresPerSection: Int = DEFAULT_MAX_MEASURES,
    val maxEventsPerMeasure: Int = DEFAULT_MAX_EVENTS,
    val maxPartsPerSong: Int = DEFAULT_MAX_PARTS,
    val maxVoicingsPerPart: Int = DEFAULT_MAX_VOICINGS,
    val maxNotesPerVoicing: Int = DEFAULT_MAX_NOTES,
    val maxPhrasesPerPart: Int = DEFAULT_MAX_PHRASES,
    val maxItemsPerPhrase: Int = DEFAULT_MAX_ITEMS,
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
        val version =
            when {
                graph.songs.any { s -> s.parts.any { it.phrases.isNotEmpty() } } -> TRANSFER_VERSION_WITH_PHRASES
                graph.songs.any { it.parts.isNotEmpty() } -> TRANSFER_VERSION_WITH_PARTS
                graph.songs.any { s -> s.sections.any { it.measures.isNotEmpty() } } -> TRANSFER_VERSION_WITH_FORM
                graph.songs.any(::hasSheet) -> TRANSFER_VERSION_WITH_SHEET
                withPdfs -> TRANSFER_VERSION_WITH_PDFS
                else -> TRANSFER_VERSION
            }
        val songs = graph.songs.joinToString(",", "[", "]") { encodeSong(it) }
        val set =
            graph.set
                ?.let { set ->
                    ",\"set\":{\"name\":${JsonWriter.quote(set.name)},\"songKeys\":" +
                        set.songKeys.joinToString(",", "[", "]") { JsonWriter.quote(it) } + "}"
                }.orEmpty()
        return "{\"format\":\"$TRANSFER_FORMAT\",\"version\":$version,\"songs\":$songs$set}"
    }

    private fun hasSheet(song: GraphSong): Boolean =
        song.songKey != null || song.sections.any { it.lyrics.isNotEmpty() || it.cue.isNotEmpty() }

    private fun encodeSection(section: GraphSection): String {
        val lyrics = if (section.lyrics.isEmpty()) "" else ",\"lyrics\":${JsonWriter.quote(section.lyrics)}"
        val cue = if (section.cue.isEmpty()) "" else ",\"cue\":${JsonWriter.quote(section.cue)}"
        val measures =
            if (section.measures.isEmpty()) {
                ""
            } else {
                section.measures.joinToString(",", ",\"measures\":[", "]") {
                    FormWriter.measure(it)
                }
            }
        return "{\"name\":${JsonWriter.quote(section.name)},\"repeats\":${section.repeats}$lyrics$cue$measures}"
    }

    private fun encodeSong(song: GraphSong): String {
        val sections = song.sections.joinToString(",", "[", "]") { encodeSection(it) }
        val songKey = song.songKey?.let { ",\"songKey\":${JsonWriter.quote(it)}" }.orEmpty()
        val attachments =
            if (song.attachments.isEmpty()) {
                ""
            } else {
                song.attachments.joinToString(",", ",\"attachments\":[", "]") {
                    val data = Base64.getEncoder().encodeToString(it.pdf.bytes)
                    "{\"name\":${JsonWriter.quote(it.name)},\"data\":${JsonWriter.quote(data)}}"
                }
            }
        val parts =
            if (song.parts.isEmpty()) {
                ""
            } else {
                song.parts.joinToString(
                    ",",
                    ",\"parts\":[",
                    "]",
                ) { PartsWriter.part(it) }
            }
        return "{\"key\":${JsonWriter.quote(song.key)},\"name\":${JsonWriter.quote(song.name)}$songKey," +
            "\"sections\":$sections$attachments$parts}"
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
