package scoremap.app

import android.content.Context
import android.content.Intent
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.isToggleable
import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import scoremap.android.MainActivity
import java.util.UUID

/** The real library screen on the managed device, backed by real Room. */
@RunWith(AndroidJUnit4::class)
public class LibraryScreenTest {
    @get:Rule
    public val compose: androidx.compose.ui.test.junit4.ComposeTestRule = createEmptyComposeRule()

    private val context: Context = ApplicationProvider.getApplicationContext()
    private val databaseName = "and07-screen-${UUID.randomUUID()}.db"

    @After
    public fun removeOnlyTheOwnedDatabase() {
        context.deleteDatabase(databaseName)
    }

    @Test
    public fun aCreatedSongSurvivesRecreationAndARestartOfTheActivity() {
        val first = launch()
        createSong("Autumn Leaves")
        first.recreate()
        waitForText("Autumn Leaves")
        first.close()
        launch().use {
            waitForText("Autumn Leaves")
            compose.onNodeWithText("Autumn Leaves").assertIsDisplayed()
        }
    }

    @Test
    public fun deletingIsRecoverableAndRestoreBringsTheSongBack() {
        launch().use {
            createSong("Blue Bossa")
            compose.onNodeWithContentDescription("Delete Blue Bossa").performClick()
            waitForText("Recently deleted")
            compose.onNodeWithContentDescription("Restore Blue Bossa").performClick()
            waitForText("Song restored.")
            compose.onNodeWithContentDescription("Delete Blue Bossa").assertIsDisplayed()
        }
    }

    @Test
    public fun performanceModeRefusesToChangeTheLibrary() {
        launch().use {
            waitForText("No songs yet. Create the first one above.")
            compose.onNode(isToggleable()).performClick()
            compose.onNodeWithText("Song name").performTextInput("Refused")
            compose.onNodeWithText("Create song").performClick()
            waitForText("Turn on edit mode to change songs.")
            assertEquals(0, compose.onAllNodesWithText("Refused").fetchSemanticsNodes().size)
        }
    }

    @Test
    public fun theActionTargetsAreAtLeastFortyEightDipHigh() {
        launch().use {
            createSong("Reachable")
            compose.onNodeWithText("Create song").assertHeightIsAtLeast(48.dp)
            compose.onNodeWithContentDescription("Delete Reachable").assertHeightIsAtLeast(48.dp)
        }
    }

    private fun launch(): ActivityScenario<MainActivity> =
        ActivityScenario.launch(
            Intent(context, MainActivity::class.java).putExtra(MainActivity.EXTRA_DATABASE, databaseName),
        )

    private fun createSong(name: String) {
        waitForText("Song name")
        compose.onNodeWithText("Song name").performTextInput(name)
        compose.onNodeWithText("Create song").performClick()
        waitForText("Song created.")
        waitForText(name)
    }

    private fun waitForText(text: String) {
        compose.waitUntil(timeoutMillis = TIMEOUT_MILLIS) {
            compose.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private companion object {
        const val TIMEOUT_MILLIS = 10_000L
    }
}
