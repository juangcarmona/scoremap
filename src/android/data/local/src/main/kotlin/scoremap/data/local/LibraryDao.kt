package scoremap.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query

@Dao
internal interface MetaDao {
    @Query("SELECT revision FROM store_meta WHERE id = 1")
    fun revision(): Long?

    @Query("SELECT revision FROM receipts WHERE commandId = :commandId")
    fun receipt(commandId: String): Long?

    @Insert
    fun insertReceipt(row: ReceiptRow)

    @Query("INSERT OR REPLACE INTO store_meta (id, revision) VALUES (1, :revision)")
    fun writeRevision(revision: Long)
}

@Dao
internal interface ReadDao {
    @Query("SELECT * FROM songs ORDER BY position")
    fun songs(): List<SongRow>

    @Query("SELECT * FROM sections ORDER BY songId, position")
    fun sections(): List<SectionRow>

    @Query("SELECT * FROM sets ORDER BY position")
    fun sets(): List<SetRow>

    @Query("SELECT * FROM set_members ORDER BY setId, position")
    fun members(): List<SetMemberRow>

    @Query("SELECT * FROM revisions ORDER BY songId, number")
    fun revisions(): List<RevisionRow>

    @Query("SELECT * FROM revision_sections ORDER BY songId, number, position")
    fun revisionSections(): List<RevisionSectionRow>

    @Query("SELECT id FROM purged")
    fun purged(): List<String>
}

@Dao
internal interface ClearDao {
    @Query("DELETE FROM songs")
    fun clearSongs()

    @Query("DELETE FROM sections")
    fun clearSections()

    @Query("DELETE FROM sets")
    fun clearSets()

    @Query("DELETE FROM set_members")
    fun clearMembers()

    @Query("DELETE FROM revisions")
    fun clearRevisions()

    @Query("DELETE FROM revision_sections")
    fun clearRevisionSections()

    @Query("DELETE FROM purged")
    fun clearPurged()
}

@Dao
internal interface InsertDao {
    @Insert
    fun insertSongs(rows: List<SongRow>)

    @Insert
    fun insertSections(rows: List<SectionRow>)

    @Insert
    fun insertSets(rows: List<SetRow>)

    @Insert
    fun insertMembers(rows: List<SetMemberRow>)

    @Insert
    fun insertRevisions(rows: List<RevisionRow>)

    @Insert
    fun insertRevisionSections(rows: List<RevisionSectionRow>)

    @Insert
    fun insertPurged(rows: List<PurgedRow>)
}
