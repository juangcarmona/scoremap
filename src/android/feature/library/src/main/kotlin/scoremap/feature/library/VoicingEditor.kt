package scoremap.feature.library

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import scoremap.library.Hand
import scoremap.music.Piano

private const val PAGE_WHITE_KEYS = 7

/** What is being edited: one part's voicing for one chord, with the keyboard state. */
internal class VoicingEdit(
    val songId: String,
    val partId: String,
    val partName: String,
    val chord: ChordChoice,
    val piano: PianoEditorModel,
)

/**
 * The full-screen voicing editor: pick the hand, press keys across the whole 88-key range, move the window
 * without losing a selection, then save or cancel. Cancel leaves the stored music unchanged.
 */
@Composable
internal fun VoicingEditor(
    holder: LibraryHolder,
    edit: VoicingEdit,
) {
    var tick by remember(edit) { mutableIntStateOf(0) }
    val piano = edit.piano
    val change = { action: () -> Unit ->
        action()
        tick++
    }
    Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Voicing: ${edit.chord.label}, part ${edit.partName}", style = MaterialTheme.typography.titleMedium)
        Text("Entering: ${if (piano.hand == Hand.LEFT) "left" else "right"} hand")
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ActionButton("Left hand", "Enter left hand") { change { piano.chooseHand(Hand.LEFT) } }
            ActionButton("Right hand", "Enter right hand") { change { piano.chooseHand(Hand.RIGHT) } }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ActionButton("Lowest", "Show the lowest keys") { change { piano.jumpTo(Piano.range.lower) } }
            ActionButton("Lower", "Move the keyboard down") { change { piano.shift(-PAGE_WHITE_KEYS) } }
            ActionButton("Higher", "Move the keyboard up") { change { piano.shift(PAGE_WHITE_KEYS) } }
            ActionButton("Highest", "Show the highest keys") { change { piano.jumpTo(Piano.range.upper) } }
        }
        Text("Showing ${Piano.label(piano.window.lowest)} to ${Piano.label(piano.window.highest)} of A0 to C8")
        if (tick >= 0) PianoKeyboard(piano.keys()) { midi -> change { piano.toggle(midi) } }
        val hidden = piano.hidden
        if (hidden.isNotEmpty()) Text("Selected, not in view: ${hidden.joinToString(", ")}")
        Text("Selected: " + selectedText(piano))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ActionButton("Save voicing", "Save voicing") {
                holder.act { mode ->
                    val notice =
                        holder.models.parts.saveVoicing(
                            edit.songId,
                            edit.partId,
                            edit.chord.eventId,
                            piano.selected,
                            mode,
                        )
                    if (notice == Notice.VOICING_SAVED) holder.editing = null
                    notice
                }
            }
            ActionButton("Cancel", "Cancel voicing") { holder.editing = null }
        }
    }
}

private fun selectedText(piano: PianoEditorModel): String =
    piano.selected
        .joinToString(", ") { "${Piano.label(it.midi)} (${if (it.hand == Hand.LEFT) "left" else "right"})" }
        .ifEmpty { "none" }
