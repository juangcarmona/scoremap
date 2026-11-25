package scoremap.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [
        MetaRow::class, ReceiptRow::class, SongRow::class, SectionRow::class, SetRow::class,
        SetMemberRow::class, RevisionRow::class, RevisionSectionRow::class, PurgedRow::class, AttachmentRow::class,
    ],
    version = 4,
    exportSchema = true,
)
internal abstract class LibraryDatabase : RoomDatabase() {
    abstract fun meta(): MetaDao

    abstract fun reads(): ReadDao

    abstract fun clears(): ClearDao

    abstract fun inserts(): InsertDao
}
