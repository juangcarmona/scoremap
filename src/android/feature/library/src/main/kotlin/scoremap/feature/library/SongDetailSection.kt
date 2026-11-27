package scoremap.feature.library

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
private fun sectionSheet(
    holder: LibraryHolder,
    songId: String,
    section: SectionItem,
) {
    val models = holder.models.detail
    var editing by rememberSaveable(section.id) { mutableStateOf(false) }
    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Section: ${section.name} x${section.repeats}", style = MaterialTheme.typography.titleLarge)
        Text("Lyrics: ${section.lyrics.ifEmpty { "not entered" }}", style = MaterialTheme.typography.bodyLarge)
        Text("Cue: ${section.cue.ifEmpty { "not entered" }}", color = MaterialTheme.colorScheme.onSurfaceVariant)
        section.measures.forEachIndexed { index, measure ->
            Text(
                "Measure ${index + 1} (${measure.meter}): " +
                    measure.events.joinToString(", ") { "${it.symbol} at ${it.start}" }.ifEmpty { "empty" },
                style = MaterialTheme.typography.titleMedium,
            )
        }
        if (!editing) {
            ActionButton("Edit section", "Edit section ${section.name}") { editing = true }
        } else {
            SheetEntry("Lyrics for ${section.name}", section.lyrics, "Save lyrics", multiline = true) { text ->
                holder.act { mode -> models.setLyrics(songId, section.id, text, mode)?.notice }
            }
            SheetEntry("Cue for ${section.name}", section.cue, "Save cue", multiline = false) { text ->
                holder.act { mode -> models.setCue(songId, section.id, text, mode)?.notice }
            }
            formSheet(holder, songId, section)
            ActionButton("Done", "Close section editor ${section.name}") { editing = false }
        }
        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
    }
}

internal fun LazyListScope.songDetailSection(holder: LibraryHolder) {
    val detail = holder.detail ?: return
    item {
        Text(detail.name, style = MaterialTheme.typography.headlineMedium)
        Text("Song workspace · revision ${detail.revision}", color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text("Key: ${detail.key ?: "not set"}", style = MaterialTheme.typography.titleMedium)
        ActionButton("Open song sheet", "Open song sheet of ${detail.name}") { holder.sheetSongId = detail.id }
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("Music", "Parts", "PDFs", "History", "Song details").forEach { tab ->
                ActionButton(tab, "Show $tab", chosen = holder.workspaceTab == tab) {
                    holder.workspaceTab = tab
                }
            }
        }
        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
    }
    when (holder.workspaceTab) {
        "Music" -> {
            items(detail.sections, key = { "section-${it.id}" }) { section -> sectionSheet(holder, detail.id, section) }
            item {
                NameEntry("Section name", "Add section") { name ->
                    holder.act { mode ->
                        holder.models.detail
                            .addSection(detail.id, name, mode)
                            ?.notice
                    }
                }
            }
        }

        "Parts" -> {
            partsSection(holder)
        }

        "PDFs" -> {
            attachmentsSection(holder)
        }

        "History" -> {
            historySection(holder, detail)
        }

        "Song details" -> {
            songProperties(holder, detail)
        }
    }
    item {
        ActionButton("Back to library", "Close editor") {
            holder.openSongId = null
            holder.workspaceTab = "Music"
            holder.act { null }
        }
    }
}

private fun LazyListScope.songProperties(
    holder: LibraryHolder,
    detail: SongDetailState,
) {
    item {
        NameEntry("New name", "Rename") { name ->
            holder.act { mode ->
                holder.models.detail
                    .rename(detail.id, name, mode)
                    ?.notice
            }
        }
    }
    item {
        SheetEntry("Song key", detail.key.orEmpty(), "Save key", multiline = false) { text ->
            holder.act { mode ->
                holder.models.detail
                    .setKey(detail.id, text, mode)
                    ?.notice
            }
        }
    }
}

private fun LazyListScope.historySection(
    holder: LibraryHolder,
    detail: SongDetailState,
) {
    item { Text("History", style = MaterialTheme.typography.titleMedium) }
    items(detail.revisions.reversed(), key = { "revision-${it.number}" }) { revision ->
        NamedRow("Revision ${revision.number}: ${revision.name}, ${revision.sectionCount} sections") {
            ActionButton("Restore revision", "Restore revision ${revision.number}") {
                holder.act { mode ->
                    holder.models.detail
                        .restoreRevision(detail.id, revision.number, mode)
                        ?.notice
                }
            }
        }
    }
}
