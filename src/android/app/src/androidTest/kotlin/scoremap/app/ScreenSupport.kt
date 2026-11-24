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
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.printToString

private const val TIMEOUT_MILLIS = 10_000L

/** True once the node exists, scrolling the list to it when the list has not composed it yet. */
internal fun ComposeTestRule.revealed(matcher: SemanticsMatcher): Boolean =
    try {
        onNode(hasScrollToIndexAction()).performScrollToNode(matcher)
        true
    } catch (failure: AssertionError) {
        failure.message
        onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty()
    }

internal fun ComposeTestRule.waitForText(text: String) {
    try {
        waitUntil(TIMEOUT_MILLIS) { revealed(hasText(text)) }
    } catch (failure: ComposeTimeoutException) {
        throw AssertionError("Text '$text' never appeared. The screen shows:\n" + onRoot().printToString(), failure)
    }
}

/** Clicks the control with this spoken name, or this visible text, wherever the list has put it. */
internal fun ComposeTestRule.clickControl(name: String) {
    waitUntil(TIMEOUT_MILLIS) { revealed(hasContentDescription(name)) || revealed(hasText(name)) }
    if (onAllNodes(hasContentDescription(name)).fetchSemanticsNodes().isNotEmpty()) {
        onNodeWithContentDescription(name).performClick()
    } else {
        onNodeWithText(name).performClick()
    }
}
