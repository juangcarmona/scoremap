package scoremap.library

/** Application port: inspects PDF bytes. Null means corrupt or unsupported, never a partial answer. */
public fun interface PdfInspector {
    public fun inspect(bytes: ByteArray): PdfFacts?
}

/** Application port: content-addressed storage of attachment bytes. */
public interface BlobStore {
    /** Stores the bytes atomically under their digest; false when they could not be stored whole. */
    public fun put(
        sha256: String,
        bytes: ByteArray,
    ): Boolean

    public fun read(sha256: String): ByteArray?

    /** Removes every stored blob whose digest is not listed. */
    public fun retainOnly(digests: Set<String>)
}

public sealed interface AttachResult {
    public data class Attached(
        val revision: Long,
        val replay: Boolean,
    ) : AttachResult

    /** The bytes are not a PDF this application can read; the song is untouched and can be retried. */
    public data object Rejected : AttachResult

    public data class Refused(
        val refusal: Refusal,
    ) : AttachResult

    public data class Conflict(
        val currentRevision: Long,
    ) : AttachResult

    public data class StorageFailed(
        val reason: String,
    ) : AttachResult
}

/**
 * Attaches PDFs to songs. The bytes are stored whole before the metadata commit, so metadata never points at
 * missing bytes; a failed commit removes whatever no song references, and a retry with the same command id
 * never attaches twice.
 */
public class AttachmentService(
    private val library: LibraryService,
    private val inspector: PdfInspector,
    private val blobs: BlobStore,
    private val ids: IdSource,
) {
    public fun current(songId: SongId): List<Attachment> =
        library
            .current()
            .library.songs
            .firstOrNull { it.id == songId }
            ?.attachments
            .orEmpty()

    public fun attach(
        commandId: String,
        mode: Mode,
        songId: SongId,
        name: String,
        bytes: ByteArray,
    ): AttachResult {
        val replay = library.acknowledged(commandId)
        val facts = if (replay == null && mode == Mode.EDIT) inspector.inspect(bytes) else null
        return when {
            replay != null -> AttachResult.Attached(replay, replay = true)
            mode != Mode.EDIT -> AttachResult.Refused(Refusal.PERFORMANCE_MODE)
            facts == null -> AttachResult.Rejected
            else -> store(commandId, mode, songId, PdfAttachment(name, facts), bytes)
        }
    }

    /** Page navigation is never blocked by the edit guard; it only has to be a valid page. */
    public fun rememberPage(
        commandId: String,
        songId: SongId,
        attachmentId: AttachmentId,
        page: Int,
    ): AttachResult =
        result(library.execute(commandId) { AttachmentCommands.rememberPage(it, songId, attachmentId, page) })

    /** Deletes stored bytes that no active or recoverably deleted song references. */
    public fun cleanup(): Unit = blobs.retainOnly(AttachmentCommands.referencedDigests(library.current().library))

    private fun store(
        commandId: String,
        mode: Mode,
        songId: SongId,
        pdf: PdfAttachment,
        bytes: ByteArray,
    ): AttachResult {
        val dryRun = AttachmentCommands.attach(library.current().library, mode, songId, pdf, ids)
        return when {
            dryRun is Outcome.Refused -> {
                AttachResult.Refused(dryRun.refusal)
            }

            !blobs.put(pdf.facts.sha256, bytes) -> {
                AttachResult.StorageFailed("The PDF could not be stored.")
            }

            else -> {
                result(library.execute(commandId) { AttachmentCommands.attach(it, mode, songId, pdf, ids) }).also {
                    if (it !is AttachResult.Attached) cleanup()
                }
            }
        }
    }

    private fun result(outcome: ServiceResult): AttachResult =
        when (outcome) {
            is ServiceResult.Acknowledged -> AttachResult.Attached(outcome.revision, outcome.replay)
            is ServiceResult.Refused -> AttachResult.Refused(outcome.refusal)
            is ServiceResult.Conflict -> AttachResult.Conflict(outcome.currentRevision)
            is ServiceResult.StorageFailed -> AttachResult.StorageFailed(outcome.reason)
        }
}
