package scoremap.feature.library

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import scoremap.music.Clef
import scoremap.music.KeySignature
import scoremap.music.OctavePalette
import scoremap.music.StaffNote

/** Diatonic step numbers (C0 = 0) of the bottom lines, and the visible range of steps. */
private const val TREBLE_BOTTOM_STEP = 30
private const val BASS_BOTTOM_STEP = 18
private const val LOWEST_STEP = 8
private const val HIGHEST_STEP = 46
private const val STAFF_LINES = 5
private const val LINE_GAP_STEPS = 2

/** Layout in density-independent pixels. */
private const val STEP_DP = 6f
private const val COLUMN_DP = 64f
private const val KEY_AREA_DP = 56f
private const val KEY_START_DP = 8
private const val KEY_GAP_DP = 6
private const val LABEL_SP = 11

/** Notehead geometry as multiples of one step. */
private const val NOTE_WIDTH = 2.4f
private const val NOTE_HEIGHT = 1.7f
private const val LEDGER_REACH = 2f
private const val ACCIDENTAL_OFFSET = 3.2f
private const val LABEL_OFFSET = 1.6f
private const val SELECTED_STROKE = 4f
private const val NORMAL_STROKE = 1.5f
private const val LINE_STROKE = 1f
private const val HALF = 2f

/**
 * A compact grand staff of exact pitches: noteheads are filled with their octave color and carry their name, so
 * neither pitch nor octave depends on color. Notes have no stems or flags because no duration is known.
 * [selected] outlines one column; the whole staff is also available as a spoken description.
 */
@Composable
internal fun StaffCanvas(
    columns: List<List<StaffNote>>,
    key: KeySignature?,
    selected: Int? = null,
    modifier: Modifier = Modifier,
) {
    val measurer = rememberTextMeasurer()
    Canvas(
        modifier
            .height((STEP_DP * (HIGHEST_STEP - LOWEST_STEP)).dp)
            .fillMaxWidth()
            .semantics { contentDescription = staffDescription(columns, key) },
    ) {
        drawStaves()
        drawKey(measurer, key)
        columns.forEachIndexed { index, notes -> drawColumn(measurer, notes, index, index == selected) }
    }
}

private fun DrawScope.stepY(step: Int): Float = (HIGHEST_STEP - step) * STEP_DP.dp.toPx()

private fun DrawScope.drawStaves() {
    for (bottom in listOf(TREBLE_BOTTOM_STEP, BASS_BOTTOM_STEP)) {
        for (line in 0 until STAFF_LINES) {
            val y = stepY(bottom + LINE_GAP_STEPS * line)
            drawLine(Color.Black, Offset(0f, y), Offset(size.width, y), strokeWidth = LINE_STROKE)
        }
    }
}

private fun DrawScope.drawKey(
    measurer: TextMeasurer,
    key: KeySignature?,
) {
    if (key == null || key.fifths == 0) return
    val symbol = if (key.fifths > 0) "♯" else "♭"
    for (clef in Clef.entries) {
        val bottom = if (clef == Clef.TREBLE) TREBLE_BOTTOM_STEP else BASS_BOTTOM_STEP
        key.positions(clef).forEachIndexed { i, position ->
            drawLabel(measurer, symbol, (KEY_START_DP + KEY_GAP_DP * i).dp.toPx(), stepY(bottom + position))
        }
    }
}

private fun DrawScope.drawColumn(
    measurer: TextMeasurer,
    notes: List<StaffNote>,
    index: Int,
    selected: Boolean,
) {
    val x = (KEY_AREA_DP + COLUMN_DP * index + COLUMN_DP / HALF).dp.toPx()
    val unit = STEP_DP.dp.toPx()
    for (note in notes) {
        val bottom = if (note.clef == Clef.TREBLE) TREBLE_BOTTOM_STEP else BASS_BOTTOM_STEP
        val y = stepY((bottom + note.position).coerceIn(LOWEST_STEP, HIGHEST_STEP))
        for (ledger in note.ledgerLines) {
            val ly = stepY(bottom + ledger)
            drawLine(
                Color.Black,
                Offset(x - unit * LEDGER_REACH, ly),
                Offset(x + unit * LEDGER_REACH, ly),
                strokeWidth = LINE_STROKE,
            )
        }
        val corner = Offset(x - unit * NOTE_WIDTH / HALF, y - unit * NOTE_HEIGHT / HALF)
        val oval = Size(unit * NOTE_WIDTH, unit * NOTE_HEIGHT)
        drawOval(OctavePalette.colorOf(note.midi)?.let(::paletteColor) ?: Color.LightGray, corner, oval)
        drawOval(Color.Black, corner, oval, style = Stroke(if (selected) SELECTED_STROKE else NORMAL_STROKE))
        note.accidental?.let { drawLabel(measurer, it.symbol, x - unit * ACCIDENTAL_OFFSET, y) }
        drawLabel(measurer, note.label, x + unit * LABEL_OFFSET, y)
    }
}

private fun DrawScope.drawLabel(
    measurer: TextMeasurer,
    text: String,
    x: Float,
    centerY: Float,
) {
    val layout = measurer.measure(text, TextStyle(color = Color.Black, fontSize = LABEL_SP.sp))
    drawText(layout, topLeft = Offset(x, centerY - layout.size.height / HALF))
}
