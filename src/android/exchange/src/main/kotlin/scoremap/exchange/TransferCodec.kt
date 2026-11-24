package scoremap.exchange

import scoremap.library.GraphSection
import scoremap.library.GraphSet
import scoremap.library.GraphSong
import scoremap.library.TransferGraph

public const val TRANSFER_FORMAT: String = "scoremap-transfer"
public const val TRANSFER_VERSION: Int = 1

private const val DEFAULT_MAX_CHARACTERS = 1_048_576
private const val DEFAULT_MAX_SONGS = 500
private const val DEFAULT_MAX_SECTIONS = 500
private const val DEFAULT_MAX_DEPTH = 16

/** Bounds applied before and while a package is read; anything larger is refused, never truncated. */
public data class TransferLimits(
    val maxCharacters: Int = DEFAULT_MAX_CHARACTERS,
    val maxSongs: Int = DEFAULT_MAX_SONGS,
    val maxSectionsPerSong: Int = DEFAULT_MAX_SECTIONS,
    val maxDepth: Int = DEFAULT_MAX_DEPTH,
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
        val songs =
            graph.songs.joinToString(",", "[", "]") { song ->
                val sections =
                    song.sections.joinToString(",", "[", "]") {
                        "{\"name\":${JsonWriter.quote(it.name)},\"repeats\":${it.repeats}}"
                    }
                "{\"key\":${JsonWriter.quote(song.key)},\"name\":${JsonWriter.quote(song.name)},\"sections\":$sections}"
            }
        val set =
            graph.set
                ?.let { set ->
                    ",\"set\":{\"name\":${JsonWriter.quote(set.name)},\"songKeys\":" +
                        set.songKeys.joinToString(",", "[", "]") { JsonWriter.quote(it) } + "}"
                }.orEmpty()
        return "{\"format\":\"$TRANSFER_FORMAT\",\"version\":$TRANSFER_VERSION,\"songs\":$songs$set}"
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

private class Invalid(
    val reason: Rejection,
) : Exception()

private class DocumentReader(
    private val limits: TransferLimits,
) {
    fun read(root: Json.Obj): DecodeOutcome =
        try {
            DecodeOutcome.Decoded(graph(root))
        } catch (invalid: Invalid) {
            DecodeOutcome.Rejected(invalid.reason)
        }

    private fun graph(root: Json.Obj): TransferGraph {
        val format = root.fields["format"] as? Json.Text ?: invalid()
        need(format.value == TRANSFER_FORMAT, Rejection.UNSUPPORTED_FORMAT)
        val version = root.fields["version"] as? Json.Integer ?: invalid()
        need(version.value == TRANSFER_VERSION.toLong(), Rejection.UNSUPPORTED_VERSION)
        exactly(root, setOf("format", "version", "songs"), optional = setOf("set"))
        val songs = (root.fields["songs"] as? Json.Array ?: invalid()).items
        need(songs.size <= limits.maxSongs, Rejection.OVERSIZED)
        return TransferGraph(songs.map(::song), root.fields["set"]?.let(::set))
    }

    private fun need(
        condition: Boolean,
        reason: Rejection,
    ) {
        if (!condition) throw Invalid(reason)
    }

    private fun song(value: Json): GraphSong {
        val obj = value as? Json.Obj ?: invalid()
        exactly(obj, setOf("key", "name", "sections"))
        val sections = (obj.fields["sections"] as? Json.Array ?: invalid()).items
        need(sections.size <= limits.maxSectionsPerSong, Rejection.OVERSIZED)
        return GraphSong(text(obj, "key"), text(obj, "name"), sections.map(::section))
    }

    private fun section(value: Json): GraphSection {
        val obj = value as? Json.Obj ?: invalid()
        exactly(obj, setOf("name", "repeats"))
        val repeats = obj.fields["repeats"] as? Json.Integer ?: invalid()
        if (repeats.value !in Int.MIN_VALUE..Int.MAX_VALUE) invalid()
        return GraphSection(text(obj, "name"), repeats.value.toInt())
    }

    private fun set(value: Json): GraphSet {
        val obj = value as? Json.Obj ?: invalid()
        exactly(obj, setOf("name", "songKeys"))
        val keys =
            (obj.fields["songKeys"] as? Json.Array ?: invalid()).items.map {
                (it as? Json.Text ?: invalid())
                    .value
            }
        return GraphSet(text(obj, "name"), keys)
    }

    private fun text(
        obj: Json.Obj,
        name: String,
    ): String = (obj.fields[name] as? Json.Text ?: invalid()).value

    private fun exactly(
        obj: Json.Obj,
        required: Set<String>,
        optional: Set<String> = emptySet(),
    ) {
        if (!obj.fields.keys.containsAll(required) || !(required + optional).containsAll(obj.fields.keys)) invalid()
    }

    private fun invalid(): Nothing = throw Invalid(Rejection.INVALID_STRUCTURE)
}
