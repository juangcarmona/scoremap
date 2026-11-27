package scoremap.feature.library

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import scoremap.library.Hand
import scoremap.music.Piano

private val WhiteWidth = 64.dp
private val BlackWidth = 48.dp
private val WhiteHeight = 170.dp
private val BlackHeight = 105.dp
private val Outline = Color.DarkGray
private val BlackSurface = Color.Black

/** `#rrggbb` text from the approved palette as a color. */
internal fun paletteColor(hex: String): Color = Color(("ff" + hex.removePrefix("#")).toLong(HEX_RADIX).toInt())

private const val HEX_RADIX = 16

/** Enlarged editable keys retain 48dp black-key targets and the selected octave color. */
@Composable
internal fun PianoKeyboard(
    keys: List<KeyView>,
    compact: Boolean = false,
    onKey: ((Int) -> Unit)?,
) {
    val whites = keys.filterNot { it.black }
    val scale = LocalDensity.current.fontScale.coerceAtLeast(1f)
    BoxWithConstraints(Modifier.fillMaxWidth()) {
        val whiteWidth = if (compact) (maxWidth / whites.size).coerceAtLeast(WhiteWidth * scale) else WhiteWidth * scale
        val blackWidth = whiteWidth * (BlackWidth / WhiteWidth)
        Box(Modifier.horizontalScroll(rememberScrollState())) {
            Box(Modifier.width(whiteWidth * whites.size).height(if (compact) 120.dp * scale else WhiteHeight * scale)) {
                whites.forEachIndexed { index, key ->
                    KeySurface(
                        key,
                        whiteWidth * index,
                        whiteWidth,
                        if (compact) 120.dp * scale else WhiteHeight * scale,
                        onKey,
                    )
                }
                keys.forEachIndexed { position, key ->
                    if (key.black) {
                        val whitesBefore = keys.take(position).count { !it.black }
                        KeySurface(
                            key,
                            whiteWidth * whitesBefore - blackWidth / 2,
                            blackWidth,
                            if (compact) 72.dp * scale else BlackHeight * scale,
                            onKey,
                        )
                    }
                }
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
    onKey: ((Int) -> Unit)?,
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
            .then(if (onKey != null) Modifier.clickable { onKey(key.midi) } else Modifier)
            .semantics {
                selected = key.color != null
                contentDescription = "${key.label} key" + (hand?.let { ", $it" } ?: "")
            },
        contentAlignment = Alignment.BottomCenter,
    ) {
        Text(
            key.label + (key.hand?.let { "\n" + if (it == Hand.LEFT) "L" else "R" } ?: ""),
            color = if (key.black) Color.White else Color.Black,
        )
    }
}

private const val RANGE_STEP_WHITE_KEYS = 7

@Composable
internal fun PianoRangeControls(
    piano: PianoEditorModel,
    changed: () -> Unit,
) {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        ActionButton("Lowest", "Show the lowest keys") {
            piano.jumpTo(Piano.range.lower)
            changed()
        }
        ActionButton("Lower", "Move the keyboard down") {
            piano.shift(-RANGE_STEP_WHITE_KEYS)
            changed()
        }
        ActionButton("Higher", "Move the keyboard up") {
            piano.shift(RANGE_STEP_WHITE_KEYS)
            changed()
        }
        ActionButton("Highest", "Show the highest keys") {
            piano.jumpTo(Piano.range.upper)
            changed()
        }
    }
}
