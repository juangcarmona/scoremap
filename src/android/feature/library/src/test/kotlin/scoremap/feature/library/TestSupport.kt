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
