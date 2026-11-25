package scoremap.feature.library

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * The local library: songs, ordered sets, and one song's structure and history. Storage work runs off the main
 * thread, and every action is decided by the application commands, so the edit-mode guard also holds here.
 */
@Composable
public fun LibraryScreen(
    models: LibraryModels,
    modifier: Modifier = Modifier,
) {
    val scope = rememberCoroutineScope()
    val holder = remember(models) { LibraryHolder(models, scope) }
    LaunchedEffect(holder) { holder.act { null } }

    Column(modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("ScoreMap", style = MaterialTheme.typography.headlineMedium)
        Row(Modifier.heightIn(min = MinTarget), verticalAlignment = Alignment.CenterVertically) {
            Text("Edit mode", Modifier.weight(1f))
            Switch(checked = holder.editMode, onCheckedChange = { holder.editMode = it })
        }
        holder.notice?.let { Text(it.text, Modifier.semantics { liveRegion = LiveRegionMode.Polite }) }
        val viewing = holder.viewing
        val editing = holder.editing
        if (editing != null) {
            VoicingEditor(holder, editing)
        } else if (viewing != null) {
            PdfViewerHost(holder, viewing)
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                songsSection(holder)
                songDetailSection(holder)
                setsSection(holder)
            }
        }
    }
}

@Composable
private fun PdfViewerHost(
    holder: LibraryHolder,
    attachment: AttachmentItem,
) {
    val songId = holder.openSongId
    var bytes by remember(attachment.id) { mutableStateOf<ByteArray?>(null) }
    var loaded by remember(attachment.id) { mutableStateOf(false) }
    LaunchedEffect(attachment.id) {
        bytes = withContext(Dispatchers.IO) { holder.models.attachments.bytes(attachment.sha256) }
        loaded = true
    }
    if (loaded) {
        PdfViewer(
            attachment,
            bytes,
            onPage = { page ->
                if (songId !=
                    null
                ) {
                    holder.act {
                        holder.models.attachments
                            .rememberPage(songId, attachment.id, page)
                            .notice
                    }
                }
            },
            onClose = {
                holder.viewing = null
                holder.act { null }
            },
        )
    }
}
