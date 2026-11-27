package scoremap.feature.library

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxSize
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
    Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Column(
            Modifier.weight(1f).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("Phrase: ${edit.phrase.name}", style = MaterialTheme.typography.titleMedium)
            Text("Entering: ${if (model.hand == Hand.LEFT) "left" else "right"} hand")
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
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
            PianoRangeControls(model.piano) { tick++ }
            if (tick >= 0) PianoKeyboard(model.keys()) { midi -> change { model.press(midi) } }
            if (tick >= 0) phraseStaff(model, edit.key)
            model.lines().forEachIndexed { index, line ->
                // The marker is part of the text passed in, so a row recomposes when it gains or loses selection.
                stepRow(model, index, (if (model.selected == index) "> " else "") + line) { tick++ }
            }
            if (model.items.isEmpty()) Text("No steps yet")
        }
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ActionButton("Save phrase", "Save phrase", style = ActionStyle.PRIMARY) {
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
    NamedRow(line) {
        ActionButton("Select", "Select step ${index + 1}") { model.select(index).also { changed() } }
        ActionButton("Up", "Move step ${index + 1} up") { model.move(index, -1).also { changed() } }
        ActionButton("Down", "Move step ${index + 1} down") { model.move(index, 1).also { changed() } }
        DestructiveButton("Remove", "Remove step ${index + 1}") { model.remove(index).also { changed() } }
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
