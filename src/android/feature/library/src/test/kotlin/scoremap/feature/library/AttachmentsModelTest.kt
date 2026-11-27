package scoremap.feature.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import scoremap.library.AttachmentService
import scoremap.library.LibraryService
import scoremap.library.Mode
import scoremap.library.PdfLimits

public class AttachmentsModelTest {
    private val store = MemoryStore()
    private val blobs = FakeBlobs()
    private val service = LibraryService(store)
    private val songs = LibraryScreenModel(service, Ids("song"), Ids("songcmd"))
    private val detail = SongDetailModel(service, Ids("section"), Ids("detailcmd"))
    private val attachments =
        AttachmentsModel(AttachmentService(service, FakeInspector(), blobs, Ids("att")), service, Ids("attcmd"))
    private val songId =
        songs
            .createSong("Song", Mode.EDIT)
            .songs
            .single()
            .id

    private fun attached() = requireNotNull(detail.load(songId)).attachments

    @Test
    public fun attachesAReadablePdfAndTheSongShowsItOnPageOne() {
        assertEquals(Notice.PDF_ATTACHED, attachments.attach(songId, " Score ", pdfBytes(3), Mode.EDIT).notice)
        val item = attached().single()
        assertEquals("Score", item.name)
        assertEquals(3, item.pages)
        assertEquals(1, item.lastPage)
        assertTrue(attachments.bytes(item.sha256)!!.contentEquals(pdfBytes(3)))
    }

    @Test
    public fun anUnreadableOrOversizedPdfIsExplainedAndTheSongIsNotChanged() {
        assertEquals(Notice.PDF_UNREADABLE, attachments.attach(songId, "Bad", "nope".toByteArray(), Mode.EDIT).notice)
        assertEquals(Notice.PDF_UNREADABLE, attachments.attach(songId, "Empty", ByteArray(0), Mode.EDIT).notice)
        val big = pdfBytes(1) + ByteArray(PdfLimits.MAX_BYTES.toInt())
        assertEquals(Notice.PDF_TOO_LARGE, attachments.attach(songId, "Big", big, Mode.EDIT).notice)
        assertEquals(emptyList<AttachmentItem>(), attached())
        assertEquals(0, blobs.count())
        assertEquals(1L, requireNotNull(detail.load(songId)).revision)
    }

    @Test
    public fun performanceModeRefusesToAttachOrRemoveButStillRemembersThePage() {
        attachments.attach(songId, "Score", pdfBytes(5), Mode.EDIT)
        val id = attached().single().id
        assertEquals(
            Notice.EDIT_MODE_REQUIRED,
            attachments.attach(songId, "Other", pdfBytes(2), Mode.PERFORMANCE).notice,
        )
        assertEquals(Notice.EDIT_MODE_REQUIRED, attachments.remove(songId, id, Mode.PERFORMANCE).notice)
        assertNull(attachments.rememberPage(songId, id, 4).notice)
        assertEquals(4, attached().single().lastPage)
        assertEquals(1, attached().size)
    }

    @Test
    public fun anInvalidPageIsRefusedAndTheRememberedPageStays() {
        attachments.attach(songId, "Score", pdfBytes(3), Mode.EDIT)
        val id = attached().single().id
        attachments.rememberPage(songId, id, 2)
        for (page in listOf(0, 4, -1)) assertEquals(Notice.FAILED, attachments.rememberPage(songId, id, page).notice)
        assertEquals(2, attached().single().lastPage)
    }

    @Test
    public fun removingAPdfAlsoRemovesItsStoredBytes() {
        attachments.attach(songId, "Score", pdfBytes(2), Mode.EDIT)
        val item = attached().single()
        assertEquals(Notice.PDF_REMOVED, attachments.remove(songId, item.id, Mode.EDIT).notice)
        assertEquals(emptyList<AttachmentItem>(), attached())
        assertEquals(0, blobs.count())
        assertNull(attachments.bytes(item.sha256))
    }

    @Test
    public fun aStorageFailureKeepsThePriorAttachments() {
        attachments.attach(songId, "Kept", pdfBytes(2), Mode.EDIT)
        store.failNext = true
        assertEquals(Notice.STORAGE_FAILED, attachments.attach(songId, "Lost", pdfBytes(3), Mode.EDIT).notice)
        assertEquals(listOf("Kept"), attached().map { it.name })
        assertEquals(1, blobs.count())
    }
}
