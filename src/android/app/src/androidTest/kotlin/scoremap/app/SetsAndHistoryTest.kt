package scoremap.app

import android.content.Context
import android.content.Intent
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.isToggleable
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import scoremap.android.MainActivity
import scoremap.android.ScoreMapStores
import java.util.UUID

/** Ordered sets and retained history on the real screen, backed by real Room on the managed device. */
@RunWith(AndroidJUnit4::class)
public class SetsAndHistoryTest {
    @get:Rule
    public val compose: ComposeTestRule = createEmptyComposeRule()

    private val context: Context = ApplicationProvider.getApplicationContext()
    private val databaseName = "and07-sets-${UUID.randomUUID()}.db"

    @After
    public fun removeOnlyTheOwnedDatabase() {
        context.deleteDatabase(databaseName)
    }

    @Test
    public fun anOrderedSetSurvivesReorderingDeletionRestoreAndARestart() {
        val first = launch()
        create("Song name", "Create song", "Autumn Leaves")
        create("Song name", "Create song", "Blue Bossa")
        create("Set name", "Create set", "Friday")
        click("Add Autumn Leaves to Friday")
        click("Add Blue Bossa to Friday")
        waitForText("2. Blue Bossa")
        click("Move up Blue Bossa in Friday")
        waitForText("1. Blue Bossa")
        click("Delete set Friday")
        waitForText("Recently deleted sets")
        click("Restore set Friday")
        waitForText("1. Blue Bossa")
        first.close()
        ScoreMapStores.close(databaseName)
        launch().use {
            waitForText("1. Blue Bossa")
            compose.onNodeWithText("2. Autumn Leaves").assertIsDisplayed()
        }
    }

    @Test
    public fun everyRetainedRevisionCanBeInspectedAndRestoredAsANewOne() {
        launch().use {
            create("Song name", "Create song", "Old title")
            click("Open Old title")
            create("New name", "Rename", "New title")
            waitForText("Editing: New title")
            create("Section name", "Add section", "Verse", shows = "Section: Verse x1")
            waitForText("Revision 3: New title, 1 sections")
            waitForText("Revision 1: Old title, 0 sections")
            click("Restore revision 1")
            waitForText("Editing: Old title")
            waitForText("Revision 4: Old title, 0 sections")
            waitForText("Revision 2: New title, 0 sections")
        }
    }

    @Test
    public fun theKeyLyricsAndCueAreSavedPerSectionAndSurviveARestart() {
        val first = launch()
        create("Song name", "Create song", "Autumn Leaves")
        click("Open Autumn Leaves")
        create("Section name", "Add section", "Verse", shows = "Section: Verse x1")
        waitForText("Key: not set")
        waitForText("Lyrics: not entered")
        compose.onNodeWithText("Song key").performTextInput("F# minor")
        click("Save key: Song key")
        waitForText("Key: F# minor")
        compose.onNodeWithText("Lyrics for Verse").performTextInput("Autumn leaves")
        click("Save lyrics: Lyrics for Verse")
        waitForText("Lyrics: Autumn leaves")
        compose.onNodeWithText("Cue for Verse").performTextInput("Softly")
        click("Save cue: Cue for Verse")
        waitForText("Cue: Softly")
        first.close()
        ScoreMapStores.close(databaseName)
        launch().use {
            click("Open Autumn Leaves")
            waitForText("Key: F# minor")
            waitForText("Lyrics: Autumn leaves")
            waitForText("Cue: Softly")
        }
    }

    @Test
    public fun measuresChordsAndLyricLinksAreEditedAndSurviveARestart() {
        val first = launch()
        create("Song name", "Create song", "Autumn Leaves")
        click("Open Autumn Leaves")
        create("Section name", "Add section", "Verse", shows = "Section: Verse x1")
        compose.onNodeWithText("Lyrics for Verse").performTextInput("Autumn leaves")
        click("Save lyrics: Lyrics for Verse")
        waitForText("Lyrics: Autumn leaves")
        create("Meter for a new measure of Verse", "Add measure", "3/4", shows = "Measure 1 (3/4): empty")
        create("Chord for measure 1 of Verse", "Add chord", "Dm7 2", shows = "Measure 1 (3/4): Dm7 at 0")
        create("Chord for measure 1 of Verse", "Add chord", "G7", shows = "Measure 1 (3/4): Dm7 at 0, G7 at 2")
        compose.onNodeWithText("Lyric position of Dm7 in measure 1 of Verse").performTextInput("7")
        click("Save link: Lyric position of Dm7 in measure 1 of Verse")
        waitForText("Dm7: 2 beats, lyric 7")
        first.close()
        ScoreMapStores.close(databaseName)
        launch().use {
            click("Open Autumn Leaves")
            waitForText("Measure 1 (3/4): Dm7 at 0, G7 at 2")
            waitForText("Dm7: 2 beats, lyric 7")
            waitForText("G7: 1 beats, lyric not linked")
        }
    }

    @Test
    public fun performanceModeRefusesToCreateASet() {
        launch().use {
            waitForText("Set name")
            compose.onNode(isToggleable()).performClick()
            compose.onNodeWithText("Set name").performTextInput("Refused")
            compose.onNodeWithText("Create set").performClick()
            waitForText("Turn on edit mode to change songs.")
            assertEquals(0, compose.onAllNodesWithText("Refused").fetchSemanticsNodes().size)
        }
    }

    private fun launch(): ActivityScenario<MainActivity> =
        ActivityScenario.launch(
            Intent(context, MainActivity::class.java).putExtra(MainActivity.EXTRA_DATABASE, databaseName),
        )

    private fun create(
        label: String,
        button: String,
        text: String,
        shows: String = text,
    ) {
        waitForText(label)
        compose.onNodeWithText(label).performTextInput(text)
        compose.onNodeWithText(button).performClick()
        waitForText(shows)
    }

    private fun click(description: String) = compose.clickControl(description)

    private fun waitForText(text: String) = compose.waitForText(text)

    private companion object {
        const val TIMEOUT_MILLIS = 10_000L
    }
}
