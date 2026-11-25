package scoremap.feature.library

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import scoremap.library.Hand
import scoremap.music.KeySignature
import scoremap.music.Piano

private const val PAGE_WHITE_KEYS = 7

/** What is being edited: one part's phrase, with its editor state. */
internal class PhraseEdit(
    val songId: String,
    val partId: String,
    val phrase: PhraseView,
    val model: PhraseEditorModel,
    val key: KeySignature? = null,
)

/**
 * The full-screen phrase editor: press keys across the 88 keys to append notes in the chosen hand, add rests,
 * give a length only when it is known, reorder or remove steps, then save or cancel.
 */
@Composable
internal fun PhraseEditor(
    holder: LibraryHolder,
    edit: PhraseEdit,
) {
    var tick by remember(edit) { mutableIntStateOf(0) }
    var length by remember(edit) { mutableStateOf("") }
    var refused by remember(edit) { mutableStateOf(false) }
    val model = edit.model
    val change = { action: () -> Unit ->
        refused = !model.setDuration(length)
        if (!refused) action()
        tick++
    }
    Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Phrase: ${edit.phrase.name}", style = MaterialTheme.typography.titleMedium)
        Text("Entering: ${if (model.hand == Hand.LEFT) "left" else "right"} hand")
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ActionButton("Left hand", "Enter left hand") { change { model.chooseHand(Hand.LEFT) } }
            ActionButton("Right hand", "Enter right hand") { change { model.chooseHand(Hand.RIGHT) } }
            ActionButton("Add rest", "Add a rest") { change { model.addRest() } }
        }
        OutlinedTextField(
            value = length,
            onValueChange = { length = it },
            label = { Text("Length in beats (empty if unknown)") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        if (refused) Text(Notice.INVALID_DURATION.text)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ActionButton("Lowest", "Show the lowest keys") { model.piano.jumpTo(Piano.range.lower).also { tick++ } }
            ActionButton("Lower", "Move the keyboard down") { model.piano.shift(-PAGE_WHITE_KEYS).also { tick++ } }
            ActionButton("Higher", "Move the keyboard up") { model.piano.shift(PAGE_WHITE_KEYS).also { tick++ } }
            ActionButton("Highest", "Show the highest keys") { model.piano.jumpTo(Piano.range.upper).also { tick++ } }
        }
        if (tick >= 0) PianoKeyboard(model.keys()) { midi -> change { model.press(midi) } }
        if (tick >= 0) phraseStaff(model, edit.key)
        model.lines().forEachIndexed { index, line -> stepRow(model, index, line) { tick++ } }
        if (model.items.isEmpty()) Text("No steps yet")
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ActionButton("Save phrase", "Save phrase") {
                holder.act { mode ->
                    val notice =
                        holder.models.editors.phrases.saveItems(
                            edit.songId,
                            edit.partId,
                            edit.phrase.id,
                            model.items,
                            mode,
                        )
                    if (notice == Notice.PHRASE_SAVED) holder.composing = null
                    notice
                }
            }
            ActionButton("Cancel", "Cancel phrase") { holder.composing = null }
        }
    }
}

@Composable
private fun stepRow(
    model: PhraseEditorModel,
    index: Int,
    line: String,
    changed: () -> Unit,
) {
    val marker = if (model.selected == index) "> " else ""
    NamedRow(marker + line) {
        ActionButton("Select", "Select step ${index + 1}") { model.select(index).also { changed() } }
        ActionButton("Up", "Move step ${index + 1} up") { model.move(index, -1).also { changed() } }
        ActionButton("Down", "Move step ${index + 1} down") { model.move(index, 1).also { changed() } }
        ActionButton("Remove", "Remove step ${index + 1}") { model.remove(index).also { changed() } }
    }
}

@Composable
private fun phraseStaff(
    model: PhraseEditorModel,
    key: KeySignature?,
) {
    val columns = model.items.mapNotNull { it.pitch?.midi }.map { staffColumn(listOf(it), key) }
    val chosen = model.selected?.takeIf { model.items.getOrNull(it)?.pitch != null }
    val column = chosen?.let { index -> model.items.take(index + 1).count { it.pitch != null } - 1 }
    StaffCanvas(columns, key, column)
}
