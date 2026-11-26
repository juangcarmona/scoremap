package scoremap.feature.library

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * The focused, vertically scrolling song sheet: title, known key, ordered sections with chords aligned to their
 * lyric positions, repeats and cues. It carries no editing controls and only a close button as chrome.
 */
@Composable
internal fun SongSheetScreen(
    holder: LibraryHolder,
    songId: String,
) {
    var performed by remember(songId) { mutableStateOf(true) }
    var loaded by remember(songId, performed) { mutableStateOf(false) }
    var view by remember(songId, performed) { mutableStateOf<SheetView?>(null) }
    LaunchedEffect(songId, performed) {
        view =
            withContext(Dispatchers.IO) {
                holder.models.editors.sheet
                    .load(songId, performed)
            }
        loaded = true
    }
    val sheet = view
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        FlowRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            ActionButton("Close sheet", "Close song sheet") { holder.sheetSongId = null }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Show performed notes")
                Switch(checked = performed, onCheckedChange = { performed = it })
            }
            Text(
                "Protected song sheet",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(vertical = 16.dp),
            )
        }
        if (!loaded) {
            LinearProgressIndicator(Modifier.fillMaxWidth())
        } else if (sheet == null) {
            Text("This song is not available.")
        } else {
            sheetBody(sheet)
        }
    }
}

@Composable
private fun sheetBody(sheet: SheetView) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text(sheet.title, style = MaterialTheme.typography.headlineLarge) }
        item { Text(sheet.key, style = MaterialTheme.typography.titleMedium) }
        items(sheet.sections) { section ->
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(section.title, style = MaterialTheme.typography.titleLarge)
                section.cue?.let { Text("Cue: $it") }
                section.loop?.let { Text("Chords: $it") }
                section.lines.forEach { line ->
                    if (line.chords.isNotEmpty()) {
                        Text(line.chords, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    }
                    Text(line.lyrics, fontFamily = FontFamily.Monospace)
                }
                section.positions.forEach { position -> PerformedPositionRow(position) }
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            }
        }
    }
}

@Composable
private fun PerformedPositionRow(position: PerformedPosition) {
    Column(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("${position.chord} · ${position.part}", style = MaterialTheme.typography.titleLarge)
        val piano =
            remember(position) {
                PianoEditorModel(position.notes, whiteKeys = 21).apply {
                    if (position.notes.isNotEmpty()) {
                        jumpTo((position.notes.minOf { it.midi } + position.notes.maxOf { it.midi }) / 2)
                    }
                }
            }
        PianoKeyboard(piano.keys(), onKey = null, compact = true)
        Text(
            position.notes.joinToString(" · ") { "${scoremap.music.Piano.label(it.midi)} (${handName(it.hand)})" },
            style = MaterialTheme.typography.bodyMedium,
        )
        if (piano.hidden.isNotEmpty()) Text("Outside this view: ${piano.hidden.joinToString(", ")}")
    }
}
