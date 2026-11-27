package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

public class AttachmentRulesTest {
    private val ids = SequentialIds()
    private val pdf = PdfFacts(sha256 = "a".repeat(64), bytes = 2048, pages = 3)

    private fun withSong(): Pair<Library, SongId> {
        val library = ok(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "Song", ids))
        return library to library.songs.single().id
    }

    @Test
    public fun attachesAPdfToItsOwningSongStartingOnPageOne() {
        val (library, songId) = withSong()
        val attached = ok(AttachmentCommands.attach(library, Mode.EDIT, songId, PdfAttachment("  Score  ", pdf), ids))
        val attachment =
            attached.songs
                .single()
                .attachments
                .single()
        assertEquals("Score", attachment.name)
        assertEquals(pdf.sha256, attachment.sha256)
        assertEquals(3, attachment.pages)
        assertEquals(1, attachment.lastPage)
        assertEquals(2L, attached.songs.single().revision)
    }

    @Test
    public fun refusesNamesAndPdfsOutsideTheSupportedBounds() {
        val (library, songId) = withSong()
        assertEquals(
            Refusal.INVALID_NAME,
            refusal(AttachmentCommands.attach(library, Mode.EDIT, songId, PdfAttachment(" ", pdf), ids)),
        )
        val tooBig = pdf.copy(bytes = PdfLimits.MAX_BYTES + 1)
        val empty = pdf.copy(bytes = 0)
        val noPages = pdf.copy(pages = 0)
        val manyPages = pdf.copy(pages = PdfLimits.MAX_PAGES + 1)
        assertEquals(
            Refusal.PDF_TOO_LARGE,
            refusal(AttachmentCommands.attach(library, Mode.EDIT, songId, PdfAttachment("S", tooBig), ids)),
        )
        assertEquals(
            Refusal.PDF_UNSUPPORTED,
            refusal(AttachmentCommands.attach(library, Mode.EDIT, songId, PdfAttachment("S", empty), ids)),
        )
        assertEquals(
            Refusal.PDF_UNSUPPORTED,
            refusal(AttachmentCommands.attach(library, Mode.EDIT, songId, PdfAttachment("S", noPages), ids)),
        )
        assertEquals(
            Refusal.PDF_UNSUPPORTED,
            refusal(AttachmentCommands.attach(library, Mode.EDIT, songId, PdfAttachment("S", manyPages), ids)),
        )
        assertEquals(
            Refusal.UNKNOWN_SONG,
            refusal(AttachmentCommands.attach(library, Mode.EDIT, SongId("x"), PdfAttachment("S", pdf), ids)),
        )
        assertEquals(emptyList<Attachment>(), library.songs.single().attachments)
    }

    @Test
    public fun theBoundaryValuesThemselvesAreAccepted() {
        val (library, songId) = withSong()
        val limit = pdf.copy(bytes = PdfLimits.MAX_BYTES, pages = PdfLimits.MAX_PAGES)
        assertTrue(attach(library, songId, "S", limit) is Outcome.Accepted)
        val smallest = pdf.copy(bytes = 1, pages = 1)
        assertTrue(attach(library, songId, "S", smallest) is Outcome.Accepted)
    }

    @Test
    public fun detachingIsAnEditAndRevisionedButNavigationIsNeverBlockedByTheEditGuard() {
        val (library, songId) = withSong()
        val attached = ok(AttachmentCommands.attach(library, Mode.EDIT, songId, PdfAttachment("Score", pdf), ids))
        val attachmentId =
            attached.songs
                .single()
                .attachments
                .single()
                .id
        assertEquals(
            Refusal.PERFORMANCE_MODE,
            refusal(AttachmentCommands.detach(attached, Mode.PERFORMANCE, songId, attachmentId)),
        )
        assertEquals(
            Refusal.PERFORMANCE_MODE,
            refusal(AttachmentCommands.attach(attached, Mode.PERFORMANCE, songId, PdfAttachment("S", pdf), ids)),
        )
        val turned = ok(AttachmentCommands.rememberPage(attached, songId, attachmentId, 3))
        assertEquals(
            3,
            turned.songs
                .single()
                .attachments
                .single()
                .lastPage,
        )
        assertEquals(attached.songs.single().revision, turned.songs.single().revision)
        val detached = ok(AttachmentCommands.detach(turned, Mode.EDIT, songId, attachmentId))
        assertEquals(emptyList<Attachment>(), detached.songs.single().attachments)
    }

    @Test
    public fun theRememberedPageStaysBetweenPageOneAndTheLastPage() {
        val (library, songId) = withSong()
        val attached = ok(AttachmentCommands.attach(library, Mode.EDIT, songId, PdfAttachment("Score", pdf), ids))
        val id =
            attached.songs
                .single()
                .attachments
                .single()
                .id
        for (page in listOf(0, -1, 4, Int.MAX_VALUE)) {
            assertEquals(
                page.toString(),
                Refusal.INVALID_PAGE,
                refusal(AttachmentCommands.rememberPage(attached, songId, id, page)),
            )
        }
        assertEquals(
            Refusal.UNKNOWN_ATTACHMENT,
            refusal(AttachmentCommands.rememberPage(attached, songId, AttachmentId("x"), 1)),
        )
        assertEquals(
            1,
            attached.songs
                .single()
                .attachments
                .single()
                .lastPage,
        )
    }

    @Test
    public fun attachmentsFollowTheirSongThroughDeleteRestoreAndPurge() {
        val (library, songId) = withSong()
        var current = ok(AttachmentCommands.attach(library, Mode.EDIT, songId, PdfAttachment("Score", pdf), ids))
        val revision = current.songs.single().revision
        current = ok(RetentionCommands.deleteSong(current, Mode.EDIT, songId, revision))
        assertEquals(
            1,
            current.deletedSongs
                .single()
                .attachments.size,
        )
        current = ok(RetentionCommands.restoreSong(current, Mode.EDIT, songId, revision, Confirmation.Confirmed))
        assertEquals(
            "Score",
            current.songs
                .single()
                .attachments
                .single()
                .name,
        )
        val again = current.songs.single().revision
        current = ok(RetentionCommands.deleteSong(current, Mode.EDIT, songId, again))
        current = ok(RetentionCommands.purgeSong(current, Mode.EDIT, songId, again, Confirmation.Named("Song")))
        assertEquals(emptyList<String>(), AttachmentCommands.referencedDigests(current).toList())
    }

    @Test
    public fun listsEveryDigestStillReferencedSoUnreferencedBytesCanBeCleanedUp() {
        val (library, songId) = withSong()
        var current = ok(AttachmentCommands.attach(library, Mode.EDIT, songId, PdfAttachment("One", pdf), ids))
        current =
            ok(attach(current, songId, "Two", pdf.copy(sha256 = "b".repeat(64))))
        assertEquals(setOf("a".repeat(64), "b".repeat(64)), AttachmentCommands.referencedDigests(current))
        val first =
            current.songs
                .single()
                .attachments
                .first()
                .id
        current = ok(AttachmentCommands.detach(current, Mode.EDIT, songId, first))
        assertEquals(setOf("b".repeat(64)), AttachmentCommands.referencedDigests(current))
    }

    private fun attach(
        library: Library,
        songId: SongId,
        name: String,
        facts: PdfFacts,
        mode: Mode = Mode.EDIT,
    ): Outcome<Library> = AttachmentCommands.attach(library, mode, songId, PdfAttachment(name, facts), ids)

    private fun ok(outcome: Outcome<Library>): Library =
        (outcome as? Outcome.Accepted)?.value ?: error("Expected acceptance but got $outcome")

    private fun refusal(outcome: Outcome<Library>): Refusal =
        (outcome as? Outcome.Refused)?.refusal ?: error("Expected a refusal but got $outcome")

    private class SequentialIds : IdSource {
        private var next = 0

        override fun next(): String = "id-${next++}"
    }
}
