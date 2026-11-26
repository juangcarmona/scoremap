package scoremap.feature.library

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

private const val INLINE_ENTRY_FONT_LIMIT = 1.3f

internal val MinTarget = 48.dp

internal enum class ActionStyle { SECONDARY, PRIMARY, DESTRUCTIVE }

/** A button at least 48dp high whose spoken name says which item it acts on. */
@Composable
internal fun ActionButton(
    label: String,
    description: String,
    style: ActionStyle = ActionStyle.SECONDARY,
    chosen: Boolean? = null,
    onClick: () -> Unit,
) {
    if (style == ActionStyle.PRIMARY) {
        Button(
            onClick = onClick,
            shape = MaterialTheme.shapes.small,
            modifier =
                Modifier.heightIn(min = MinTarget).semantics {
                    contentDescription = description
                    chosen?.let { selected = it }
                },
        ) { Text(label) }
        return
    }
    TextButton(
        onClick = onClick,
        shape = MaterialTheme.shapes.small,
        colors =
            ButtonDefaults.textButtonColors(
                contentColor =
                    when {
                        style == ActionStyle.DESTRUCTIVE -> MaterialTheme.colorScheme.error
                        chosen == true -> MaterialTheme.colorScheme.onPrimaryContainer
                        else -> MaterialTheme.colorScheme.primary
                    },
                containerColor = if (chosen == true) MaterialTheme.colorScheme.primaryContainer else Color.Transparent,
            ),
        modifier =
            Modifier.heightIn(min = MinTarget).semantics {
                contentDescription = description
                chosen?.let { selected = it }
            },
    ) { Text(label) }
}

/** A labelled text field with its button; the text is read when the button is pressed, then cleared. */
@Composable
internal fun NameEntry(
    label: String,
    button: String,
    onSubmit: (String) -> Unit,
) {
    var text by rememberSaveable(label) { mutableStateOf("") }
    EntryLayout(field = { fieldModifier ->
        OutlinedTextField(
            value = text,
            onValueChange = { text = it },
            label = { Text(label) },
            singleLine = true,
            modifier = fieldModifier,
        )
    }) {
        Button(
            shape = MaterialTheme.shapes.small,
            onClick = {
                // Capture the text now: the action runs later, after the field has been cleared.
                val submitted = text
                text = ""
                onSubmit(submitted)
            },
            modifier = Modifier.heightIn(min = MinTarget),
        ) { Text(button) }
    }
}

@Composable
internal fun NamedRow(
    name: String,
    content: @Composable () -> Unit,
) {
    FlowRow(
        Modifier.fillMaxWidth().heightIn(min = MinTarget),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(name, Modifier.weight(1f), style = MaterialTheme.typography.titleMedium)
        content()
    }
}

/** A saved-value editor: it starts from [initial], keeps the text after saving and follows later stored values. */
@Composable
internal fun SheetEntry(
    label: String,
    initial: String,
    button: String,
    multiline: Boolean,
    onSave: (String) -> Unit,
) {
    var text by rememberSaveable(label, initial) { mutableStateOf(initial) }
    EntryLayout(field = { fieldModifier ->
        OutlinedTextField(
            value = text,
            onValueChange = { text = it },
            label = { Text(label) },
            supportingText = if (text != initial) ({ Text("Unsaved changes") }) else null,
            singleLine = !multiline,
            minLines = if (multiline) 2 else 1,
            modifier = fieldModifier,
        )
    }) {
        Button(
            shape = MaterialTheme.shapes.small,
            onClick = { onSave(text) },
            modifier = Modifier.heightIn(min = MinTarget).semantics { contentDescription = "$button: $label" },
        ) { Text(button) }
    }
}

/** Destructive actions retain an explicit, cancellable native confirmation. */
@Composable
internal fun DestructiveButton(
    label: String,
    description: String,
    onClick: () -> Unit,
) {
    var confirming by rememberSaveable(description) { mutableStateOf(false) }
    ActionButton(label, description, style = ActionStyle.DESTRUCTIVE) { confirming = true }
    if (confirming) {
        AlertDialog(
            containerColor = MaterialTheme.colorScheme.surface,
            onDismissRequest = { confirming = false },
            title = { Text("$description?") },
            text = {
                Text(
                    if (label == "Delete") {
                        "This item moves to Recently deleted and can be restored."
                    } else {
                        "This changes the selected musical content. Check the item before continuing."
                    },
                )
            },
            confirmButton = {
                ActionButton("Confirm $label", "Confirm $description", style = ActionStyle.DESTRUCTIVE) {
                    confirming = false
                    onClick()
                }
            },
            dismissButton = { ActionButton("Cancel", "Cancel $description") { confirming = false } },
        )
    }
}

@Composable
private fun EntryLayout(
    field: @Composable (Modifier) -> Unit,
    action: @Composable () -> Unit,
) {
    val fontScale = LocalDensity.current.fontScale
    BoxWithConstraints(Modifier.fillMaxWidth()) {
        if (maxWidth >= 480.dp && fontScale <= INLINE_ENTRY_FONT_LIMIT) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                field(Modifier.weight(1f))
                action()
            }
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                field(Modifier.fillMaxWidth())
                action()
            }
        }
    }
}
