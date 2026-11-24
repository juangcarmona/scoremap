package scoremap.library

public sealed interface ServiceResult {
    public data class Acknowledged(
        val revision: Long,
        val replay: Boolean,
    ) : ServiceResult

    public data class Refused(
        val refusal: Refusal,
    ) : ServiceResult

    public data class Conflict(
        val currentRevision: Long,
    ) : ServiceResult

    public data class StorageFailed(
        val reason: String,
    ) : ServiceResult
}

/**
 * Applies guarded domain commands and acknowledges them only after the store commits. Every call starts from the
 * durable state, so an unacknowledged attempt leaves nothing behind in memory either.
 */
public class LibraryService(
    private val store: LibraryStore,
) {
    public fun current(): StoredLibrary = store.load()

    /** [commandId] makes a retry idempotent; the command itself carries the edit-mode guard. */
    public fun execute(
        commandId: String,
        command: (Library) -> Outcome<Library>,
    ): ServiceResult {
        store.acknowledged(commandId)?.let { return ServiceResult.Acknowledged(it, replay = true) }
        val loaded = store.load()
        return when (val outcome = command(loaded.library)) {
            is Outcome.Refused -> ServiceResult.Refused(outcome.refusal)
            is Outcome.Accepted -> commit(commandId, loaded.revision, outcome.value)
        }
    }

    private fun commit(
        commandId: String,
        expected: Long,
        library: Library,
    ): ServiceResult =
        when (val outcome = store.commit(commandId, expected, library)) {
            is CommitOutcome.Committed -> ServiceResult.Acknowledged(outcome.revision, replay = false)
            is CommitOutcome.Stale -> ServiceResult.Conflict(outcome.currentRevision)
            is CommitOutcome.Failed -> ServiceResult.StorageFailed(outcome.reason)
        }
}
