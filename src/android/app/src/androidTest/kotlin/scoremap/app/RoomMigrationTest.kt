package scoremap.app

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import scoremap.data.local.RoomLibraryStore
import scoremap.library.RetentionCommands
import scoremap.library.Section
import scoremap.library.SectionId
import scoremap.library.SongId
import scoremap.library.SongKey
import scoremap.music.SpelledNote
import java.io.File
import java.util.UUID

/** Real Room schema upgrade witnesses retain the full previous database and roll back failed activation. */
@RunWith(AndroidJUnit4::class)
public class RoomMigrationTest {
    private val context: Context = ApplicationProvider.getApplicationContext()
    private val databaseName = "and05-migration-${UUID.randomUUID()}.db"
    private val recoveryName = "$databaseName.recovery-v5"
    private var store: RoomLibraryStore? = null

    @After
    public fun removeOnlyOwnedMigrationFiles() {
        runCatching { store?.close() }
        listOf(databaseName, recoveryName).forEach { context.deleteDatabase(it) }
    }

    @Test
    public fun supportedUpgradeKeepsIndependentVersionFiveCopyAndCompleteContent() {
        createVersionFiveDatabase(halfwayFailure = false)

        store = RoomLibraryStore.open(context, databaseName)
        val migrated = store!!.load()

        assertEquals(7, migrated.revision)
        assertEquals(
            "Blue Bossa",
            migrated.library.songs
                .single()
                .name,
        )
        assertEquals(
            SongKey(SpelledNote.parseRoot("F#"), minor = true),
            migrated.library.songs
                .single()
                .key,
        )
        assertEquals(
            Section(SectionId("section-1"), "Verse", 2, "Line one", "Tacet", emptyList()),
            migrated.library.songs
                .single()
                .sections
                .single(),
        )
        assertEquals(
            listOf(SongId("song-1")),
            migrated.library.sets
                .single()
                .songIds,
        )
        assertEquals(
            listOf(2L),
            RetentionCommands.history(migrated.library, SongId("song-1")).map { it.number },
        )
        assertEquals(5, databaseVersion(context.getDatabasePath(recoveryName)))
        assertEquals("saved-7", rowValue(context.getDatabasePath(recoveryName), "receipts", "commandId"))
        assertEquals("Blue Bossa", rowValue(context.getDatabasePath(recoveryName), "songs", "name"))
        assertEquals("Line one", rowValue(context.getDatabasePath(recoveryName), "sections", "lyrics"))
        assertEquals("set-1", rowValue(context.getDatabasePath(recoveryName), "sets", "id"))
        assertEquals("song-1", rowValue(context.getDatabasePath(recoveryName), "set_members", "songId"))
        assertEquals("Blue Bossa", rowValue(context.getDatabasePath(recoveryName), "revisions", "name"))
        assertEquals("Line one", rowValue(context.getDatabasePath(recoveryName), "revision_sections", "lyrics"))
        assertEquals("chart.pdf", rowValue(context.getDatabasePath(recoveryName), "attachments", "name"))
        assertEquals("purged-1", rowValue(context.getDatabasePath(recoveryName), "purged", "id"))
        assertFalse(hasColumn(context.getDatabasePath(recoveryName), "songs", "arrangement"))
    }

    @Test
    public fun failureAfterFirstMigrationStatementKeepsSourceAndRecoveryCopyAtVersionFive() {
        createVersionFiveDatabase(halfwayFailure = true)

        store = RoomLibraryStore.open(context, databaseName)
        val failure = runCatching { store!!.load() }.exceptionOrNull()

        assertNotNull("Room migration should fail on the second ALTER TABLE", failure)
        assertTrue(
            generateSequence(failure) { it.cause }
                .joinToString(" ") { it.message.orEmpty() }
                .contains("arrangement"),
        )
        assertEquals(5, databaseVersion(context.getDatabasePath(databaseName)))
        assertFalse(hasColumn(context.getDatabasePath(databaseName), "songs", "arrangement"))
        assertEquals("Blue Bossa", rowValue(context.getDatabasePath(databaseName), "songs", "name"))
        assertEquals(5, databaseVersion(context.getDatabasePath(recoveryName)))
        assertEquals("Blue Bossa", rowValue(context.getDatabasePath(recoveryName), "songs", "name"))
        assertEquals("Line one", rowValue(context.getDatabasePath(recoveryName), "sections", "lyrics"))
    }

    private fun createVersionFiveDatabase(halfwayFailure: Boolean) {
        val schema =
            context.assets
                .open(
                    "scoremap.data.local.LibraryDatabase/5.json",
                ).bufferedReader()
                .use { it.readText() }
        val databaseSchema = JSONObject(schema).getJSONObject("database")
        val databaseFile = context.getDatabasePath(databaseName)
        val database = SQLiteDatabase.openOrCreateDatabase(databaseFile, null)
        try {
            val entities = databaseSchema.getJSONArray("entities")
            for (index in 0 until entities.length()) {
                val entity = entities.getJSONObject(index)
                val table = entity.getString("tableName")
                var statement = entity.getString("createSql").replace("${'$'}{TABLE_NAME}", table)
                if (halfwayFailure && table == "revisions") {
                    statement =
                        statement.replace("PRIMARY KEY(", "`arrangement` TEXT NOT NULL DEFAULT '', PRIMARY KEY(")
                }
                database.execSQL(statement)
            }
            val setup = databaseSchema.getJSONArray("setupQueries")
            for (index in 0 until setup.length()) database.execSQL(setup.getString(index))
            insertFixtureContent(database)
            database.version = 5
        } finally {
            database.close()
        }
    }

    private fun insertFixtureContent(database: SQLiteDatabase) {
        database.execSQL("INSERT INTO store_meta (id, revision) VALUES (1, 7)")
        database.execSQL("INSERT INTO receipts (commandId, revision) VALUES ('saved-7', 7)")
        database.execSQL(
            "INSERT INTO songs (id, position, name, revision, deleted, songKey, parts) " +
                "VALUES ('song-1', 0, 'Blue Bossa', 2, 0, 'F# minor', '')",
        )
        database.execSQL(
            "INSERT INTO sections (songId, position, id, name, repeats, lyrics, cue, measures) " +
                "VALUES ('song-1', 0, 'section-1', 'Verse', 2, 'Line one', 'Tacet', '')",
        )
        database.execSQL("INSERT INTO sets (id, position, name, revision, deleted) VALUES ('set-1', 0, 'Set A', 1, 0)")
        database.execSQL("INSERT INTO set_members (setId, position, songId) VALUES ('set-1', 0, 'song-1')")
        database.execSQL(
            "INSERT INTO revisions (songId, number, name, songKey, parts) " +
                "VALUES ('song-1', 2, 'Blue Bossa', 'F# minor', '')",
        )
        database.execSQL(
            "INSERT INTO revision_sections (songId, number, position, id, name, repeats, lyrics, cue, measures) " +
                "VALUES ('song-1', 2, 0, 'section-1', 'Verse', 2, 'Line one', 'Tacet', '')",
        )
        database.execSQL(
            "INSERT INTO attachments (songId, position, id, name, sha256, bytes, pages, lastPage) " +
                "VALUES ('song-1', 0, 'pdf-1', 'chart.pdf', 'abc123', 3, 1, 1)",
        )
        database.execSQL("INSERT INTO purged (id) VALUES ('purged-1')")
    }

    private fun databaseVersion(file: File): Int =
        SQLiteDatabase.openDatabase(file.path, null, SQLiteDatabase.OPEN_READONLY).use { it.version }

    private fun rowValue(
        file: File,
        table: String,
        column: String,
    ): String =
        SQLiteDatabase.openDatabase(file.path, null, SQLiteDatabase.OPEN_READONLY).use { database ->
            database.rawQuery("SELECT `$column` FROM `$table` LIMIT 1", null).use { cursor ->
                assertTrue(cursor.moveToFirst())
                cursor.getString(0)
            }
        }

    private fun hasColumn(
        file: File,
        table: String,
        column: String,
    ): Boolean =
        SQLiteDatabase.openDatabase(file.path, null, SQLiteDatabase.OPEN_READONLY).use { database ->
            database.rawQuery("PRAGMA table_info(`$table`)", null).use { cursor ->
                var found = false
                while (cursor.moveToNext()) found = found || cursor.getString(1) == column
                found
            }
        }
}
