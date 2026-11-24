package scoremap.feature.library

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

internal fun LazyListScope.attachmentsSection(holder: LibraryHolder) {
    val detail = holder.detail ?: return
    item { Text("PDFs", style = MaterialTheme.typography.titleMedium) }
    item { PdfPicker(holder, detail.id) }
    items(detail.attachments, key = { "pdf-${it.id}" }) { attachment ->
        NamedRow("${attachment.name} (${attachment.pages} pages)") {
            ActionButton("View", "View ${attachment.name}") { holder.viewing = attachment }
            ActionButton("Remove PDF", "Remove PDF ${attachment.name}") {
                holder.act { mode ->
                    holder.models.attachments
                        .remove(detail.id, attachment.id, mode)
                        .notice
                }
            }
        }
    }
}

/** Opens the system document picker; the chosen file's bytes go through the same admission as any PDF. */
@Composable
private fun PdfPicker(
    holder: LibraryHolder,
    songId: String,
) {
    val context = LocalContext.current
    val launcher =
        rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
            if (uri != null) {
                holder.act { mode ->
                    val document = readDocument(context, uri)
                    if (document == null) {
                        Notice.PDF_UNREADABLE
                    } else {
                        holder.models.attachments
                            .attach(songId, document.name, document.bytes, mode)
                            .notice
                    }
                }
            }
        }
    ActionButton("Choose PDF", "Choose a PDF to attach") { launcher.launch(arrayOf("application/pdf")) }
}
