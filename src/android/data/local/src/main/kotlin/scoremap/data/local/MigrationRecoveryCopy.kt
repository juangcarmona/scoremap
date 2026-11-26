package scoremap.data.local

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

private const val CURRENT_SCHEMA_VERSION = 6

/** Retains a durable copy of the last schema before Room starts its migration transaction. */
internal fun retainMigrationRecoveryCopy(
    context: Context,
    databaseName: String,
) {
    val source = context.getDatabasePath(databaseName)
    if (source.isFile) {
        val version = checkpointAndReadVersion(source)
        if (version > 0 && version < CURRENT_SCHEMA_VERSION) {
            val recovery = context.getDatabasePath("$databaseName.recovery-v$version")
            if (recovery.exists()) {
                check(readVersion(recovery) == version) { "The retained migration recovery copy is unreadable." }
            } else {
                copyRecoveryFile(source, recovery)
            }
        }
    }
}

private fun copyRecoveryFile(
    source: File,
    recovery: File,
) {
    val temporary = File(recovery.parentFile, "${recovery.name}.tmp")
    try {
        copyAndSync(source, temporary)
        check(temporary.renameTo(recovery)) { "Could not retain the pre-migration recovery copy." }
    } finally {
        temporary.delete()
    }
}

private fun checkpointAndReadVersion(source: File): Int =
    SQLiteDatabase.openDatabase(source.path, null, SQLiteDatabase.OPEN_READWRITE).use { database ->
        database.rawQuery("PRAGMA wal_checkpoint(TRUNCATE)", null).use { cursor ->
            check(
                cursor.moveToFirst() && cursor.getInt(0) == 0,
            ) { "Could not checkpoint the database before migration." }
        }
        database.version
    }

private fun readVersion(database: File): Int =
    SQLiteDatabase.openDatabase(database.path, null, SQLiteDatabase.OPEN_READONLY).use { it.version }

private fun copyAndSync(
    source: File,
    destination: File,
) {
    FileInputStream(source).use { input ->
        FileOutputStream(destination).use { output ->
            input.copyTo(output)
            output.fd.sync()
        }
    }
}
