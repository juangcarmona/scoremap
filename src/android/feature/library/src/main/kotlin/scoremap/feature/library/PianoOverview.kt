package scoremap.feature.library

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import scoremap.library.PerformedNote
import scoremap.music.OctavePalette
import scoremap.music.Piano

private const val BLACK_WIDTH_FRACTION = 0.6666667f
private const val BLACK_HEIGHT_FRACTION = 0.6f

/** Full 88-key orientation. This is a read-only diagram; the enlarged keyboard owns editing targets. */
@Composable
internal fun PianoOverview(notes: List<PerformedNote>) {
    val played = notes.map { it.midi }.toSet()
    Canvas(
        Modifier.fillMaxWidth().height(48.dp).semantics {
            contentDescription = "Full 88-key piano, A0 to C8. Selected: " + notes.joinToString { Piano.label(it.midi) }
        },
    ) {
        val white = size.width / Piano.whiteKeys.size
        Piano.whiteKeys.forEachIndexed { index, key ->
            val at = Offset(index * white, 0f)
            val fill =
                if (key.midi in
                    played
                ) {
                    paletteColor(checkNotNull(OctavePalette.colorOf(key.midi)))
                } else {
                    Color.White
                }
            drawRect(fill, at, Size(white, size.height))
            drawRect(Color.DarkGray, at, Size(white, size.height), style = Stroke(1f))
        }
        Piano.keys.filter { it.black }.forEach { key ->
            val before = Piano.whiteKeys.count { it.midi < key.midi }
            val fill =
                if (key.midi in
                    played
                ) {
                    paletteColor(checkNotNull(OctavePalette.colorOf(key.midi)))
                } else {
                    Color.Black
                }
            drawRect(
                fill,
                Offset(before * white - white * BLACK_WIDTH_FRACTION / 2, 0f),
                Size(white * BLACK_WIDTH_FRACTION, size.height * BLACK_HEIGHT_FRACTION),
            )
        }
    }
}
