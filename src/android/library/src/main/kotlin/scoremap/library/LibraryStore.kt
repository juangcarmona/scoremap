package scoremap.library

/** The complete durable library together with its store revision. */
public data class StoredLibrary(
    val library: Library,
    val revision: Long,
)

public sealed interface CommitOutcome {
    /** The complete new state is durable. Nothing weaker than this is an acknowledgement. */
    public data class Committed(
        val revision: Long,
    ) : CommitOutcome

    /** Someone else committed first; the offered state was not stored. */
    public data class Stale(
        val currentRevision: Long,
    ) : CommitOutcome

    /** The write failed and left the prior durable state intact. */
    public data class Failed(
        val reason: String,
    ) : CommitOutcome
}

/**
 * Application port for durable storage. An adapter commits the complete library atomically together with the
 * command receipt, or changes nothing.
 */
public interface LibraryStore {
    public fun load(): StoredLibrary

    /** The revision that acknowledged [commandId], or null when that command was never committed. */
    public fun acknowledged(commandId: String): Long?

    public fun commit(
        commandId: String,
        expectedRevision: Long,
        library: Library,
    ): CommitOutcome
}
