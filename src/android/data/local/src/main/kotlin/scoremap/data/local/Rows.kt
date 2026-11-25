package scoremap.data.local

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "store_meta")
internal data class MetaRow(
    @PrimaryKey val id: Int,
    val revision: Long,
)

@Entity(tableName = "receipts")
internal data class ReceiptRow(
    @PrimaryKey val commandId: String,
    val revision: Long,
)

@Entity(tableName = "songs")
internal data class SongRow(
    @PrimaryKey val id: String,
    val position: Int,
    val name: String,
    val revision: Long,
    val deleted: Boolean,
    val songKey: String?,
)

@Entity(tableName = "sections", primaryKeys = ["songId", "position"])
internal data class SectionRow(
    val songId: String,
    val position: Int,
    val id: String,
    val name: String,
    val repeats: Int,
    @ColumnInfo(defaultValue = "") val lyrics: String,
    @ColumnInfo(defaultValue = "") val cue: String,
    @ColumnInfo(defaultValue = "") val measures: String,
)

@Entity(tableName = "sets")
internal data class SetRow(
    @PrimaryKey val id: String,
    val position: Int,
    val name: String,
    val revision: Long,
    val deleted: Boolean,
)

@Entity(tableName = "set_members", primaryKeys = ["setId", "position"])
internal data class SetMemberRow(
    val setId: String,
    val position: Int,
    val songId: String,
)

@Entity(tableName = "revisions", primaryKeys = ["songId", "number"])
internal data class RevisionRow(
    val songId: String,
    val number: Long,
    val name: String,
    val songKey: String?,
)

@Entity(tableName = "revision_sections", primaryKeys = ["songId", "number", "position"])
internal data class RevisionSectionRow(
    val songId: String,
    val number: Long,
    val position: Int,
    val id: String,
    val name: String,
    val repeats: Int,
    @ColumnInfo(defaultValue = "") val lyrics: String,
    @ColumnInfo(defaultValue = "") val cue: String,
    @ColumnInfo(defaultValue = "") val measures: String,
)

@Entity(tableName = "purged")
internal data class PurgedRow(
    @PrimaryKey val id: String,
)

@Entity(tableName = "attachments", primaryKeys = ["songId", "position"])
internal data class AttachmentRow(
    val songId: String,
    val position: Int,
    val id: String,
    val name: String,
    val sha256: String,
    val bytes: Long,
    val pages: Int,
    val lastPage: Int,
)
