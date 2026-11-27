package scoremap.feature.library

import scoremap.library.CommitOutcome
import scoremap.library.IdSource
import scoremap.library.Library
import scoremap.library.LibraryStore
import scoremap.library.StoredLibrary

internal class Ids(
    private val prefix: String,
) : IdSource {
    private var next = 0

    override fun next(): String = "$prefix-${next++}"
}

/** A faithful in-memory store: whole-state commits, receipts, and a switch to simulate a failed write. */
internal class MemoryStore : LibraryStore {
    private var stored = StoredLibrary(Library.empty(), 0)
    private val receipts = mutableMapOf<String, Long>()
    var commits = 0
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
            commits += 1
            CommitOutcome.Committed(stored.revision)
        }
}

/** Reads a tiny stand-in format: "%PDF" followed by one byte holding the page count. */
internal class FakeInspector : scoremap.library.PdfInspector {
    override fun inspect(bytes: ByteArray): scoremap.library.PdfFacts? {
        val header = "%PDF".toByteArray()
        val valid = bytes.size > header.size && bytes.copyOfRange(0, header.size).contentEquals(header)
        val pages = if (valid) bytes[header.size].toInt() else 0
        val digest =
            java.security.MessageDigest
                .getInstance("SHA-256")
                .digest(bytes)
                .joinToString("") { "%02x".format(it) }
        return if (valid && pages > 0) scoremap.library.PdfFacts(digest, bytes.size.toLong(), pages) else null
    }
}

internal class FakeBlobs : scoremap.library.BlobStore {
    private val files = mutableMapOf<String, ByteArray>()

    fun count(): Int = files.size

    override fun put(
        sha256: String,
        bytes: ByteArray,
    ): Boolean {
        files[sha256] = bytes
        return true
    }

    override fun read(sha256: String): ByteArray? = files[sha256]

    override fun retainOnly(digests: Set<String>) {
        files.keys.retainAll(digests)
    }
}

internal fun pdfBytes(pages: Int): ByteArray = "%PDF".toByteArray() + byteArrayOf(pages.toByte()) + ByteArray(64)
