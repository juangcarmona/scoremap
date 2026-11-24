package scoremap.app

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import scoremap.data.local.AndroidPdfInspector
import scoremap.data.local.FileBlobStore
import scoremap.data.local.RoomLibraryStore
import scoremap.library.AttachResult
import scoremap.library.AttachmentCommands
import scoremap.library.AttachmentService
import scoremap.library.IdSource
import scoremap.library.LibraryService
import scoremap.library.Mode
import scoremap.library.PdfLimits
import scoremap.library.Refusal
import java.io.File
import java.util.UUID

/** Real Room, real files and the real PDF renderer on the managed device. */
@RunWith(AndroidJUnit4::class)
public class PdfStorageTest {
    private val context: Context = ApplicationProvider.getApplicationContext()
    private val name = "and05-pdf-${UUID.randomUUID()}.db"
    private val directory = File(context.filesDir, "and05-pdf-${UUID.randomUUID()}")
    private val ids = IdSource { UUID.randomUUID().toString() }
    private val opened = mutableListOf<RoomLibraryStore>()

    @After
    public fun removeOnlyOwnedFiles() {
        opened.forEach { runCatching { it.close() } }
        context.deleteDatabase(name)
        directory.deleteRecursively()
    }

    @Test
    public fun aVersionOneDatabaseMigratesKeepingEverythingAndThenAcceptsAttachments() {
        createVersionOneDatabase()
        val store = open()
        val service = LibraryService(store)
        val before = service.current()
        assertEquals(listOf("Legacy song"), before.library.songs.map { it.name })
        assertEquals(
            listOf("Verse"),
            before.library.songs
                .single()
                .sections
                .map { it.name },
        )
        assertEquals(7, before.revision)
        val attachments = attachments(service)
        val songId =
            before.library.songs
                .single()
                .id
        assertEquals(
            AttachResult.Attached(revision = 8, replay = false),
            attachments.attach("a", Mode.EDIT, songId, "Score", pdf(2)),
        )
        store.close()
        val reopened = service(open())
        assertEquals(
            listOf(2),
            reopened
                .current()
                .library.songs
                .single()
                .attachments
                .map { it.pages },
        )
        assertEquals(
            listOf("Verse"),
            reopened
                .current()
                .library.songs
                .single()
                .sections
                .map { it.name },
        )
    }

    @Test
    public fun anAttachedPdfSurvivesReopeningWithItsBytesAndLastPage() {
        val store = open()
        val service = LibraryService(store)
        val attachments = attachments(service)
        val songId = createSong(service)
        val bytes = pdf(3)
        attachments.attach("a", Mode.EDIT, songId, "Score", bytes)
        val attachment = attachments.current(songId).single()
        attachments.rememberPage("turn", songId, attachment.id, 3)
        store.close()

        val reopenedStore = open()
        val reopened = attachments(LibraryService(reopenedStore))
        val kept = reopened.current(songId).single()
        assertEquals(3, kept.pages)
        assertEquals(3, kept.lastPage)
        assertTrue(FileBlobStore(directory).read(kept.sha256)!!.contentEquals(bytes))
    }

    @Test
    public fun aCorruptPdfIsRejectedAndTheSongAndFilesAreUntouched() {
        val store = open()
        val service = LibraryService(store)
        val attachments = attachments(service)
        val songId = createSong(service)
        for (bytes in listOf("not a pdf".toByteArray(), pdf(2).copyOf(40), ByteArray(0))) {
            assertEquals(
                AttachResult.Rejected,
                attachments.attach("bad-${bytes.size}", Mode.EDIT, songId, "Score", bytes),
            )
        }
        assertEquals(emptyList<Any>(), attachments.current(songId))
        assertEquals(0, directory.listFiles { file -> file.isFile }.orEmpty().size)
    }

    @Test
    public fun anOversizedPdfIsRefusedBySizeWithoutBeingStored() {
        val store = open()
        val service = LibraryService(store)
        val attachments = attachments(service)
        val songId = createSong(service)
        val big = pdf(1) + ByteArray(PdfLimits.MAX_BYTES.toInt())
        assertEquals(
            AttachResult.Refused(Refusal.PDF_TOO_LARGE),
            attachments.attach("big", Mode.EDIT, songId, "Score", big),
        )
        assertEquals(0, directory.listFiles { file -> file.isFile }.orEmpty().size)
    }

    @Test
    public fun aFailureInsideTheCommitRemovesTheStoredBytesAndLeavesTheLibraryUnchanged() {
        var fail = false
        val store = open { check(!fail) { "injected failure" } }
        val service = LibraryService(store)
        val attachments = attachments(service)
        val songId = createSong(service)
        fail = true
        val result = attachments.attach("f", Mode.EDIT, songId, "Score", pdf(2))
        assertTrue(result.toString(), result is AttachResult.StorageFailed)
        assertEquals(emptyList<Any>(), attachments.current(songId))
        assertEquals(0, directory.listFiles { file -> file.isFile }.orEmpty().size)
        assertNull(store.acknowledged("f"))
    }

    @Test
    public fun detachingThenCleaningUpRemovesTheBytesNoSongReferences() {
        val store = open()
        val service = LibraryService(store)
        val attachments = attachments(service)
        val songId = createSong(service)
        attachments.attach("a", Mode.EDIT, songId, "Score", pdf(2))
        val attachment = attachments.current(songId).single()
        assertEquals(1, directory.listFiles { file -> file.isFile }.orEmpty().size)
        service.execute("d") { AttachmentCommands.detach(it, Mode.EDIT, songId, attachment.id) }
        attachments.cleanup()
        assertEquals(0, directory.listFiles { file -> file.isFile }.orEmpty().size)
    }

    private fun open(beforeCommit: () -> Unit = {}): RoomLibraryStore =
        RoomLibraryStore.open(context, name, beforeCommit).also { opened += it }

    private fun service(store: RoomLibraryStore): LibraryService = LibraryService(store)

    private fun attachments(service: LibraryService): AttachmentService =
        AttachmentService(service, AndroidPdfInspector(File(directory, "inspect")), FileBlobStore(directory), ids)

    private fun createSong(service: LibraryService): scoremap.library.SongId {
        service.execute("song") { scoremap.library.LibraryCommands.createSong(it, Mode.EDIT, "Song", ids) }
        return service
            .current()
            .library.songs
            .single()
            .id
    }

    private fun createVersionOneDatabase() {
        val file = context.getDatabasePath(name)
        file.parentFile?.mkdirs()
        SQLiteDatabase.openOrCreateDatabase(file, null).use { db ->
            for (sql in VERSION_ONE_TABLES) db.execSQL(sql)
            db.execSQL("CREATE TABLE IF NOT EXISTS room_master_table (id INTEGER PRIMARY KEY, identity_hash TEXT)")
            db.execSQL(
                "INSERT OR REPLACE INTO room_master_table (id, identity_hash) " +
                    "VALUES (42, '7b30c12716574b5bfb69ce84b7bee753')",
            )
            db.execSQL("INSERT INTO songs VALUES ('s1', 0, 'Legacy song', 1, 0)")
            db.execSQL("INSERT INTO sections VALUES ('s1', 0, 'sec1', 'Verse', 2)")
            db.execSQL("INSERT INTO revisions VALUES ('s1', 1, 'Legacy song')")
            db.execSQL("INSERT INTO revision_sections VALUES ('s1', 1, 0, 'sec1', 'Verse', 2)")
            db.execSQL("INSERT INTO receipts VALUES ('legacy-command', 7)")
            db.execSQL("INSERT INTO store_meta VALUES (1, 7)")
            db.version = 1
        }
    }

    /** A small, valid PDF with [pages] blank pages, built with exact cross-reference offsets. */
    private fun pdf(pages: Int): ByteArray {
        val out = StringBuilder("%PDF-1.4\n")
        val offsets = mutableListOf<Int>()

        fun obj(body: String) {
            offsets += out.length
            out.append("${offsets.size} 0 obj\n$body\nendobj\n")
        }
        obj("<< /Type /Catalog /Pages 2 0 R >>")
        obj("<< /Type /Pages /Kids [" + (0 until pages).joinToString(" ") { "${3 + it} 0 R" } + "] /Count $pages >>")
        repeat(pages) { obj("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>") }
        val xref = out.length
        out.append("xref\n0 ${offsets.size + 1}\n0000000000 65535 f \n")
        offsets.forEach { out.append("%010d 00000 n \n".format(it)) }
        out.append("trailer\n<< /Size ${offsets.size + 1} /Root 1 0 R >>\nstartxref\n$xref\n%%EOF\n")
        return out.toString().toByteArray(Charsets.ISO_8859_1)
    }

    private companion object {
        val VERSION_ONE_TABLES: List<String> =
            listOf(
                "CREATE TABLE IF NOT EXISTS `store_meta` (`id` INTEGER NOT NULL, " +
                    "`revision` INTEGER NOT NULL, PRIMARY KEY(`id`))",
                "CREATE TABLE IF NOT EXISTS `receipts` (`commandId` TEXT NOT NULL, " +
                    "`revision` INTEGER NOT NULL, PRIMARY KEY(`commandId`))",
                "CREATE TABLE IF NOT EXISTS `songs` (`id` TEXT NOT NULL, `position` INTEGER NOT NULL, " +
                    "`name` TEXT NOT NULL, `revision` INTEGER NOT NULL, `deleted` INTEGER NOT NULL, " +
                    "PRIMARY KEY(`id`))",
                "CREATE TABLE IF NOT EXISTS `sections` (`songId` TEXT NOT NULL, " +
                    "`position` INTEGER NOT NULL, `id` TEXT NOT NULL, `name` TEXT NOT NULL, " +
                    "`repeats` INTEGER NOT NULL, PRIMARY KEY(`songId`, `position`))",
                "CREATE TABLE IF NOT EXISTS `sets` (`id` TEXT NOT NULL, `position` INTEGER NOT NULL, " +
                    "`name` TEXT NOT NULL, `revision` INTEGER NOT NULL, `deleted` INTEGER NOT NULL, " +
                    "PRIMARY KEY(`id`))",
                "CREATE TABLE IF NOT EXISTS `set_members` (`setId` TEXT NOT NULL, " +
                    "`position` INTEGER NOT NULL, `songId` TEXT NOT NULL, PRIMARY KEY(`setId`, `position`))",
                "CREATE TABLE IF NOT EXISTS `revisions` (`songId` TEXT NOT NULL, " +
                    "`number` INTEGER NOT NULL, `name` TEXT NOT NULL, PRIMARY KEY(`songId`, `number`))",
                "CREATE TABLE IF NOT EXISTS `revision_sections` (`songId` TEXT NOT NULL, " +
                    "`number` INTEGER NOT NULL, `position` INTEGER NOT NULL, `id` TEXT NOT NULL, " +
                    "`name` TEXT NOT NULL, `repeats` INTEGER NOT NULL, PRIMARY KEY(`songId`, `number`, " +
                    "`position`))",
                "CREATE TABLE IF NOT EXISTS `purged` (`id` TEXT NOT NULL, PRIMARY KEY(`id`))",
            )
    }
}
