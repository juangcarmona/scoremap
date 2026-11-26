package scoremap.app

import androidx.compose.ui.test.ComposeTimeoutException
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasScrollToIndexAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.printToString

private const val TIMEOUT_MILLIS = 10_000L

/** True once the node exists, scrolling the list to it when the list has not composed it yet. */
internal fun ComposeTestRule.revealed(matcher: SemanticsMatcher): Boolean =
    try {
        val lists = onAllNodes(hasScrollToIndexAction())
        lists.fetchSemanticsNodes().indices.forEach { index ->
            runCatching { lists[index].performScrollToNode(matcher) }
        }
        if (onAllNodes(matcher).fetchSemanticsNodes().isEmpty()) throw AssertionError("Not composed yet")
        true
    } catch (failure: AssertionError) {
        failure.message
        onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty()
    }

internal fun ComposeTestRule.waitForText(text: String) {
    try {
        revealWorkspace(text)
        waitUntil(TIMEOUT_MILLIS) { revealed(hasText(text)) }
    } catch (failure: ComposeTimeoutException) {
        throw AssertionError("Text '$text' never appeared. The screen shows:\n" + onRoot().printToString(), failure)
    }
}

/** Clicks the control with this spoken name, or this visible text, wherever the list has put it. */
internal fun ComposeTestRule.clickControl(name: String) {
    revealWorkspace(name)
    waitUntil(TIMEOUT_MILLIS) { revealed(hasContentDescription(name)) || revealed(hasText(name)) }
    val node =
        if (onAllNodes(hasContentDescription(name)).fetchSemanticsNodes().isNotEmpty()) {
            onNodeWithContentDescription(name)
        } else {
            onNodeWithText(name)
        }
    // A control below the fold of a plain scrolling screen must be brought into view before it is pressed.
    runCatching { node.performScrollTo() }
    node.performClick()
}

/** Waits until a node with exactly this spoken description exists, such as the staff in words. */
internal fun ComposeTestRule.waitForDescription(description: String) {
    try {
        waitUntil(TIMEOUT_MILLIS) { onAllNodes(hasContentDescription(description)).fetchSemanticsNodes().isNotEmpty() }
    } catch (failure: ComposeTimeoutException) {
        throw AssertionError(
            "Description '$description' never appeared. The screen shows:\n" + onRoot().printToString(),
            failure,
        )
    }
}

/** Follow the musician's workspace destination before scrolling to its control. */
internal fun ComposeTestRule.revealWorkspace(label: String) {
    val chordDetails = label.contains(" beats, lyric ")
    val destination =
        if (chordDetails) {
            "Music"
        } else {
            workspaceDestinations.entries
                .firstOrNull {
                    label.startsWith(it.key)
                }?.value
        }
    if (destination != null) {
        revealed(hasContentDescription("Show $destination"))
        val tab = onAllNodes(hasContentDescription("Show $destination"))
        if (tab.fetchSemanticsNodes().isNotEmpty()) {
            runCatching { tab[0].performScrollTo() }
            tab[0].performClick()
        }
    }
    if (chordDetails ||
        listOf("Lyrics for", "Cue for", "Meter for", "Chord for", "Lyric position of").any { label.startsWith(it) }
    ) {
        revealed(hasContentDescription("Edit section Verse"))
        val edit = onAllNodes(hasContentDescription("Edit section Verse"))
        if (edit.fetchSemanticsNodes().isNotEmpty()) {
            runCatching { edit[0].performScrollTo() }
            edit[0].performClick()
        }
    }
}

private val workspaceDestinations =
    mapOf(
        "New name" to "Song details",
        "Song key" to "Song details",
        "Revision " to "History",
        "Restore revision " to "History",
        "Part" to "Parts",
        "Device" to "Parts",
        "Edit voicing" to "Parts",
        "Verse, measure" to "Parts",
        "Phrase" to "Parts",
        "Hand of" to "Parts",
        "Binding:" to "Parts",
        "Range of" to "Parts",
        "Choose PDF" to "PDFs",
        "View Score" to "PDFs",
        "Score (" to "PDFs",
        "PDFs" to "PDFs",
        "Section name" to "Music",
        "Lyrics" to "Music",
        "Cue" to "Music",
        "Meter" to "Music",
        "Chord" to "Music",
        "Measure" to "Music",
        "Lyric position" to "Music",
    )
