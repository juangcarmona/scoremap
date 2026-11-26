package scoremap.app

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertHasNoClickAction
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertWidthIsAtLeast
import androidx.compose.ui.test.hasScrollToIndexAction
import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import scoremap.android.MainActivity
import scoremap.feature.library.LibraryModels
import scoremap.library.Hand
import scoremap.library.Mode
import scoremap.library.PerformedNote
import java.io.File
import java.util.UUID

/** Native design evidence uses real Room commands, actual Compose controls and an isolated synthetic library. */
@RunWith(AndroidJUnit4::class)
public class NativeDesignJourneyTest {
    @get:Rule
    public val compose: androidx.compose.ui.test.junit4.ComposeTestRule = createEmptyComposeRule()
    private val context: Context = ApplicationProvider.getApplicationContext()
    private val databaseName = "design-${UUID.randomUUID()}.db"

    @After
    public fun cleanOwnedData() {
        context.deleteDatabase(databaseName)
    }

    @Test
    public fun captureNativeJourneysAndPreserveMusicOnCancel() {
        val intent = Intent(context, MainActivity::class.java).putExtra(MainActivity.EXTRA_DATABASE, databaseName)
        ActivityScenario.launch<MainActivity>(intent).use { scenario ->
            lateinit var models: LibraryModels
            scenario.onActivity { models = it.models }
            compose.waitForText("Song name")
            compose.onNodeWithText("Create song").assertHeightIsAtLeast(48.dp).assertWidthIsAtLeast(48.dp)
            capture("01-empty-library")
            compose.clickControl("Create song")
            compose.waitForText("Enter a name.")
            capture("06-validation-feedback")
            seed(models)
            scenario.recreate()
            compose.waitForText("Blue Bossa")
            capture("02-populated-library")
            compose.clickControl("Delete Blue Bossa")
            capture("07-delete-confirmation")
            compose.clickControl("Cancel Delete Blue Bossa")
            compose.clickControl("Open Blue Bossa")
            compose.waitForText(
                "Song workspace · revision ${models.detail.load(
                    models.songs
                        .load(Mode.EDIT)
                        .songs
                        .first()
                        .id,
                )!!.revision}",
            )
            capture("03-song-workspace")
            captureConsultation()
            compose.clickControl("Close song sheet")
            compose.clickControl("Show Parts")
            compose.clickControl("Edit voicing of Theme A, measure 1: Cm7 in Stage keys")
            compose.waitForText("Voicing: Theme A, measure 1: Cm7, part Stage keys")
            compose
                .onAllNodes(SemanticsMatcher.keyIsDefined(SemanticsProperties.HorizontalScrollAxisRange))[0]
                .performScrollTo()
            val playedKey = compose.onNodeWithContentDescription("C4 key, right hand").performScrollTo()
            capture("05-two-hand-editor")
            playedKey.assertIsDisplayed()
            compose.onNodeWithContentDescription("Eb4 key, right hand").assertWidthIsAtLeast(48.dp)
            compose.onNodeWithText("Save voicing").assertHeightIsAtLeast(48.dp)
            val song =
                models.songs
                    .load(Mode.EDIT)
                    .songs
                    .first()
            val before = models.detail.load(song.id)
            compose.clickControl("Cancel voicing")
            assertEquals(before, models.detail.load(song.id))
            cancelExcludedRange(models, song.id)
            assertEquals(
                scoremap.feature.library.Notice.EDIT_MODE_REQUIRED,
                models.songs.createSong("Refused", Mode.PERFORMANCE).notice,
            )
        }
    }

    private fun captureConsultation() {
        compose.clickControl("Open song sheet of Blue Bossa")
        compose.waitForText("Key: C minor")
        capture("04-protected-song-sheet")
        compose
            .onAllNodes(SemanticsMatcher.keyIsDefined(SemanticsProperties.HorizontalScrollAxisRange))[0]
            .performScrollTo()
        val key = compose.onNodeWithContentDescription("C4 key, right hand").performScrollTo()
        key.assertIsDisplayed().assertHasNoClickAction()
        capture("09-consultation-piano")
    }

    private fun cancelExcludedRange(
        models: LibraryModels,
        songId: String,
    ) {
        val before = models.detail.load(songId)
        compose.waitForText("Range of Stage keys on Stage piano")
        compose.onNodeWithText("Range of Stage keys on Stage piano").performTextInput("C3-B3")
        compose.clickControl("Bind")
        compose.waitForText("Keep notes outside the range?")
        capture("08-range-confirmation")
        compose.clickControl("Cancel binding range")
        assertEquals(before, models.detail.load(songId))
    }

    private fun seed(models: LibraryModels) {
        val mode = Mode.EDIT
        val song =
            models.songs
                .createSong("Blue Bossa", mode)
                .songs
                .single()
        val id = song.id
        models.detail.setKey(id, "C minor", mode)
        models.detail.addSection(id, "Theme A", mode)
        val section =
            models.detail
                .load(id)!!
                .sections
                .single()
                .id
        models.detail.setLyrics(id, section, "Leave room for the melody.\nListen, then answer together.", mode)
        models.editors.form.addMeasure(id, section, "4/4", mode)
        val measure =
            models.detail
                .load(id)!!
                .sections
                .single()
                .measures
                .single()
                .id
        models.editors.form.addChord(id, section, measure, "Cm7 4", mode)
        models.editors.parts.addPart(id, "Stage keys", mode)
        val detail = models.detail.load(id)!!
        models.editors.parts.saveVoicing(
            id,
            detail.parts.single().id,
            detail.chords.single().eventId,
            listOf(
                PerformedNote(48, Hand.LEFT),
                PerformedNote(55, Hand.LEFT),
                PerformedNote(60, Hand.RIGHT),
                PerformedNote(63, Hand.RIGHT),
                PerformedNote(70, Hand.RIGHT),
            ),
            mode,
        )
        models.editors.arrangement.addDevice(id, "Stage piano", "", mode)
        seedMoreChords(models, id, section)
        models.songs.createSong("Autumn Leaves", mode)
        models.songs.createSong("Evening rehearsal", mode)
    }

    private fun seedMoreChords(
        models: LibraryModels,
        id: String,
        section: String,
    ) {
        val part =
            models.detail
                .load(id)!!
                .parts
                .single()
                .id
        val authored = listOf("Fm7 4" to listOf(53, 60, 63, 68), "G7 4" to listOf(43, 50, 65, 71))
        authored.forEach { (chord, pitches) ->
            models.editors.form.addMeasure(id, section, "4/4", Mode.EDIT)
            val measure =
                models.detail
                    .load(id)!!
                    .sections
                    .single()
                    .measures
                    .last()
                    .id
            models.editors.form.addChord(id, section, measure, chord, Mode.EDIT)
            val event =
                models.detail
                    .load(id)!!
                    .chords
                    .last()
                    .eventId
            models.editors.parts.saveVoicing(
                id,
                part,
                event,
                pitches.mapIndexed { index, midi -> PerformedNote(midi, if (index < 2) Hand.LEFT else Hand.RIGHT) },
                Mode.EDIT,
            )
        }
        val first =
            models.detail
                .load(id)!!
                .chords
                .first()
                .eventId
        models.editors.form.linkLyric(id, section, first, "0", Mode.EDIT)
        models.detail.addSection(id, "Solo · return on cue", Mode.EDIT)
    }

    private fun capture(name: String) {
        compose.waitForIdle()
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        instrumentation.waitForIdleSync()
        android.os.SystemClock.sleep(700)
        val label = InstrumentationRegistry.getArguments().getString("captureLabel") ?: "native"
        val directory = File(context.getExternalFilesDir(null), "design-evidence/$label").also { it.mkdirs() }
        val bitmap = checkNotNull(instrumentation.uiAutomation.takeScreenshot())
        File(directory, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        bitmap.recycle()
    }
}
