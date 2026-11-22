package scoremap.library.port

import scoremap.library.model.CreationReceipt
import scoremap.library.model.CreationTransition
import scoremap.library.model.EditMode
import scoremap.library.model.LibrarySnapshot
import scoremap.music.MusicId

public fun interface EditModeReader {
    public fun currentMode(): EditMode
}

public data class CreationWrite(
    public val commandId: MusicId,
    public val expectedRevision: Long,
    public val songId: MusicId,
    public val transition: CreationTransition,
    public val candidate: LibrarySnapshot,
)

public sealed interface CommitResult {
    public data class Confirmed(
        public val receipt: CreationReceipt,
    ) : CommitResult

    public data object NotCommitted : CommitResult

    public data object Uncertain : CommitResult
}

/**
 * Atomic storage boundary. Confirmed means the complete candidate and command receipt committed together.
 * NotCommitted preserves prior durable data; Uncertain requires reconciliation of this command, never a blind retry.
 * This contract has no Room implementation in the musical-rule slice.
 */
public interface LibraryStore {
    public fun read(): LibrarySnapshot

    public fun commit(write: CreationWrite): CommitResult
}
