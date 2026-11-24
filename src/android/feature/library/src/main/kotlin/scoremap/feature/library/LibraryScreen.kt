package scoremap.feature.library

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import scoremap.library.Mode

private val MinTarget = 48.dp

/**
 * The local library: create, delete and restore songs. Storage work runs off the main thread, and every action
 * is decided by the application commands, so the edit-mode guard also holds for this screen.
 */
@Composable
public fun LibraryScreen(
    model: LibraryScreenModel,
    modifier: Modifier = Modifier,
) {
    var editMode by rememberSaveable { mutableStateOf(true) }
    var draft by rememberSaveable { mutableStateOf("") }
    var state by remember { mutableStateOf<LibraryScreenState?>(null) }
    val scope = rememberCoroutineScope()
    val mode = if (editMode) Mode.EDIT else Mode.PERFORMANCE

    fun act(action: () -> LibraryScreenState) {
        scope.launch {
            val next = withContext(Dispatchers.IO) { action() }
            state = next
        }
    }

    androidx.compose.runtime.LaunchedEffect(Unit) { state = withContext(Dispatchers.IO) { model.load(mode) } }

    Column(modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("ScoreMap", style = MaterialTheme.typography.headlineMedium)
        EditModeRow(editMode) { editMode = it }
        NameRow(draft, onChange = { draft = it }) {
            act { model.createSong(draft, mode) }
            draft = ""
        }
        state?.notice?.let { Text(message(it), Modifier.semantics { liveRegion = LiveRegionMode.Polite }) }
        SongList(state, mode, ::act, model)
    }
}

@Composable
private fun EditModeRow(
    editMode: Boolean,
    onChange: (Boolean) -> Unit,
) {
    Row(Modifier.heightIn(min = MinTarget), verticalAlignment = Alignment.CenterVertically) {
        Text("Edit mode", Modifier.weight(1f))
        Switch(checked = editMode, onCheckedChange = onChange)
    }
}

@Composable
private fun NameRow(
    draft: String,
    onChange: (String) -> Unit,
    onCreate: () -> Unit,
) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
        OutlinedTextField(
            value = draft,
            onValueChange = onChange,
            label = { Text("Song name") },
            singleLine = true,
            modifier = Modifier.weight(1f),
        )
        Button(onClick = onCreate, modifier = Modifier.heightIn(min = MinTarget)) { Text("Create song") }
    }
}

@Composable
private fun SongList(
    state: LibraryScreenState?,
    mode: Mode,
    act: (() -> LibraryScreenState) -> Unit,
    model: LibraryScreenModel,
) {
    val songs = state?.songs.orEmpty()
    val deleted = state?.deleted.orEmpty()
    LazyColumn(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (state != null && songs.isEmpty()) item { Text("No songs yet. Create the first one above.") }
        items(songs, key = { it.id }) { song ->
            SongRow(song.name, "Delete", "Delete ${song.name}") { act { model.deleteSong(song.id, mode) } }
        }
        if (deleted.isNotEmpty()) item { Text("Recently deleted", style = MaterialTheme.typography.titleMedium) }
        items(deleted, key = { "deleted-${it.id}" }) { song ->
            SongRow(song.name, "Restore", "Restore ${song.name}") { act { model.restoreSong(song.id, mode) } }
        }
    }
}

@Composable
private fun SongRow(
    name: String,
    action: String,
    description: String,
    onClick: () -> Unit,
) {
    Row(Modifier.fillMaxWidth().heightIn(min = MinTarget), verticalAlignment = Alignment.CenterVertically) {
        Text(name, Modifier.weight(1f))
        Button(
            onClick = onClick,
            modifier =
                Modifier.heightIn(min = MinTarget).semantics {
                    contentDescription =
                        description
                },
        ) {
            Text(action)
        }
    }
}

private fun message(notice: Notice): String =
    when (notice) {
        Notice.CREATED -> "Song created."
        Notice.DELETED -> "Song deleted. It can be restored."
        Notice.RESTORED -> "Song restored."
        Notice.INVALID_NAME -> "Enter a song name."
        Notice.EDIT_MODE_REQUIRED -> "Turn on edit mode to change songs."
        Notice.CONFLICT -> "The library changed elsewhere. Nothing was saved; try again."
        Notice.STORAGE_FAILED -> "Could not save. Nothing was changed."
        Notice.FAILED -> "That could not be done."
    }
