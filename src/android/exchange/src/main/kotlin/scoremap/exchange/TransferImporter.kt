package scoremap.exchange

import scoremap.library.AttachmentCommands
import scoremap.library.BlobStore
import scoremap.library.Confirmation
import scoremap.library.IdSource
import scoremap.library.ImportCommands
import scoremap.library.LibraryService
import scoremap.library.Mode
import scoremap.library.Outcome
import scoremap.library.PdfFacts
import scoremap.library.PdfInspector
import scoremap.library.Refusal
import scoremap.library.ServiceResult
import scoremap.library.TransferGraph

public sealed interface ImportResult {
    public data class Imported(
        val revision: Long,
        val replay: Boolean,
    ) : ImportResult

    public data class Rejected(
        val reason: Rejection,
    ) : ImportResult

    /** One of the package's PDFs cannot be read; nothing was imported and nothing was stored. */
    public data class PdfUnreadable(
        val song: String,
        val attachment: String,
    ) : ImportResult

    public data class Refused(
        val refusal: Refusal,
    ) : ImportResult

    public data class Conflict(
        val currentRevision: Long,
    ) : ImportResult

    public data class StorageFailed(
        val reason: String,
    ) : ImportResult
}

/**
 * Imports a confirmed package, PDFs included, as one atomic change: every PDF is inspected and stored whole
 * before the commit, a failure at any point removes whatever no song references, and retrying a command id
 * never imports twice.
 */
public class TransferImporter(
    private val library: LibraryService,
    private val inspector: PdfInspector,
    private val blobs: BlobStore,
    private val ids: IdSource,
    private val limits: TransferLimits = TransferLimits(),
) {
    public fun importConfirmed(
        commandId: String,
        mode: Mode,
        text: String,
        confirmation: Confirmation,
    ): ImportResult {
        val replay = library.acknowledged(commandId)
        return when {
            replay != null -> ImportResult.Imported(replay, replay = true)
            mode != Mode.EDIT -> ImportResult.Refused(Refusal.PERFORMANCE_MODE)
            else -> decoded(commandId, text, confirmation)
        }
    }

    private fun decoded(
        commandId: String,
        text: String,
        confirmation: Confirmation,
    ): ImportResult =
        when (val decoded = TransferCodec.decode(text, limits)) {
            is DecodeOutcome.Rejected -> {
                ImportResult.Rejected(decoded.reason)
            }

            is DecodeOutcome.Decoded -> {
                if (confirmation == Confirmation.Cancelled) {
                    ImportResult.Refused(Refusal.CANCELLED)
                } else {
                    inspected(commandId, decoded.graph)
                }
            }
        }

    private fun inspected(
        commandId: String,
        graph: TransferGraph,
    ): ImportResult {
        val facts = mutableMapOf<String, List<PdfFacts>>()
        for (song in graph.songs) {
            val inspected = song.attachments.map { it to inspector.inspect(it.pdf.bytes) }
            inspected.firstOrNull { it.second == null }?.let {
                return ImportResult.PdfUnreadable(song.name, it.first.name)
            }
            facts[song.key] = inspected.mapNotNull { it.second }
        }
        return stored(commandId, graph, facts)
    }

    private fun stored(
        commandId: String,
        graph: TransferGraph,
        facts: Map<String, List<PdfFacts>>,
    ): ImportResult {
        val dryRun = ImportCommands.importGraph(library.current().library, Mode.EDIT, graph, ids, facts)
        val bytes = graph.songs.flatMap { it.attachments }.map { it.pdf.bytes }
        val digests = graph.songs.flatMap { song -> facts[song.key].orEmpty() }.map { it.sha256 }
        return when {
            dryRun is Outcome.Refused -> {
                ImportResult.Refused(dryRun.refusal)
            }

            !bytes.indices.all { blobs.put(digests[it], bytes[it]) } -> {
                cleanup()
                ImportResult.StorageFailed("A PDF could not be stored.")
            }

            else -> {
                commit(commandId, graph, facts)
            }
        }
    }

    private fun commit(
        commandId: String,
        graph: TransferGraph,
        facts: Map<String, List<PdfFacts>>,
    ): ImportResult {
        val result = library.execute(commandId) { ImportCommands.importGraph(it, Mode.EDIT, graph, ids, facts) }
        if (result !is ServiceResult.Acknowledged) cleanup()
        return when (result) {
            is ServiceResult.Acknowledged -> ImportResult.Imported(result.revision, result.replay)
            is ServiceResult.Refused -> ImportResult.Refused(result.refusal)
            is ServiceResult.Conflict -> ImportResult.Conflict(result.currentRevision)
            is ServiceResult.StorageFailed -> ImportResult.StorageFailed(result.reason)
        }
    }

    /** Removes bytes no active or recoverably deleted song references. */
    private fun cleanup() = blobs.retainOnly(AttachmentCommands.referencedDigests(library.current().library))
}
