package scoremap.exchange

import scoremap.library.BlobStore
import scoremap.library.CommitOutcome
import scoremap.library.IdSource
import scoremap.library.Library
import scoremap.library.LibraryStore
import scoremap.library.PdfFacts
import scoremap.library.PdfInspector
import scoremap.library.StoredLibrary
import java.security.MessageDigest

internal class Sequence(
    private val prefix: String,
) : IdSource {
    private var next = 0

    override fun next(): String = "$prefix-${next++}"
}

/** Reads a stand-in format: "%PDF" followed by one byte holding the page count. */
internal class StandInInspector : PdfInspector {
    var inspections = 0

    override fun inspect(bytes: ByteArray): PdfFacts? {
        inspections += 1
        val header = "%PDF".toByteArray()
        val valid = bytes.size > header.size && bytes.copyOfRange(0, header.size).contentEquals(header)
        val pages = if (valid) bytes[header.size].toInt() else 0
        val digest = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
        return if (valid && pages > 0) PdfFacts(digest, bytes.size.toLong(), pages) else null
    }
}

internal class MemoryBlobs : BlobStore {
    private val files = mutableMapOf<String, ByteArray>()
    var puts = 0
    var failOnPut = Int.MAX_VALUE

    fun count(): Int = files.size

    override fun put(
        sha256: String,
        bytes: ByteArray,
    ): Boolean {
        puts += 1
        if (puts >= failOnPut) return false
        files[sha256] = bytes
        return true
    }

    override fun read(sha256: String): ByteArray? = files[sha256]

    override fun retainOnly(digests: Set<String>) {
        files.keys.retainAll(digests)
    }
}

internal class MemoryLibraryStore : LibraryStore {
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

internal fun pdfBytes(pages: Int): ByteArray = "%PDF".toByteArray() + byteArrayOf(pages.toByte()) + ByteArray(32)
