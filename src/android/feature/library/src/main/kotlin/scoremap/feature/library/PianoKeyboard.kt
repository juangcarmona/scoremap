package scoremap.feature.library

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import scoremap.library.Hand

private val WhiteWidth = 48.dp
private val BlackWidth = 34.dp
private val WhiteHeight = 170.dp
private val BlackHeight = 105.dp
private val Outline = Color.DarkGray
private val BlackSurface = Color.Black

/** `#rrggbb` text from the approved palette as a color. */
internal fun paletteColor(hex: String): Color = Color(("ff" + hex.removePrefix("#")).toLong(HEX_RADIX).toInt())

private const val HEX_RADIX = 16

/** The enlarged keyboard: white keys at 48dp, black keys on top; a selected key is filled with its octave color. */
@Composable
internal fun PianoKeyboard(
    keys: List<KeyView>,
    onKey: (Int) -> Unit,
) {
    val whites = keys.filterNot { it.black }
    Box(Modifier.horizontalScroll(rememberScrollState()).width(WhiteWidth * whites.size).height(WhiteHeight)) {
        whites.forEachIndexed { index, key -> KeySurface(key, WhiteWidth * index, WhiteWidth, WhiteHeight, onKey) }
        keys.forEachIndexed { position, key ->
            if (key.black) {
                val whitesBefore = keys.take(position).count { !it.black }
                KeySurface(key, WhiteWidth * whitesBefore - BlackWidth / 2, BlackWidth, BlackHeight, onKey)
            }
        }
    }
}

@Composable
private fun KeySurface(
    key: KeyView,
    x: Dp,
    width: Dp,
    height: Dp,
    onKey: (Int) -> Unit,
) {
    val fill = key.color?.let(::paletteColor) ?: if (key.black) BlackSurface else Color.White
    val hand = key.hand?.let { if (it == Hand.LEFT) "left hand" else "right hand" }
    Box(
        Modifier
            .offset(x = x)
            .width(width)
            .height(height)
            .background(fill)
            .border(1.dp, Outline)
            .clickable { onKey(key.midi) }
            .semantics { contentDescription = "${key.label} key" + (hand?.let { ", $it" } ?: "") },
        contentAlignment = Alignment.BottomCenter,
    ) {
        Text(
            key.label + (key.hand?.let { "\n" + if (it == Hand.LEFT) "L" else "R" } ?: ""),
            color = if (key.black) Color.White else Color.Black,
        )
    }
}
