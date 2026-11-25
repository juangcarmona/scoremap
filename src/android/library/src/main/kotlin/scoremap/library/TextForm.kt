package scoremap.library

import java.net.URLDecoder
import java.net.URLEncoder

/** Percent-encoding for identities and names inside the compact text forms, so no separator can occur in a field. */
internal fun escapeText(value: String): String = URLEncoder.encode(value, "UTF-8")

internal fun unescapeText(value: String): String = URLDecoder.decode(value, "UTF-8")
