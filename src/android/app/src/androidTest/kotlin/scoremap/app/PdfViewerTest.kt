package scoremap.app

import android.content.Context
import android.content.Intent
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasContentDescription
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
import scoremap.feature.library.LibraryModels
import scoremap.feature.library.Notice
import scoremap.library.Mode
import java.io.File
import java.util.UUID

/** The attached-PDF journey on the real screen: attach below the picker, view, turn pages, restart. */
@RunWith(AndroidJUnit4::class)
public class PdfViewerTest {
    @get:Rule
    public val compose: ComposeTestRule = createEmptyComposeRule()

    private val context: Context = ApplicationProvider.getApplicationContext()
    private val databaseName = "and07-pdf-${UUID.randomUUID()}.db"

    @After
    public fun removeOnlyOwnedFiles() {
        context.deleteDatabase(databaseName)
        File(context.filesDir, "attachments-$databaseName").deleteRecursively()
    }

    @Test
    public fun anAttachedPdfCanBeViewedPageByPageAndTheLastPageIsRememberedAcrossARestart() {
        val first = launch()
        val models = models(first)
        createSong("Autumn Leaves")
        val songId = songId(models)
        assertEquals(
            Notice.PDF_ATTACHED,
            onWorker { models.attachments.attach(songId, "Score", testPdf(3), Mode.EDIT).notice },
        )
        reopenSong("Autumn Leaves")
        waitForText("Score (3 pages)")
        click("View Score")
        waitForText("Score: page 1 of 3")
        click("Next page")
        waitForText("Score: page 2 of 3")
        compose.onNodeWithContentDescription("Page 2 of 3").assertIsDisplayed()
        click("Previous page")
        click("Next page")
        click("Next page")
        waitForText("Score: page 3 of 3")
        first.close()
        ScoreMapStores.close(databaseName)
        launch().use {
            click("Open Autumn Leaves")
            click("View Score")
            waitForText("Score: page 3 of 3")
        }
    }

    @Test
    public fun anUnreadablePdfIsRefusedWithAMessageAndTheSongKeepsItsData() {
        launch().use { scenario ->
            val models = models(scenario)
            createSong("Blue Bossa")
            val songId = songId(models)
            val notice =
                onWorker { models.attachments.attach(songId, "Broken", "not a pdf".toByteArray(), Mode.EDIT).notice }
            assertEquals(Notice.PDF_UNREADABLE, notice)
            reopenSong("Blue Bossa")
            waitForText("PDFs")
            assertEquals(0, compose.onAllNodesWithText("Broken (1 pages)").fetchSemanticsNodes().size)
            waitForText("Blue Bossa")
        }
    }

    @Test
    public fun performanceModeStillTurnsPagesButRefusesToRemoveThePdf() {
        launch().use { scenario ->
            val models = models(scenario)
            createSong("Reading")
            val songId = songId(models)
            onWorker { models.attachments.attach(songId, "Score", testPdf(2), Mode.EDIT).notice }
            reopenSong("Reading")
            waitForText("Score (2 pages)")
            compose.onNode(isToggleable()).performClick()
            click("Remove PDF Score")
            click("Confirm Remove PDF Score")
            waitForText("Turn on edit mode to change songs.")
            click("View Score")
            waitForText("Score: page 1 of 2")
            click("Next page")
            waitForText("Score: page 2 of 2")
        }
    }

    private fun launch(): ActivityScenario<MainActivity> =
        ActivityScenario.launch(
            Intent(context, MainActivity::class.java).putExtra(MainActivity.EXTRA_DATABASE, databaseName),
        )

    private fun models(scenario: ActivityScenario<MainActivity>): LibraryModels {
        var found: LibraryModels? = null
        scenario.onActivity { found = it.models }
        return requireNotNull(found)
    }

    /** Storage work must not run on the main thread, so the test does it on its own worker thread. */
    private fun <T> onWorker(block: () -> T): T {
        var result: Result<T>? = null
        val thread = Thread { result = runCatching(block) }
        thread.start()
        thread.join()
        return requireNotNull(result).getOrThrow()
    }

    private fun songId(models: LibraryModels): String =
        onWorker {
            models.songs
                .load(Mode.EDIT)
                .songs
                .single()
                .id
        }

    private fun createSong(name: String) {
        waitForText("Song name")
        compose.onNodeWithText("Song name").performTextInput(name)
        compose.onNodeWithText("Create song").performClick()
        waitForText(name)
        click("Open $name")
        waitForText("$name")
    }

    private fun reopenSong(name: String) {
        click("Close editor")
        click("Open $name")
        waitForText("$name")
    }

    private fun click(description: String) = compose.clickControl(description)

    private fun waitForText(text: String) = compose.waitForText(text)

    private companion object {
        const val TIMEOUT_MILLIS = 10_000L
    }
}
