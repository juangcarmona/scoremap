package scoremap.feature.library

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

internal val MinTarget = 48.dp

/** A button at least 48dp high whose spoken name says which item it acts on. */
@Composable
internal fun ActionButton(
    label: String,
    description: String,
    onClick: () -> Unit,
) {
    Button(
        onClick = onClick,
        modifier = Modifier.heightIn(min = MinTarget).semantics { contentDescription = description },
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
    Row(
        Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        OutlinedTextField(
            value = text,
            onValueChange = { text = it },
            label = { Text(label) },
            singleLine = true,
            modifier = Modifier.weight(1f),
        )
        Button(
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
    Row(
        Modifier.fillMaxWidth().heightIn(min = MinTarget),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(name, Modifier.weight(1f))
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
    Row(
        Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        OutlinedTextField(
            value = text,
            onValueChange = { text = it },
            label = { Text(label) },
            singleLine = !multiline,
            minLines = if (multiline) 2 else 1,
            modifier = Modifier.weight(1f),
        )
        Button(
            onClick = { onSave(text) },
            modifier = Modifier.heightIn(min = MinTarget).semantics { contentDescription = "$button: $label" },
        ) { Text(button) }
    }
}
