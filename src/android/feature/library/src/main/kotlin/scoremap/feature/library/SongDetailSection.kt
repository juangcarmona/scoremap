package scoremap.feature.library

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
private fun sectionSheet(
    holder: LibraryHolder,
    songId: String,
    section: SectionItem,
) {
    val models = holder.models.detail
    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text("Section: ${section.name} x${section.repeats}")
        Text("Lyrics: ${section.lyrics.ifEmpty { "not entered" }}")
        Text("Cue: ${section.cue.ifEmpty { "not entered" }}")
        SheetEntry("Lyrics for ${section.name}", section.lyrics, "Save lyrics", multiline = true) { text ->
            holder.act { mode -> models.setLyrics(songId, section.id, text, mode)?.notice }
        }
        SheetEntry("Cue for ${section.name}", section.cue, "Save cue", multiline = false) { text ->
            holder.act { mode -> models.setCue(songId, section.id, text, mode)?.notice }
        }
        formSheet(holder, songId, section)
    }
}

internal fun LazyListScope.songDetailSection(holder: LibraryHolder) {
    val detail = holder.detail ?: return
    val models = holder.models.detail
    item { Text("Editing: ${detail.name}", style = MaterialTheme.typography.titleMedium) }
    item { ActionButton("Open song sheet", "Open song sheet of ${detail.name}") { holder.sheetSongId = detail.id } }
    item {
        NameEntry("New name", "Rename") { name -> holder.act { mode -> models.rename(detail.id, name, mode)?.notice } }
    }
    item {
        NameEntry("Section name", "Add section") { name ->
            holder.act { mode -> models.addSection(detail.id, name, mode)?.notice }
        }
    }
    item { Text("Key: ${detail.key ?: "not set"}") }
    item {
        SheetEntry("Song key", detail.key.orEmpty(), "Save key", multiline = false) { text ->
            holder.act { mode -> models.setKey(detail.id, text, mode)?.notice }
        }
    }
    items(
        detail.sections,
        key = { "section-${it.id}" },
    ) { section -> sectionSheet(holder, detail.id, section) }
    partsSection(holder)
    // The PDFs come before the long history so they stay within reach on a small screen.
    attachmentsSection(holder)
    item { Text("History", style = MaterialTheme.typography.titleMedium) }
    items(detail.revisions.reversed(), key = { "revision-${it.number}" }) { revision ->
        NamedRow("Revision ${revision.number}: ${revision.name}, ${revision.sectionCount} sections") {
            ActionButton("Restore revision", "Restore revision ${revision.number}") {
                holder.act { mode -> models.restoreRevision(detail.id, revision.number, mode)?.notice }
            }
        }
    }
    item {
        ActionButton("Close", "Close editor") {
            holder.openSongId = null
            holder.act { null }
        }
    }
}
