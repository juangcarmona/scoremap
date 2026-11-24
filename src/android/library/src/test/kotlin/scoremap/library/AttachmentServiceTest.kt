package scoremap.library

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.security.MessageDigest

public class AttachmentServiceTest {
    private val ids = SequentialIds()
    private val store = MemoryStore()
    private val blobs = FakeBlobs()
    private val library = LibraryService(store)
    private val attachments = AttachmentService(library, FakeInspector(), blobs, ids)
    private val songId: SongId

    init {
        library.execute("song") { LibraryCommands.createSong(it, Mode.EDIT, "Song", ids) }
        songId =
            library
                .current()
                .library.songs
                .single()
                .id
    }

    private fun pdf(pages: Int = 3): ByteArray = "%PDF".toByteArray() + byteArrayOf(pages.toByte()) + ByteArray(100)

    @Test
    public fun storesTheBytesThenAcknowledgesTheMetadataAndAReopenedServiceSeesBoth() {
        val bytes = pdf()
        val result = attachments.attach("a1", Mode.EDIT, songId, "Score", bytes)
        assertEquals(AttachResult.Attached(revision = 2, replay = false), result)
        val attachment =
            library
                .current()
                .library.songs
                .single()
                .attachments
                .single()
        assertEquals(3, attachment.pages)
        assertTrue(blobs.read(attachment.sha256)!!.contentEquals(bytes))
        val reopened = AttachmentService(LibraryService(store), FakeInspector(), blobs, ids)
        assertEquals(attachment, reopened.current(songId).single())
    }

    @Test
    public fun aCorruptOrUnsupportedPdfIsRejectedWithoutTouchingTheSongOrTheBlobs() {
        for (bytes in listOf(ByteArray(0), "not a pdf".toByteArray(), "%PDF".toByteArray() + byteArrayOf(0))) {
            assertEquals(AttachResult.Rejected, attachments.attach("bad", Mode.EDIT, songId, "Score", bytes))
        }
        assertEquals(
            emptyList<Attachment>(),
            library
                .current()
                .library.songs
                .single()
                .attachments,
        )
        assertEquals(0, blobs.puts)
        assertEquals(
            1,
            library
                .current()
                .library.songs
                .single()
                .revision,
        )
    }

    @Test
    public fun anOversizedPdfIsRefusedBeforeAnyByteIsStored() {
        val big = "%PDF".toByteArray() + byteArrayOf(2) + ByteArray(PdfLimits.MAX_BYTES.toInt())
        assertEquals(
            AttachResult.Refused(Refusal.PDF_TOO_LARGE),
            attachments.attach("big", Mode.EDIT, songId, "Score", big),
        )
        assertEquals(0, blobs.puts)
    }

    @Test
    public fun performanceModeNeverInspectsOrStoresAnything() {
        val result = attachments.attach("p", Mode.PERFORMANCE, songId, "Score", pdf())
        assertEquals(AttachResult.Refused(Refusal.PERFORMANCE_MODE), result)
        assertEquals(0, blobs.puts)
        assertEquals(0, FakeInspector.inspections)
    }

    @Test
    public fun lowStorageLeavesTheLibraryUntouchedAndAcknowledgesNothing() {
        blobs.failPut = true
        val result = attachments.attach("low", Mode.EDIT, songId, "Score", pdf())
        assertEquals(AttachResult.StorageFailed("The PDF could not be stored."), result)
        assertEquals(
            emptyList<Attachment>(),
            library
                .current()
                .library.songs
                .single()
                .attachments,
        )
        assertEquals(null, store.acknowledged("low"))
    }

    @Test
    public fun aFailedCommitCleansUpTheStoredBytesAndARetryAppliesExactlyOnce() {
        store.failNext = true
        val failed = attachments.attach("c1", Mode.EDIT, songId, "Score", pdf())
        assertTrue(failed.toString(), failed is AttachResult.StorageFailed)
        assertEquals(
            emptyList<Attachment>(),
            library
                .current()
                .library.songs
                .single()
                .attachments,
        )
        assertEquals(0, blobs.count())
        val retried = attachments.attach("c1", Mode.EDIT, songId, "Score", pdf())
        assertEquals(AttachResult.Attached(revision = 2, replay = false), retried)
        assertEquals(1, blobs.count())
    }

    @Test
    public fun anIdempotentRetryAddsNeitherASecondAttachmentNorASecondBlob() {
        attachments.attach("same", Mode.EDIT, songId, "Score", pdf())
        val retry = attachments.attach("same", Mode.EDIT, songId, "Score", pdf())
        assertEquals(AttachResult.Attached(revision = 2, replay = true), retry)
        assertEquals(
            1,
            library
                .current()
                .library.songs
                .single()
                .attachments.size,
        )
        assertEquals(1, blobs.puts)
    }

    @Test
    public fun cleanupRemovesBytesNoSongReferencesAnymore() {
        attachments.attach("a", Mode.EDIT, songId, "One", pdf(2))
        attachments.attach("b", Mode.EDIT, songId, "Two", pdf(4))
        assertEquals(2, blobs.count())
        val first =
            library
                .current()
                .library.songs
                .single()
                .attachments
                .first()
                .id
        library.execute("d") { AttachmentCommands.detach(it, Mode.EDIT, songId, first) }
        attachments.cleanup()
        assertEquals(1, blobs.count())
        assertEquals(
            4,
            library
                .current()
                .library.songs
                .single()
                .attachments
                .single()
                .pages,
        )
    }

    @Test
    public fun theLastPageIsRememberedEvenInPerformanceModeAndInvalidPagesAreRefused() {
        attachments.attach("a", Mode.EDIT, songId, "Score", pdf(5))
        val id =
            library
                .current()
                .library.songs
                .single()
                .attachments
                .single()
                .id
        assertEquals(
            AttachResult.Attached(revision = 3, replay = false),
            attachments.rememberPage("turn", songId, id, 4),
        )
        assertEquals(
            4,
            library
                .current()
                .library.songs
                .single()
                .attachments
                .single()
                .lastPage,
        )
        assertEquals(AttachResult.Refused(Refusal.INVALID_PAGE), attachments.rememberPage("bad", songId, id, 6))
        assertFalse(store.acknowledged("bad") != null)
    }

    private class SequentialIds : IdSource {
        private var next = 0

        override fun next(): String = "id-${next++}"
    }

    private class FakeInspector : PdfInspector {
        companion object {
            var inspections = 0
        }

        init {
            inspections = 0
        }

        override fun inspect(bytes: ByteArray): PdfFacts? {
            inspections += 1
            val header = "%PDF".toByteArray()
            val valid = bytes.size > header.size && bytes.copyOfRange(0, header.size).contentEquals(header)
            val pages = if (valid) bytes[header.size].toInt() else 0
            val digest = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
            return if (valid && pages > 0) PdfFacts(digest, bytes.size.toLong(), pages) else null
        }
    }

    private class FakeBlobs : BlobStore {
        private val files = mutableMapOf<String, ByteArray>()
        var puts = 0
        var failPut = false

        fun count(): Int = files.size

        override fun put(
            sha256: String,
            bytes: ByteArray,
        ): Boolean =
            if (failPut) {
                false
            } else {
                files[sha256] = bytes
                puts += 1
                true
            }

        override fun read(sha256: String): ByteArray? = files[sha256]

        override fun retainOnly(digests: Set<String>) {
            files.keys.retainAll(digests)
        }
    }

    private class MemoryStore : LibraryStore {
        private var stored = StoredLibrary(Library.empty(), 0)
        private val receipts = mutableMapOf<String, Long>()
        var failNext = false

        override fun load(): StoredLibrary = stored

        override fun acknowledged(commandId: String): Long? = receipts[commandId]

        override fun commit(
            commandId: String,
            expectedRevision: Long,
            library: Library,
        ): CommitOutcome =
            if (failNext) {
                failNext = false
                CommitOutcome.Failed("disk full")
            } else {
                stored = StoredLibrary(library, expectedRevision + 1)
                receipts[commandId] = stored.revision
                CommitOutcome.Committed(stored.revision)
            }
    }
}
