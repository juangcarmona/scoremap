package scoremap.library

import scoremap.music.MusicRuleViolation
import scoremap.music.SpelledNote

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

/** Opaque, stable identity of an ordered set. */
@JvmInline
public value class SetId(
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
    /** Optional lyric text; empty means absent, never an empty claim. */
    val lyrics: String = "",
    /** Optional performance cue; empty means absent. */
    val cue: String = "",
)

/** A declared song key: a root with at most one accidental, major or minor. */
public data class SongKey(
    val tonic: SpelledNote,
    val minor: Boolean,
) {
    init {
        if (kotlin.math.abs(tonic.accidentals) > 1) throw MusicRuleViolation("A key root has at most one accidental.")
    }

    public val label: String get() = "$tonic ${if (minor) "minor" else "major"}"

    public companion object {
        /** Reads a [label] back; null for anything else, so a corrupt value reads as an unknown key. */
        public fun parse(text: String?): SongKey? {
            val parts = text?.split(' ').orEmpty()
            val minor = parts.getOrNull(1) == "minor"
            val tonic = if (parts.size == 2 && (minor || parts[1] == "major")) parts[0] else null
            return tonic?.let { runCatching { SpelledNote.parseRoot(it) }.getOrNull() }?.let { SongKey(it, minor) }
        }
    }
}

public data class Song(
    val id: SongId,
    val name: String,
    val sections: List<Section>,
    val revision: Long = 1,
    val attachments: List<Attachment> = emptyList(),
    /** The declared key, or null while it is unknown. */
    val key: SongKey? = null,
)

/** An ordered set of active songs; each song appears at most once. */
public data class MusicSet(
    val id: SetId,
    val name: String,
    val songIds: List<SongId>,
    val revision: Long = 1,
)

/** One acknowledged revision of a song's complete content. */
public data class SongRevision(
    val number: Long,
    val name: String,
    val sections: List<Section>,
    val key: SongKey? = null,
)

/** LC-LIBRARY active song presence. */
public enum class LibraryState { EMPTY, POPULATED }

/** Content mutations require [EDIT]; [PERFORMANCE] consultation is read only (BR-EDIT-GUARD). */
public enum class Mode { EDIT, PERFORMANCE }

/** The musician's answer to a restore or purge prompt; purge must name the item. */
public sealed interface Confirmation {
    public data object Confirmed : Confirmation

    public data object Cancelled : Confirmation

    public data class Named(
        val name: String,
    ) : Confirmation
}

/** Everything an adapter persists for a library, read back in one piece. */
public data class DurableState(
    val songs: List<Song>,
    val sets: List<MusicSet>,
    val deletedSongs: List<Song>,
    val deletedSets: List<MusicSet>,
    val purged: Set<String>,
    val histories: Map<SongId, List<SongRevision>>,
)

/**
 * The local library: active songs and sets, recoverably deleted items with their retained history, and
 * anti-resurrection receipts that carry identities only.
 */
@ConsistentCopyVisibility
public data class Library internal constructor(
    public val songs: List<Song>,
    public val sets: List<MusicSet>,
    public val deletedSongs: List<Song>,
    public val deletedSets: List<MusicSet>,
    public val purged: Set<String>,
    public val histories: Map<SongId, List<SongRevision>>,
) {
    public val state: LibraryState get() = if (songs.isEmpty()) LibraryState.EMPTY else LibraryState.POPULATED

    /** Replaces a song's content as a new acknowledged revision and records it in the retained history. */
    internal fun revise(song: Song): Library {
        val revised = song.copy(revision = song.revision + 1)
        return recordRevision(revised).copy(songs = songs.map { if (it.id == song.id) revised else it })
    }

    internal fun recordRevision(song: Song): Library {
        val revision = SongRevision(song.revision, song.name, song.sections, song.key)
        return copy(histories = histories + (song.id to histories[song.id].orEmpty() + revision))
    }

    internal fun identityInUse(id: String): Boolean =
        songs.any { it.id.value == id } || deletedSongs.any { it.id.value == id } ||
            sets.any { it.id.value == id } || deletedSets.any { it.id.value == id } ||
            songs.any { song -> song.sections.any { it.id.value == id } || song.attachments.any { it.id.value == id } }

    public companion object {
        public fun empty(): Library =
            Library(emptyList(), emptyList(), emptyList(), emptyList(), emptySet(), emptyMap())

        /** Rebuilds a library from durable state that an adapter has read back; it carries no new decisions. */
        public fun restore(state: DurableState): Library =
            Library(
                state.songs,
                state.sets,
                state.deletedSongs,
                state.deletedSets,
                state.purged,
                state.histories,
            )
    }
}

public enum class Refusal {
    PERFORMANCE_MODE,
    INVALID_NAME,
    UNKNOWN_SONG,
    UNKNOWN_SECTION,
    UNKNOWN_SET,
    UNKNOWN_REVISION,
    INVALID_REPEATS,
    TEXT_TOO_LONG,
    INVALID_KEY,
    NOT_A_PERMUTATION,
    DUPLICATE_ID,
    DUPLICATE_MEMBER,
    DUPLICATE_KEY,
    PDF_TOO_LARGE,
    PDF_UNSUPPORTED,
    INVALID_PAGE,
    UNKNOWN_ATTACHMENT,
    DANGLING_REFERENCE,
    STALE_REVISION,
    NOT_DELETED,
    MISSING_DEPENDENCY,
    PURGED,
    CANCELLED,
    CONFIRMATION_MISMATCH,
}

public sealed interface Outcome<out T> {
    public data class Accepted<T>(
        val value: T,
    ) : Outcome<T>

    public data class Refused(
        val refusal: Refusal,
    ) : Outcome<Nothing>
}
