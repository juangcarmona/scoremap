package scoremap.feature.library

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
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

/** Adaptive native library and focused editors, backed by acknowledged local storage. */
@Composable
public fun LibraryScreen(
    models: LibraryModels,
    modifier: Modifier = Modifier,
) {
    val scope = rememberCoroutineScope()
    val holder = remember(models) { LibraryHolder(models, scope) }
    LaunchedEffect(holder) { holder.act { null } }
    BackHandler(holder.hasOpenSurface()) { holder.closeSurface() }
    Column(modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).imePadding()) {
        if (holder.sheetSongId == null) LibraryHeader(holder)
        holder.notice?.let { NoticeBanner(it) }
        if (holder.songs == null || holder.busy) LinearProgressIndicator(Modifier.fillMaxWidth())
        LibraryContent(holder, Modifier.weight(1f))
    }
}

@Composable
private fun LibraryHeader(holder: LibraryHolder) {
    Surface(color = MaterialTheme.colorScheme.surface) {
        FlowRow(
            Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(24.dp),
        ) {
            Column(Modifier.weight(1f)) {
                Text("ScoreMap", style = MaterialTheme.typography.titleLarge)
                Text(
                    "Local library",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(if (holder.editMode) "Edit mode" else "Performance mode")
                Switch(checked = holder.editMode, onCheckedChange = { holder.editMode = it })
            }
        }
    }
    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
}

@Composable
internal fun NoticeBanner(notice: Notice) {
    val (surface, text) = feedbackColors(notice)
    Surface(color = surface) {
        Text(
            notice.text,
            Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .semantics { liveRegion = LiveRegionMode.Polite },
            color = text,
        )
    }
}

@Composable
private fun LibraryContent(
    holder: LibraryHolder,
    modifier: Modifier,
) {
    Column(modifier.fillMaxWidth().padding(24.dp)) {
        val sheet = holder.sheetSongId
        val editing = holder.editing
        val composing = holder.composing
        val viewing = holder.viewing
        when {
            sheet != null -> SongSheetScreen(holder, sheet)
            editing != null -> VoicingEditor(holder, editing)
            composing != null -> PhraseEditor(holder, composing)
            viewing != null -> PdfViewerHost(holder, viewing)
            else -> LibraryWorkspace(holder)
        }
    }
}

@Composable
private fun LibraryWorkspace(holder: LibraryHolder) {
    var sets by remember { mutableStateOf(false) }
    BoxWithConstraints {
        val expanded = maxWidth >= 840.dp
        Row(horizontalArrangement = Arrangement.spacedBy(32.dp)) {
            if (expanded || holder.openSongId == null) {
                Column(if (expanded) Modifier.width(280.dp) else Modifier.fillMaxWidth()) {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        ActionButton("Songs", "Show songs", chosen = !sets) { sets = false }
                        ActionButton("Sets", "Show sets", chosen = sets) { sets = true }
                    }
                    Text(
                        if (sets) "Sets" else "Song library",
                        style = MaterialTheme.typography.headlineSmall,
                        modifier = Modifier.padding(vertical = 16.dp),
                    )
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        if (sets) setsSection(holder) else songsSection(holder)
                    }
                }
            }
            if (holder.detail != null) {
                LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    songDetailSection(holder)
                }
            } else if (expanded) {
                Column(Modifier.weight(1f).padding(top = 64.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Choose a song", style = MaterialTheme.typography.headlineMedium)
                    Text(
                        "Choose a song to prepare its sections, chords and parts.",
                        style = MaterialTheme.typography.bodyLarge,
                    )
                    Text(
                        "Open the song sheet when you are ready to play.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

private fun LibraryHolder.hasOpenSurface(): Boolean =
    sheetSongId != null || editing != null || composing != null || viewing != null || openSongId != null

private fun LibraryHolder.closeSurface() {
    when {
        sheetSongId != null -> {
            sheetSongId = null
        }

        editing != null -> {
            editing = null
        }

        composing != null -> {
            composing = null
        }

        viewing != null -> {
            viewing = null
        }

        else -> {
            openSongId = null
            act { null }
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
