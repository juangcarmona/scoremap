package scoremap.data.local

import android.content.Context
import android.database.sqlite.SQLiteException
import androidx.room.Room
import scoremap.library.Attachment
import scoremap.library.AttachmentId
import scoremap.library.CommitOutcome
import scoremap.library.DurableState
import scoremap.library.Library
import scoremap.library.LibraryStore
import scoremap.library.MusicSet
import scoremap.library.Section
import scoremap.library.SectionId
import scoremap.library.SetId
import scoremap.library.Song
import scoremap.library.SongId
import scoremap.library.SongRevision
import scoremap.library.StoredLibrary

/**
 * The local Room adapter of the library port. A commit replaces the complete state, the command receipt and the
 * store revision inside one transaction, so a failure at any point leaves the previous durable state intact.
 */
public class RoomLibraryStore internal constructor(
    private val database: LibraryDatabase,
    private val beforeCommit: () -> Unit,
) : LibraryStore {
    public companion object {
        /**
         * Opens (creating when needed) the database named [name]. [beforeCommit] runs inside the commit transaction
         * after every row is written; it exists so tests can inject a mid-transaction failure.
         */
        public fun open(
            context: Context,
            name: String,
            beforeCommit: () -> Unit = {},
        ): RoomLibraryStore =
            RoomLibraryStore(
                Room.databaseBuilder(context, LibraryDatabase::class.java, name).addMigrations(Migration1To2).build(),
                beforeCommit,
            )
    }

    private val daos = Daos(database.meta(), database.reads(), database.clears(), database.inserts())

    public fun close(): Unit = database.close()

    override fun load(): StoredLibrary = StoredLibrary(LibraryRows.read(daos.reads), daos.meta.revision() ?: 0)

    override fun acknowledged(commandId: String): Long? = daos.meta.receipt(commandId)

    override fun commit(
        commandId: String,
        expectedRevision: Long,
        library: Library,
    ): CommitOutcome =
        try {
            var outcome: CommitOutcome = CommitOutcome.Failed("The transaction did not finish.")
            database.runInTransaction {
                val current = daos.meta.revision() ?: 0
                outcome =
                    if (current != expectedRevision) {
                        CommitOutcome.Stale(current)
                    } else {
                        LibraryRows.write(daos, library)
                        daos.meta.insertReceipt(ReceiptRow(commandId, current + 1))
                        daos.meta.writeRevision(current + 1)
                        beforeCommit()
                        CommitOutcome.Committed(current + 1)
                    }
            }
            outcome
        } catch (failure: SQLiteException) {
            CommitOutcome.Failed(failure.message ?: failure.javaClass.simpleName)
        } catch (failure: IllegalStateException) {
            CommitOutcome.Failed(failure.message ?: failure.javaClass.simpleName)
        }
}

internal class Daos(
    val meta: MetaDao,
    val reads: ReadDao,
    val clear: ClearDao,
    val insert: InsertDao,
)

internal object LibraryRows {
    fun write(
        daos: Daos,
        library: Library,
    ) {
        clear(daos.clear)
        val dao = daos.insert
        val songs = library.songs.map { it to false } + library.deletedSongs.map { it to true }
        dao.insertSongs(
            songs.mapIndexed {
                index,
                (song, deleted),
                ->
                SongRow(song.id.value, index, song.name, song.revision, deleted)
            },
        )
        dao.insertSections(
            songs.flatMap { (song, _) ->
                song.sections.mapIndexed {
                    i,
                    s,
                    ->
                    SectionRow(song.id.value, i, s.id.value, s.name, s.repeats)
                }
            },
        )
        dao.insertAttachments(
            songs.flatMap { (song, _) ->
                song.attachments.mapIndexed { i, a ->
                    AttachmentRow(song.id.value, i, a.id.value, a.name, a.sha256, a.bytes, a.pages, a.lastPage)
                }
            },
        )
        val sets = library.sets.map { it to false } + library.deletedSets.map { it to true }
        dao.insertSets(
            sets.mapIndexed {
                index,
                (set, deleted),
                ->
                SetRow(set.id.value, index, set.name, set.revision, deleted)
            },
        )
        dao.insertMembers(
            sets.flatMap { (set, _) ->
                set.songIds.mapIndexed { i, id -> SetMemberRow(set.id.value, i, id.value) }
            },
        )
        val revisions = library.histories.flatMap { (songId, list) -> list.map { songId to it } }
        dao.insertRevisions(revisions.map { (songId, r) -> RevisionRow(songId.value, r.number, r.name) })
        dao.insertRevisionSections(
            revisions.flatMap { (songId, r) ->
                r.sections.mapIndexed {
                    i,
                    s,
                    ->
                    RevisionSectionRow(songId.value, r.number, i, s.id.value, s.name, s.repeats)
                }
            },
        )
        dao.insertPurged(library.purged.map { PurgedRow(it) })
    }

    private fun clear(dao: ClearDao) {
        dao.clearSongs()
        dao.clearSections()
        dao.clearAttachments()
        dao.clearSets()
        dao.clearMembers()
        dao.clearRevisions()
        dao.clearRevisionSections()
        dao.clearPurged()
    }

    fun read(dao: ReadDao): Library {
        val sections = dao.sections().groupBy { it.songId }
        val attachments = dao.attachments().groupBy { it.songId }
        val songRows = dao.songs()

        fun song(row: SongRow) =
            Song(
                SongId(row.id),
                row.name,
                sections[row.id].orEmpty().map { Section(SectionId(it.id), it.name, it.repeats) },
                row.revision,
                attachments[row.id].orEmpty().map {
                    Attachment(AttachmentId(it.id), it.name, it.sha256, it.bytes, it.pages, it.lastPage)
                },
            )
        val members = dao.members().groupBy { it.setId }
        val setRows = dao.sets()

        fun set(row: SetRow) =
            MusicSet(SetId(row.id), row.name, members[row.id].orEmpty().map { SongId(it.songId) }, row.revision)
        val revisionSections = dao.revisionSections().groupBy { it.songId to it.number }
        val histories =
            dao.revisions().groupBy { SongId(it.songId) }.mapValues { (_, rows) ->
                rows.map { r ->
                    SongRevision(
                        r.number,
                        r.name,
                        revisionSections[r.songId to r.number].orEmpty().map {
                            Section(
                                SectionId(it.id),
                                it.name,
                                it.repeats,
                            )
                        },
                    )
                }
            }
        return Library.restore(
            DurableState(
                songs = songRows.filterNot { it.deleted }.map(::song),
                sets = setRows.filterNot { it.deleted }.map(::set),
                deletedSongs = songRows.filter { it.deleted }.map(::song),
                deletedSets = setRows.filter { it.deleted }.map(::set),
                purged = dao.purged().toSet(),
                histories = histories,
            ),
        )
    }
}
