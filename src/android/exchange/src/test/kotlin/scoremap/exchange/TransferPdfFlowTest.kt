package scoremap.exchange

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import scoremap.library.AttachmentCommands
import scoremap.library.Confirmation
import scoremap.library.GraphAttachment
import scoremap.library.GraphSong
import scoremap.library.LibraryService
import scoremap.library.Mode
import scoremap.library.PdfBytes
import scoremap.library.Refusal
import scoremap.library.TransferGraph

public class TransferPdfFlowTest {
    private val store = MemoryLibraryStore()
    private val blobs = MemoryBlobs()
    private val inspector = StandInInspector()
    private val service = LibraryService(store)
    private val importer = TransferImporter(service, inspector, blobs, Sequence("new"))

    private fun document(vararg pdfs: ByteArray): String =
        TransferCodec.encode(
            TransferGraph(
                listOf(
                    GraphSong(
                        "a",
                        "Autumn Leaves",
                        emptyList(),
                        pdfs.mapIndexed { i, bytes -> GraphAttachment("Score $i", PdfBytes(bytes)) },
                    ),
                ),
                null,
            ),
        )

    @Test
    public fun importsASongAndStoresEveryPdfBeforeAcknowledging() {
        val result =
            importer.importConfirmed(
                "i1",
                Mode.EDIT,
                document(pdfBytes(3), pdfBytes(5)),
                Confirmation.Confirmed,
            )
        assertEquals(ImportResult.Imported(revision = 1, replay = false), result)
        val song =
            service
                .current()
                .library.songs
                .single()
        assertEquals(listOf(3, 5), song.attachments.map { it.pages })
        assertEquals(listOf("Score 0", "Score 1"), song.attachments.map { it.name })
        assertEquals(2, blobs.count())
        assertTrue(blobs.read(song.attachments.first().sha256)!!.contentEquals(pdfBytes(3)))
    }

    @Test
    public fun oneUnreadablePdfRejectsTheWholeImportAndTouchesNothing() {
        val result =
            importer.importConfirmed(
                "i1",
                Mode.EDIT,
                document(pdfBytes(3), "broken".toByteArray()),
                Confirmation.Confirmed,
            )
        assertEquals(ImportResult.PdfUnreadable("Autumn Leaves", "Score 1"), result)
        assertEquals(emptyList<Any>(), service.current().library.songs)
        assertEquals(0, blobs.count())
        assertEquals(0, blobs.puts)
    }

    @Test
    public fun cancellationAndPerformanceModeNeverInspectOrStoreAnything() {
        val text = document(pdfBytes(2))
        assertEquals(
            ImportResult.Refused(Refusal.CANCELLED),
            importer.importConfirmed("c", Mode.EDIT, text, Confirmation.Cancelled),
        )
        assertEquals(
            ImportResult.Refused(Refusal.PERFORMANCE_MODE),
            importer.importConfirmed("p", Mode.PERFORMANCE, text, Confirmation.Confirmed),
        )
        assertEquals(0, inspector.inspections)
        assertEquals(0, blobs.puts)
        assertEquals(0L, service.current().revision)
    }

    @Test
    public fun malformedOrOversizedPackagesAreRejectedBeforeAnyPdfIsRead() {
        assertEquals(
            ImportResult.Rejected(Rejection.MALFORMED),
            importer.importConfirmed("m", Mode.EDIT, "{", Confirmation.Confirmed),
        )
        val small =
            TransferImporter(
                service,
                inspector,
                blobs,
                Sequence("n"),
                TransferLimits(attachments = AttachmentLimits(maxBytes = 8)),
            )
        assertEquals(
            ImportResult.Rejected(Rejection.OVERSIZED),
            small.importConfirmed("o", Mode.EDIT, document(pdfBytes(2)), Confirmation.Confirmed),
        )
        assertEquals(0, inspector.inspections)
        assertEquals(0, blobs.puts)
    }

    @Test
    public fun lowStorageHalfwayRemovesTheBytesAlreadyStoredAndLeavesTheLibraryUnchanged() {
        blobs.failOnPut = 2
        val result =
            importer.importConfirmed(
                "low",
                Mode.EDIT,
                document(pdfBytes(3), pdfBytes(4)),
                Confirmation.Confirmed,
            )
        assertEquals(ImportResult.StorageFailed("A PDF could not be stored."), result)
        assertEquals(emptyList<Any>(), service.current().library.songs)
        assertEquals(0, blobs.count())
        assertEquals(null, store.acknowledged("low"))
    }

    @Test
    public fun aFailedCommitCleansUpAndTheSameCommandRetriesExactlyOnce() {
        store.failNext = true
        val text = document(pdfBytes(3))
        assertTrue(
            importer.importConfirmed("c1", Mode.EDIT, text, Confirmation.Confirmed) is ImportResult.StorageFailed,
        )
        assertEquals(0, blobs.count())
        assertEquals(
            ImportResult.Imported(revision = 1, replay = false),
            importer.importConfirmed("c1", Mode.EDIT, text, Confirmation.Confirmed),
        )
        assertEquals(
            ImportResult.Imported(revision = 1, replay = true),
            importer.importConfirmed("c1", Mode.EDIT, text, Confirmation.Confirmed),
        )
        assertEquals(
            1,
            service
                .current()
                .library.songs.size,
        )
        assertEquals(1, blobs.count())
    }

    @Test
    public fun dataThatIsNotAPdfBlocksAnImportEvenWhenTheStructureIsValid() {
        val result = importer.importConfirmed("x", Mode.EDIT, document(ByteArray(0)), Confirmation.Confirmed)
        assertEquals(ImportResult.PdfUnreadable("Autumn Leaves", "Score 0"), result)
        assertEquals(0, blobs.count())
    }

    @Test
    public fun twoInstallationsShareASetWithItsPdfsByteForByte() {
        importer.importConfirmed("a", Mode.EDIT, document(pdfBytes(3)), Confirmation.Confirmed)
        val library = service.current().library
        val exported = TransferExporter.exportSong(library, library.songs.single().id, blobs) as ExportOutcome.Exported

        val otherStore = MemoryLibraryStore()
        val otherBlobs = MemoryBlobs()
        val other = LibraryService(otherStore)
        val received = TransferImporter(other, StandInInspector(), otherBlobs, Sequence("b"))
        assertEquals(
            ImportResult.Imported(1, false),
            received.importConfirmed("r", Mode.EDIT, exported.text, Confirmation.Confirmed),
        )
        val attachment =
            other
                .current()
                .library.songs
                .single()
                .attachments
                .single()
        assertEquals(
            library.songs
                .single()
                .attachments
                .single()
                .sha256,
            attachment.sha256,
        )
        assertTrue(otherBlobs.read(attachment.sha256)!!.contentEquals(pdfBytes(3)))
        assertEquals(setOf(attachment.sha256), AttachmentCommands.referencedDigests(other.current().library))
    }

    @Test
    public fun exportRefusesWhenAnAttachmentsBytesAreMissing() {
        importer.importConfirmed("a", Mode.EDIT, document(pdfBytes(3)), Confirmation.Confirmed)
        val library = service.current().library
        blobs.retainOnly(emptySet())
        val result = TransferExporter.exportSong(library, library.songs.single().id, blobs)
        assertEquals(ExportOutcome.MissingBytes("Score 0"), result)
    }
}
