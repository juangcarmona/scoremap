package scoremap.feature.library

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import androidx.compose.foundation.Image
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.IOException

private const val RENDER_WIDTH = 1200
private const val SWIPE_THRESHOLD = 80f

/**
 * Shows one page of an attached PDF between page one and the last page, with previous, next and horizontal
 * swipe. The page last viewed is reported so it can be remembered; an unreadable file shows a recoverable message.
 */
@Composable
internal fun PdfViewer(
    attachment: AttachmentItem,
    bytes: ByteArray?,
    onPage: (Int) -> Unit,
    onClose: () -> Unit,
) {
    val context = LocalContext.current
    var page by rememberSaveable(attachment.id) { mutableIntStateOf(attachment.lastPage.coerceIn(1, attachment.pages)) }
    var image by remember { mutableStateOf<ImageBitmap?>(null) }
    var unreadable by remember { mutableStateOf(bytes == null) }
    LaunchedEffect(page, bytes) {
        if (bytes != null) {
            val rendered = withContext(Dispatchers.IO) { render(context, bytes, page) }
            image = rendered
            unreadable = rendered == null
        }
    }

    fun go(target: Int) {
        val clamped = target.coerceIn(1, attachment.pages)
        if (clamped != page) {
            page = clamped
            onPage(clamped)
        }
    }
    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("${attachment.name}: page $page of ${attachment.pages}")
        // The controls come first so they stay on screen however tall the page image is.
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { go(page - 1) }, enabled = page > 1) { Text("Previous page") }
            Button(onClick = { go(page + 1) }, enabled = page < attachment.pages) { Text("Next page") }
            Button(onClick = onClose) { Text("Close PDF") }
        }
        if (unreadable) {
            Text("This PDF cannot be shown. Your song and its other data are safe.")
        } else {
            image?.let {
                Image(
                    it,
                    contentDescription = "Page $page of ${attachment.pages}",
                    contentScale = ContentScale.FillWidth,
                    modifier = Modifier.fillMaxWidth().swipeToTurn(page) { go(page + it) },
                )
            }
        }
    }
}

private fun Modifier.swipeToTurn(
    key: Int,
    turn: (Int) -> Unit,
): Modifier =
    pointerInput(key) {
        var total = 0f
        detectHorizontalDragGestures(
            onDragEnd = {
                if (total < -SWIPE_THRESHOLD) turn(1)
                if (total > SWIPE_THRESHOLD) turn(-1)
                total = 0f
            },
            onHorizontalDrag = { _, delta -> total += delta },
        )
    }

private fun render(
    context: Context,
    bytes: ByteArray,
    page: Int,
): ImageBitmap? {
    val file = File.createTempFile("view-", ".pdf", context.cacheDir)
    return try {
        file.writeBytes(bytes)
        ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY).use { descriptor ->
            PdfRenderer(descriptor).use { renderer -> draw(renderer, page) }
        }
    } catch (failure: IOException) {
        failure.message
        null
    } catch (failure: IllegalArgumentException) {
        failure.message
        null
    } catch (failure: IllegalStateException) {
        failure.message
        null
    } finally {
        file.delete()
    }
}

private fun draw(
    renderer: PdfRenderer,
    page: Int,
): ImageBitmap =
    renderer.openPage(page - 1).use { pdfPage ->
        val height = RENDER_WIDTH * pdfPage.height / pdfPage.width.coerceAtLeast(1)
        val bitmap = Bitmap.createBitmap(RENDER_WIDTH, height.coerceAtLeast(1), Bitmap.Config.ARGB_8888)
        bitmap.eraseColor(Color.WHITE)
        pdfPage.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
        bitmap.asImageBitmap()
    }
