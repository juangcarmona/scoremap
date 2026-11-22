package scoremap.app

import android.content.Context
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import scoremap.android.MainActivity
import java.util.UUID

// Synthetic test-only schema: no product song/history or application persistence is defined here.
@Entity(tableName = "bootstrap_rows")
internal data class BootstrapRow(
    @PrimaryKey val id: Long,
    val title: String,
    val payload: String,
)

@Dao
internal interface BootstrapDao {
    @Insert
    fun insert(row: BootstrapRow): Unit

    @Query("SELECT * FROM bootstrap_rows WHERE id = :id")
    fun find(id: Long): BootstrapRow?
}

@Database(entities = [BootstrapRow::class], version = 1, exportSchema = false)
internal abstract class BootstrapDatabase : RoomDatabase() {
    abstract fun rows(): BootstrapDao
}

@RunWith(AndroidJUnit4::class)
public class OfflineRecreationTest {
    @get:Rule
    public val compose: AndroidComposeTestRule<ActivityScenarioRule<MainActivity>, MainActivity> =
        createAndroidComposeRule<MainActivity>()

    private val context: Context = ApplicationProvider.getApplicationContext()
    private val databaseName = "and01-bootstrap-${UUID.randomUUID()}.db"

    @After
    public fun removeOnlyOwnedSyntheticDatabase() {
        context.deleteDatabase(databaseName)
    }

    @Test
    public fun roomFixtureSurvivesCloseReopenAndComposeActivityRecreation() {
        val expected = BootstrapRow(17, "AND-01 synthetic fixture", "LH C3 G3; RH E4 G4 C5")
        val database = Room.databaseBuilder(context, BootstrapDatabase::class.java, databaseName).build()
        try {
            database.rows().insert(expected)
            assertEquals(expected, database.rows().find(17))
        } finally {
            database.close()
        }

        compose.onNodeWithText("ScoreMap Android build shell").assertIsDisplayed()
        compose.activityRule.scenario.recreate()
        compose.onNodeWithText("ScoreMap Android build shell").assertIsDisplayed()

        val reopened = Room.databaseBuilder(context, BootstrapDatabase::class.java, databaseName).build()
        try {
            assertEquals(
                BootstrapRow(17, "AND-01 synthetic fixture", "LH C3 G3; RH E4 G4 C5"),
                reopened.rows().find(17),
            )
        } finally {
            reopened.close()
        }
    }
}
