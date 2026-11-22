package scoremap.library.api

import scoremap.library.model.CreationReceipt
import scoremap.library.model.CreationTransition
import scoremap.library.model.EditMode
import scoremap.library.model.LibraryPresence
import scoremap.library.model.LibrarySnapshot
import scoremap.library.port.CommitResult
import scoremap.library.port.CreationWrite
import scoremap.library.port.EditModeReader
import scoremap.library.port.LibraryStore
import scoremap.music.MusicId
import scoremap.music.Song
import scoremap.music.SongHeader

public data class CreateSongCommand(
    public val commandId: MusicId,
    public val expectedRevision: Long,
    public val songId: MusicId,
    public val title: String,
    public val artist: String? = null,
)

public enum class CreationRefusal {
    PROTECTED_MODE,
    BLANK_TITLE,
    STALE_REVISION,
    IDENTITY_CONFLICT,
    REVISION_EXHAUSTED,
    STORAGE_REFUSED,
}

public sealed interface CreateSongResult {
    public data class Acknowledged(
        public val receipt: CreationReceipt,
    ) : CreateSongResult

    public data class Refused(
        public val reason: CreationRefusal,
    ) : CreateSongResult

    public data class Unconfirmed(
        public val commandId: MusicId,
    ) : CreateSongResult
}

public class LibraryCommands(
    private val mode: EditModeReader,
    private val store: LibraryStore,
) {
    public fun createSong(command: CreateSongCommand): CreateSongResult =
        when {
            mode.currentMode() != EditMode.EDIT -> CreateSongResult.Refused(CreationRefusal.PROTECTED_MODE)
            command.title.isBlank() -> CreateSongResult.Refused(CreationRefusal.BLANK_TITLE)
            else -> createAgainstCurrent(command, store.read())
        }

    private fun createAgainstCurrent(
        command: CreateSongCommand,
        current: LibrarySnapshot,
    ): CreateSongResult {
        val identities =
            current.songs.flatMap { it.identities } + current.sets.map { it.id } + current.resources.map { it.id }
        val refusal =
            when {
                command.expectedRevision != current.revision -> CreationRefusal.STALE_REVISION
                command.songId in identities -> CreationRefusal.IDENTITY_CONFLICT
                current.revision == Long.MAX_VALUE -> CreationRefusal.REVISION_EXHAUSTED
                else -> null
            }
        return if (refusal == null) commitCreation(command, current) else CreateSongResult.Refused(refusal)
    }

    private fun commitCreation(
        command: CreateSongCommand,
        current: LibrarySnapshot,
    ): CreateSongResult {
        val song = Song(command.songId, SongHeader(command.title, command.artist))
        val candidate = LibrarySnapshot(current.revision + 1, current.songs + song, current.sets, current.resources)
        val transition =
            if (current.presence ==
                LibraryPresence.EMPTY
            ) {
                CreationTransition.CREATE_FIRST
            } else {
                CreationTransition.CREATE
            }
        val write = CreationWrite(command.commandId, current.revision, command.songId, transition, candidate)
        return when (val result = store.commit(write)) {
            is CommitResult.Confirmed -> confirm(write, result.receipt)
            CommitResult.NotCommitted -> CreateSongResult.Refused(CreationRefusal.STORAGE_REFUSED)
            CommitResult.Uncertain -> CreateSongResult.Unconfirmed(command.commandId)
        }
    }

    private fun confirm(
        write: CreationWrite,
        receipt: CreationReceipt,
    ): CreateSongResult {
        val expected = CreationReceipt(write.commandId, write.songId, write.candidate.revision, write.transition)
        return if (receipt ==
            expected
        ) {
            CreateSongResult.Acknowledged(receipt)
        } else {
            CreateSongResult.Unconfirmed(write.commandId)
        }
    }
}
