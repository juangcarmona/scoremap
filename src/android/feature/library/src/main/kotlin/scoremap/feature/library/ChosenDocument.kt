package scoremap.feature.library

import android.content.ContentResolver
import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import scoremap.library.PdfLimits
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.io.InputStream

private const val BUFFER = 16 * 1024

/** A document the musician chose: its display name and its bytes, read up to one byte past the PDF limit. */
internal class ChosenDocument(
    val name: String,
    val bytes: ByteArray,
)

internal fun readDocument(
    context: Context,
    uri: Uri,
): ChosenDocument? =
    try {
        val resolver = context.contentResolver
        resolver.openInputStream(uri)?.use(::readCapped)?.let { ChosenDocument(displayName(resolver, uri), it) }
    } catch (failure: IOException) {
        failure.message
        null
    } catch (failure: SecurityException) {
        failure.message
        null
    }

private fun readCapped(input: InputStream): ByteArray {
    val out = ByteArrayOutputStream()
    val buffer = ByteArray(BUFFER)
    var total = 0L
    var read = input.read(buffer)
    while (read >= 0 && total <= PdfLimits.MAX_BYTES) {
        out.write(buffer, 0, read)
        total += read
        read = input.read(buffer)
    }
    return out.toByteArray()
}

private fun displayName(
    resolver: ContentResolver,
    uri: Uri,
): String {
    val name =
        resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) cursor.getString(0) else null
        }
    return name?.removeSuffix(".pdf")?.ifBlank { null } ?: "PDF"
}
