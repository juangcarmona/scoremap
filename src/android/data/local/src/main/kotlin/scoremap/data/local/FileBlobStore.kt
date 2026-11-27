package scoremap.data.local

import scoremap.library.BlobStore
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

/**
 * Content-addressed attachment bytes on local files. A blob is written to a staging file, flushed to disk and
 * only then renamed to its digest, so a reader never sees a partial file.
 */
public class FileBlobStore(
    private val root: File,
) : BlobStore {
    private val staging = File(root, "staging")

    init {
        staging.mkdirs()
    }

    override fun put(
        sha256: String,
        bytes: ByteArray,
    ): Boolean {
        val target = File(root, sha256)
        return when {
            !DIGEST.matches(sha256) -> false
            target.isFile && target.length() == bytes.size.toLong() -> true
            else -> publish(target, bytes)
        }
    }

    override fun read(sha256: String): ByteArray? =
        File(root, sha256).takeIf { DIGEST.matches(sha256) && it.isFile }?.readBytes()

    override fun retainOnly(digests: Set<String>) {
        root
            .listFiles()
            .orEmpty()
            .filter { it.isFile && it.name !in digests }
            .forEach { it.delete() }
        staging.listFiles().orEmpty().forEach { it.delete() }
    }

    private fun publish(
        target: File,
        bytes: ByteArray,
    ): Boolean {
        val temp = File.createTempFile("blob-", ".part", staging)
        return try {
            FileOutputStream(temp).use {
                it.write(bytes)
                it.fd.sync()
            }
            temp.renameTo(target)
        } catch (failure: IOException) {
            failure.message
            false
        } finally {
            if (temp.exists()) temp.delete()
        }
    }

    private companion object {
        val DIGEST = Regex("^[0-9a-f]{64}$")
    }
}
