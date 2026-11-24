package scoremap.data.local

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

/** Version 2 adds song-owned PDF attachments; every version 1 row is left exactly as it was. */
internal val Migration1To2: Migration =
    object : Migration(1, 2) {
        override fun migrate(db: SupportSQLiteDatabase) {
            db.execSQL(
                "CREATE TABLE IF NOT EXISTS `attachments` (`songId` TEXT NOT NULL, `position` INTEGER NOT NULL, " +
                    "`id` TEXT NOT NULL, `name` TEXT NOT NULL, `sha256` TEXT NOT NULL, `bytes` INTEGER NOT NULL, " +
                    "`pages` INTEGER NOT NULL, `lastPage` INTEGER NOT NULL, PRIMARY KEY(`songId`, `position`))",
            )
        }
    }
