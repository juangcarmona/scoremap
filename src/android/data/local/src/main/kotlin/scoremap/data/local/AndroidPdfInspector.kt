package scoremap.data.local

import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import scoremap.library.PdfFacts
import scoremap.library.PdfInspector
import scoremap.library.PdfLimits
import java.io.File
import java.io.IOException
import java.security.MessageDigest

/**
 * Establishes a PDF's digest, size and page count with the platform renderer. Anything the renderer cannot
 * open and draw a first page from is corrupt or unsupported and yields null.
 */
public class AndroidPdfInspector(
    private val workDirectory: File,
) : PdfInspector {
    override fun inspect(bytes: ByteArray): PdfFacts? {
        val digest = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
        return when {
            bytes.isEmpty() -> null

            // Too large to open: the command refuses it by size, so the page count is irrelevant.
            bytes.size > PdfLimits.MAX_BYTES -> PdfFacts(digest, bytes.size.toLong(), 0)

            else -> pageCount(bytes)?.let { PdfFacts(digest, bytes.size.toLong(), it) }
        }
    }

    private fun pageCount(bytes: ByteArray): Int? {
        workDirectory.mkdirs()
        val file = File.createTempFile("inspect-", ".pdf", workDirectory)
        return try {
            file.writeBytes(bytes)
            ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY).use { descriptor ->
                PdfRenderer(descriptor).use { renderer ->
                    renderer.pageCount.takeIf { it > 0 }?.also { renderer.openPage(0).close() }
                }
            }
        } catch (failure: IOException) {
            failure.message
            null
        } catch (failure: SecurityException) {
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
}
