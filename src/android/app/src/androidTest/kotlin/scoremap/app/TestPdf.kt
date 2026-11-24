package scoremap.app

/** A small, valid PDF with [pages] blank pages, built with exact cross-reference offsets. */
internal fun testPdf(pages: Int): ByteArray {
    val out = StringBuilder("%PDF-1.4\n")
    val offsets = mutableListOf<Int>()

    fun obj(body: String) {
        offsets += out.length
        out.append("${offsets.size} 0 obj\n$body\nendobj\n")
    }
    obj("<< /Type /Catalog /Pages 2 0 R >>")
    obj("<< /Type /Pages /Kids [" + (0 until pages).joinToString(" ") { "${3 + it} 0 R" } + "] /Count $pages >>")
    repeat(pages) { obj("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>") }
    val xref = out.length
    out.append("xref\n0 ${offsets.size + 1}\n0000000000 65535 f \n")
    offsets.forEach { out.append("%010d 00000 n \n".format(it)) }
    out.append("trailer\n<< /Size ${offsets.size + 1} /Root 1 0 R >>\nstartxref\n$xref\n%%EOF\n")
    return out.toString().toByteArray(Charsets.ISO_8859_1)
}
