package scoremap.library.model

import scoremap.music.MusicId
import scoremap.music.Song
import java.util.Collections

public enum class LibraryPresence { EMPTY, POPULATED }

public enum class CreationTransition { CREATE_FIRST, CREATE }

public enum class EditMode { EDIT, PERFORMANCE }

public class SongSet(
    public val id: MusicId,
    public val title: String,
    songIds: List<MusicId> = emptyList(),
) {
    public val songIds: List<MusicId> = immutable(songIds)

    init {
        require(title.isNotBlank()) { "A set title must be nonblank." }
        require(songIds.distinct().size == songIds.size) { "Duplicate set membership." }
    }
}

public data class IndependentResource(
    public val id: MusicId,
)

public class LibrarySnapshot(
    public val revision: Long,
    songs: List<Song> = emptyList(),
    sets: List<SongSet> = emptyList(),
    resources: List<IndependentResource> = emptyList(),
) {
    public val songs: List<Song> = immutable(songs)
    public val sets: List<SongSet> = immutable(sets)
    public val resources: List<IndependentResource> = immutable(resources)
    public val presence: LibraryPresence
        get() = if (songs.isEmpty()) LibraryPresence.EMPTY else LibraryPresence.POPULATED

    init {
        require(revision >= 0) { "Negative library revision." }
        val ids = songs.flatMap { it.identities } + sets.map { it.id } + resources.map { it.id }
        require(ids.distinct().size == ids.size) { "Duplicate library identity." }
        val activeSongs = songs.map { it.id }.toSet()
        require(sets.flatMap { it.songIds }.all { it in activeSongs }) { "Dangling set membership." }
    }
}

private fun <T> immutable(values: List<T>): List<T> = Collections.unmodifiableList(ArrayList(values))

public data class CreationReceipt(
    public val commandId: MusicId,
    public val songId: MusicId,
    public val revision: Long,
    public val transition: CreationTransition,
)
