package scoremap.feature.library

import scoremap.library.AttachResult
import scoremap.library.AttachmentCommands
import scoremap.library.AttachmentId
import scoremap.library.AttachmentService
import scoremap.library.IdSource
import scoremap.library.LibraryService
import scoremap.library.Mode
import scoremap.library.Refusal
import scoremap.library.ServiceResult
import scoremap.library.SongId

/** What the musician is told after an attachment action, and the facts needed to show one PDF. */
public class AttachmentOutcome(
    public val notice: Notice?,
)

/** PDF attachments of one song: attach from bytes, remove, remember the last page, and read bytes to view. */
public class AttachmentsModel(
    private val attachments: AttachmentService,
    private val library: LibraryService,
    private val commandIds: IdSource,
) {
    public fun attach(
        songId: String,
        name: String,
        bytes: ByteArray,
        mode: Mode,
    ): AttachmentOutcome =
        AttachmentOutcome(notice(attachments.attach(commandIds.next(), mode, SongId(songId), name, bytes)))

    public fun remove(
        songId: String,
        attachmentId: String,
        mode: Mode,
    ): AttachmentOutcome {
        val result =
            library.execute(commandIds.next()) {
                AttachmentCommands.detach(it, mode, SongId(songId), AttachmentId(attachmentId))
            }
        if (result is ServiceResult.Acknowledged) attachments.cleanup()
        return AttachmentOutcome(resultNotice(result, Notice.PDF_REMOVED))
    }

    /** Page navigation is not an edit, so it is accepted in every mode. */
    public fun rememberPage(
        songId: String,
        attachmentId: String,
        page: Int,
    ): AttachmentOutcome =
        AttachmentOutcome(
            notice(attachments.rememberPage(commandIds.next(), SongId(songId), AttachmentId(attachmentId), page))
                .takeIf { it != Notice.PDF_ATTACHED },
        )

    /** The stored bytes of an attached PDF, or null when they are not available. */
    public fun bytes(sha256: String): ByteArray? = attachments.bytes(sha256)

    private fun notice(result: AttachResult): Notice =
        when (result) {
            is AttachResult.Attached -> Notice.PDF_ATTACHED
            AttachResult.Rejected -> Notice.PDF_UNREADABLE
            is AttachResult.Conflict -> Notice.CONFLICT
            is AttachResult.StorageFailed -> Notice.STORAGE_FAILED
            is AttachResult.Refused -> refusal(result.refusal)
        }

    private fun refusal(refusal: Refusal): Notice =
        when (refusal) {
            Refusal.PDF_TOO_LARGE -> Notice.PDF_TOO_LARGE
            Refusal.PDF_UNSUPPORTED -> Notice.PDF_UNREADABLE
            Refusal.PERFORMANCE_MODE -> Notice.EDIT_MODE_REQUIRED
            Refusal.INVALID_NAME -> Notice.INVALID_NAME
            else -> Notice.FAILED
        }
}
