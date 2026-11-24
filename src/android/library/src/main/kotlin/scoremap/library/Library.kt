package scoremap.library

/** Opaque, stable identity of a song. */
@JvmInline
public value class SongId(
    public val value: String,
)

/** Opaque, stable identity of a section. */
@JvmInline
public value class SectionId(
    public val value: String,
)

/** Application port: supplies new opaque identities. Adapters decide how they are generated. */
public fun interface IdSource {
    public fun next(): String
}

/** A shared identified form part. Repeats use one content identity and are an integer 1..99. */
public data class Section(
    val id: SectionId,
    val name: String,
    val repeats: Int,
)

public data class Song(
    val id: SongId,
    val name: String,
    val sections: List<Section>,
)

/** LC-LIBRARY active song presence. */
public enum class LibraryState { EMPTY, POPULATED }

/** Content mutations require [EDIT]; [PERFORMANCE] consultation is read only (BR-EDIT-GUARD). */
public enum class Mode { EDIT, PERFORMANCE }

public class Library private constructor(
    public val songs: List<Song>,
) {
    public val state: LibraryState get() = if (songs.isEmpty()) LibraryState.EMPTY else LibraryState.POPULATED

    internal fun with(songs: List<Song>): Library = Library(songs)

    public companion object {
        public fun empty(): Library = Library(emptyList())
    }
}

public enum class Refusal {
    PERFORMANCE_MODE,
    INVALID_NAME,
    UNKNOWN_SONG,
    UNKNOWN_SECTION,
    INVALID_REPEATS,
    NOT_A_PERMUTATION,
    DUPLICATE_ID,
}

public sealed interface Outcome<out T> {
    public data class Accepted<T>(
        val value: T,
    ) : Outcome<T>

    public data class Refused(
        val refusal: Refusal,
    ) : Outcome<Nothing>
}
