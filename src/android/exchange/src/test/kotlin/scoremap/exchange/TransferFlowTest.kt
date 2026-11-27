package scoremap.exchange

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import scoremap.library.CommitOutcome
import scoremap.library.Confirmation
import scoremap.library.IdSource
import scoremap.library.Library
import scoremap.library.LibraryCommands
import scoremap.library.LibraryService
import scoremap.library.LibraryStore
import scoremap.library.Mode
import scoremap.library.Outcome
import scoremap.library.Refusal
import scoremap.library.ServiceResult
import scoremap.library.SetCommands
import scoremap.library.StoredLibrary
import scoremap.library.TransferGraph

public class TransferFlowTest {
    private val document =
        "{\"format\":\"scoremap-transfer\",\"version\":1,\"songs\":[" +
            "{\"key\":\"a\",\"name\":\"Autumn Leaves\"," +
            "\"sections\":[{\"name\":\"Verse\",\"repeats\":2}]}," +
            "{\"key\":\"b\",\"name\":\"Blue Bossa\",\"sections\":[]}]," +
            "\"set\":{\"name\":\"Friday\",\"songKeys\":[\"b\",\"a\"]}}"

    @Test
    public fun previewDescribesThePackageWithoutChangingAnything() {
        val preview = TransferFlow.preview(document) as PreviewOutcome.Ready
        assertEquals(listOf("Autumn Leaves", "Blue Bossa"), preview.songNames)
        assertEquals(1, preview.sectionCount)
        assertEquals("Friday", preview.setName)
    }

    @Test
    public fun confirmedImportAddsFreshCopiesAndCancellationChangesNothing() {
        val base =
            (
                LibraryCommands.createSong(
                    Library.empty(),
                    Mode.EDIT,
                    "Mine",
                    Ids("base"),
                ) as Outcome.Accepted
            ).value
        val cancelled = TransferFlow.importConfirmed(base, Mode.EDIT, document, Confirmation.Cancelled, Ids("x"))
        assertEquals(TransferOutcome.Refused(Refusal.CANCELLED), cancelled)
        val imported =
            (
                TransferFlow.importConfirmed(
                    base,
                    Mode.EDIT,
                    document,
                    Confirmation.Confirmed,
                    Ids("x"),
                ) as TransferOutcome.Imported
            ).library
        assertEquals(listOf("Mine", "Autumn Leaves", "Blue Bossa"), imported.songs.map { it.name })
        assertEquals(base.songs.first(), imported.songs.first())
        assertEquals(
            listOf("Blue Bossa", "Autumn Leaves"),
            imported.sets.single().songIds.map { id ->
                imported.songs
                    .first {
                        it.id ==
                            id
                    }.name
            },
        )
        assertTrue(imported.songs.none { it.id.value == "a" || it.id.value == "b" })
    }

    @Test
    public fun rejectsOrRefusesBadPackagesWithoutChangingTheLibrary() {
        val base =
            (
                LibraryCommands.createSong(
                    Library.empty(),
                    Mode.EDIT,
                    "Mine",
                    Ids("base"),
                ) as Outcome.Accepted
            ).value
        val ids = Ids("x")

        fun run(text: String) = TransferFlow.importConfirmed(base, Mode.EDIT, text, Confirmation.Confirmed, ids)
        assertEquals(TransferOutcome.Rejected(Rejection.MALFORMED), run("{"))
        assertEquals(
            TransferOutcome.Rejected(Rejection.UNSUPPORTED_VERSION),
            run(document.replace("\"version\":1", "\"version\":9")),
        )
        assertEquals(
            TransferOutcome.Refused(Refusal.DANGLING_REFERENCE),
            run(document.replace("\"songKeys\":[\"b\",\"a\"]", "\"songKeys\":[\"b\",\"zzz\"]")),
        )
        assertEquals(
            TransferOutcome.Refused(Refusal.DUPLICATE_KEY),
            run(document.replace("\"key\":\"b\"", "\"key\":\"a\"")),
        )
        assertEquals(
            TransferOutcome.Refused(Refusal.DUPLICATE_MEMBER),
            run(document.replace("\"songKeys\":[\"b\",\"a\"]", "\"songKeys\":[\"a\",\"a\"]")),
        )
        assertEquals(
            TransferOutcome.Refused(Refusal.INVALID_REPEATS),
            run(document.replace("\"repeats\":2", "\"repeats\":0")),
        )
        assertEquals(
            TransferOutcome.Refused(Refusal.INVALID_NAME),
            run(document.replace("\"name\":\"Blue Bossa\"", "\"name\":\"  \"")),
        )
        assertEquals(
            TransferOutcome.Refused(Refusal.PERFORMANCE_MODE),
            TransferFlow.importConfirmed(base, Mode.PERFORMANCE, document, Confirmation.Confirmed, ids),
        )
        assertEquals(listOf("Mine"), base.songs.map { it.name })
    }

    @Test
    public fun twoIndependentInstallationsShareImportEditReExportAndReopen() {
        val aIds = Ids("a")
        val a = authoredSet(aIds)
        val shared = TransferCodec.encode(TransferGraph.ofSet(a, a.sets.single()))

        // Installation B, with its own identities, imports it, edits it and exports it again.
        var b = imported(Library.empty(), shared, Ids("b"))
        val bSong = b.songs.single()
        b = accepted(LibraryCommands.setRepeats(b, Mode.EDIT, bSong.id, bSong.sections.single().id, 4))
        val reshared = TransferCodec.encode(TransferGraph.ofSet(b, b.sets.single()))

        // Installation A imports the edited copy and keeps its own original.
        val merged = imported(a, reshared, aIds)
        assertEquals(listOf(1, 4), merged.songs.map { it.sections.single().repeats })
        assertEquals(2, merged.sets.size)
        val decoded = (TransferCodec.decode(reshared) as DecodeOutcome.Decoded).graph
        assertEquals(listOf("Autumn Leaves"), decoded.songs.map { it.name })
        assertEquals(
            4,
            decoded.songs
                .single()
                .sections
                .single()
                .repeats,
        )
    }

    private fun authoredSet(ids: Ids): Library {
        var library = accepted(LibraryCommands.createSong(Library.empty(), Mode.EDIT, "Autumn Leaves", ids))
        val song = library.songs.single()
        library = accepted(LibraryCommands.insertSection(library, Mode.EDIT, song.id, "Verse", ids))
        library = accepted(SetCommands.createSet(library, Mode.EDIT, "Friday", ids))
        val setId = library.sets.single().id
        return accepted(SetCommands.setMembers(library, Mode.EDIT, setId, 1, listOf(song.id)))
    }

    private fun imported(
        library: Library,
        text: String,
        ids: Ids,
    ): Library =
        (
            TransferFlow.importConfirmed(
                library,
                Mode.EDIT,
                text,
                Confirmation.Confirmed,
                ids,
            ) as TransferOutcome.Imported
        ).library

    private fun accepted(outcome: Outcome<Library>): Library = (outcome as Outcome.Accepted).value

    @Test
    public fun aLowStorageFailureDuringImportLeavesThePriorDataAndAcknowledgesNothing() {
        val store = FailingStore()
        val service = LibraryService(store)
        service.execute("base") { LibraryCommands.createSong(it, Mode.EDIT, "Kept", Ids("k")) }
        store.failNext = true
        val result =
            service.execute("import") { library ->
                when (
                    val outcome =
                        TransferFlow.importConfirmed(
                            library,
                            Mode.EDIT,
                            document,
                            Confirmation.Confirmed,
                            Ids("n"),
                        )
                ) {
                    is TransferOutcome.Imported -> Outcome.Accepted(outcome.library)
                    else -> Outcome.Refused(Refusal.CANCELLED)
                }
            }
        assertTrue(result.toString(), result is ServiceResult.StorageFailed)
        assertEquals(
            listOf("Kept"),
            service
                .current()
                .library.songs
                .map { it.name },
        )
        assertEquals(null, store.acknowledged("import"))
    }

    private class Ids(
        private val prefix: String,
    ) : IdSource {
        private var next = 0

        override fun next(): String = "$prefix-${next++}"
    }

    private class FailingStore : LibraryStore {
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
                CommitOutcome.Failed("no space left on device")
            } else {
                stored = StoredLibrary(library, expectedRevision + 1)
                receipts[commandId] = stored.revision
                CommitOutcome.Committed(stored.revision)
            }
    }
}
