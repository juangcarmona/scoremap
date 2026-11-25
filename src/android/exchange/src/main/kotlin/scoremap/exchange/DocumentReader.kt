package scoremap.exchange

import scoremap.library.GraphSection
import scoremap.library.GraphSet
import scoremap.library.GraphSong
import scoremap.library.TransferGraph

/** Validates the shape of a decoded document and builds the identity-free graph from it. */
internal class DocumentReader(
    private val limits: TransferLimits,
) {
    private val attachments = AttachmentReader(limits.attachments)
    private var carriesPdfs = false
    private var carriesSheet = false
    private var carriesForm = false
    private var carriesParts = false
    private var parts = PartsReader(limits, false)
    private val form = FormReader(limits)

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
        need(
            version.value in TRANSFER_VERSION.toLong()..TRANSFER_VERSION_WITH_PHRASES.toLong(),
            Rejection.UNSUPPORTED_VERSION,
        )
        carriesPdfs = version.value >= TRANSFER_VERSION_WITH_PDFS.toLong()
        carriesSheet = version.value >= TRANSFER_VERSION_WITH_SHEET.toLong()
        carriesForm = version.value >= TRANSFER_VERSION_WITH_FORM.toLong()
        carriesParts = version.value >= TRANSFER_VERSION_WITH_PARTS.toLong()
        parts = PartsReader(limits, version.value >= TRANSFER_VERSION_WITH_PHRASES.toLong())
        exactly(root, setOf("format", "version", "songs"), optional = setOf("set"))
        val songs = (root.fields["songs"] as? Json.Array ?: invalid()).items
        need(songs.size <= limits.maxSongs, Rejection.OVERSIZED)
        return TransferGraph(songs.map(::song), root.fields["set"]?.let(::set))
    }

    private fun song(value: Json): GraphSong {
        val obj = value as? Json.Obj ?: invalid()
        val optional =
            (if (carriesPdfs) setOf("attachments") else emptySet()) +
                (if (carriesSheet) setOf("songKey") else emptySet()) +
                (if (carriesParts) setOf("parts") else emptySet())
        exactly(obj, setOf("key", "name", "sections"), optional = optional)
        val sections = (obj.fields["sections"] as? Json.Array ?: invalid()).items
        need(sections.size <= limits.maxSectionsPerSong, Rejection.OVERSIZED)
        return GraphSong(
            text(obj, "key"),
            text(obj, "name"),
            sections.map(::section),
            obj.fields["attachments"]?.let(attachments::read).orEmpty(),
            obj.fields["songKey"]?.let { (it as? Json.Text ?: invalid()).value },
            obj.fields["parts"]?.let(parts::read).orEmpty(),
        )
    }

    private fun section(value: Json): GraphSection {
        val obj = value as? Json.Obj ?: invalid()
        exactly(obj, setOf("name", "repeats"), optional = sectionFields())
        val repeats = obj.fields["repeats"] as? Json.Integer ?: invalid()
        if (repeats.value !in Int.MIN_VALUE..Int.MAX_VALUE) invalid()
        return GraphSection(
            text(obj, "name"),
            repeats.value.toInt(),
            obj.fields["lyrics"]?.let { (it as? Json.Text ?: invalid()).value }.orEmpty(),
            obj.fields["cue"]?.let { (it as? Json.Text ?: invalid()).value }.orEmpty(),
            obj.fields["measures"]?.let(form::read).orEmpty(),
        )
    }

    private fun sectionFields(): Set<String> =
        (if (carriesSheet) setOf("lyrics", "cue") else emptySet()) +
            (if (carriesForm) setOf("measures") else emptySet())

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
}
