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

private const val VERSION_TWO = 2
private const val VERSION_THREE = 3
private const val VERSION_FOUR = 4

/** Version 3 adds the song key, section lyrics and cues; existing rows keep an unknown key and no text. */
internal val Migration2To3: Migration =
    object : Migration(VERSION_TWO, VERSION_THREE) {
        override fun migrate(db: SupportSQLiteDatabase) {
            db.execSQL("ALTER TABLE `songs` ADD COLUMN `songKey` TEXT")
            db.execSQL("ALTER TABLE `revisions` ADD COLUMN `songKey` TEXT")
            for (table in listOf("sections", "revision_sections")) {
                db.execSQL("ALTER TABLE `$table` ADD COLUMN `lyrics` TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE `$table` ADD COLUMN `cue` TEXT NOT NULL DEFAULT ''")
            }
        }
    }

/** Version 4 stores each section's measures and chord events; existing sections keep an empty form. */
internal val Migration3To4: Migration =
    object : Migration(VERSION_THREE, VERSION_FOUR) {
        override fun migrate(db: SupportSQLiteDatabase) {
            for (table in listOf("sections", "revision_sections")) {
                db.execSQL("ALTER TABLE `$table` ADD COLUMN `measures` TEXT NOT NULL DEFAULT ''")
            }
        }
    }
