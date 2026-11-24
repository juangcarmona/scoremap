package scoremap.exchange

/** A strict, minimal JSON reader and writer: objects, arrays, strings and integers only. */
internal sealed interface Json {
    data class Text(
        val value: String,
    ) : Json

    data class Integer(
        val value: Long,
    ) : Json

    data class Array(
        val items: List<Json>,
    ) : Json

    data class Obj(
        val fields: Map<String, Json>,
    ) : Json
}

internal class JsonFailure(
    val tooDeep: Boolean,
) : Exception()

private const val HEX_DIGITS = 4
private const val HEX_RADIX = 16
private const val MAX_DIGITS = 15

private class Cursor(
    val text: String,
) {
    var position = 0

    fun atEnd(): Boolean = position >= text.length

    fun skipSpace() {
        while (position < text.length && text[position] in " \t\r\n") position++
    }

    fun peek(): Char = if (position < text.length) text[position] else throw JsonFailure(false)

    fun expect(c: Char) {
        if (peek() != c) throw JsonFailure(false)
        position++
    }
}

internal object JsonReader {
    fun read(
        text: String,
        maxDepth: Int,
    ): Json {
        val parser = Parser(Cursor(text), maxDepth)
        val value = parser.value(0)
        parser.end()
        return value
    }

    private class Parser(
        private val cursor: Cursor,
        private val maxDepth: Int,
    ) {
        fun end() {
            cursor.skipSpace()
            if (!cursor.atEnd()) throw JsonFailure(tooDeep = false)
        }

        fun value(depth: Int): Json {
            cursor.skipSpace()
            if (depth > maxDepth) throw JsonFailure(tooDeep = true)
            return when (cursor.peek()) {
                '{' -> obj(depth)
                '[' -> array(depth)
                '"' -> Json.Text(string())
                else -> integer()
            }
        }

        private fun obj(depth: Int): Json {
            cursor.expect('{')
            val fields = LinkedHashMap<String, Json>()
            cursor.skipSpace()
            if (cursor.peek() != '}') {
                do {
                    cursor.skipSpace()
                    val key = string()
                    cursor.skipSpace()
                    cursor.expect(':')
                    if (fields.put(key, value(depth + 1)) != null) throw JsonFailure(false)
                    cursor.skipSpace()
                } while (consumeComma())
            }
            cursor.skipSpace()
            cursor.expect('}')
            return Json.Obj(fields)
        }

        private fun array(depth: Int): Json {
            cursor.expect('[')
            val items = mutableListOf<Json>()
            cursor.skipSpace()
            if (cursor.peek() != ']') {
                do {
                    items += value(depth + 1)
                    cursor.skipSpace()
                } while (consumeComma())
            }
            cursor.expect(']')
            return Json.Array(items)
        }

        private fun consumeComma(): Boolean {
            val comma = cursor.peek() == ','
            if (comma) cursor.position++
            return comma
        }

        private fun string(): String {
            cursor.expect('"')
            val out = StringBuilder()
            while (true) {
                val c = cursor.peek()
                cursor.position++
                when {
                    c == '"' -> return out.toString()
                    c == '\\' -> out.append(escape())
                    c < ' ' -> throw JsonFailure(false)
                    else -> out.append(c)
                }
            }
        }

        private fun escape(): Char {
            val c = cursor.peek()
            cursor.position++
            return when (c) {
                '"', '\\', '/' -> c
                'b' -> '\b'
                'f' -> '\u000C'
                'n' -> '\n'
                'r' -> '\r'
                't' -> '\t'
                'u' -> unicode()
                else -> throw JsonFailure(false)
            }
        }

        private fun unicode(): Char {
            val start = cursor.position
            if (start + HEX_DIGITS > cursor.text.length) throw JsonFailure(false)
            val digits = cursor.text.substring(start, start + HEX_DIGITS)
            if (digits.any { it !in "0123456789abcdefABCDEF" }) throw JsonFailure(false)
            cursor.position += HEX_DIGITS
            return digits.toInt(HEX_RADIX).toChar()
        }

        private fun integer(): Json {
            val start = cursor.position
            if (cursor.peek() == '-') cursor.position++
            val digitsStart = cursor.position
            while (!cursor.atEnd() && cursor.text[cursor.position] in '0'..'9') cursor.position++
            val digits = cursor.text.substring(digitsStart, cursor.position)
            val leadingZero = digits.length > 1 && digits.startsWith("0")
            if (digits.isEmpty() || leadingZero || digits.length > MAX_DIGITS) throw JsonFailure(false)
            if (!cursor.atEnd() && cursor.text[cursor.position] in ".eE") throw JsonFailure(false)
            return Json.Integer(cursor.text.substring(start, cursor.position).toLong())
        }
    }
}

internal object JsonWriter {
    fun quote(value: String): String {
        val out = StringBuilder("\"")
        for (c in value) {
            when {
                c == '"' -> out.append("\\\"")
                c == '\\' -> out.append("\\\\")
                c == '\n' -> out.append("\\n")
                c == '\r' -> out.append("\\r")
                c == '\t' -> out.append("\\t")
                c == '\b' -> out.append("\\b")
                c == '\u000C' -> out.append("\\f")
                c < ' ' -> out.append("\\u").append(c.code.toString(HEX_RADIX).padStart(HEX_DIGITS, '0'))
                else -> out.append(c)
            }
        }
        return out.append('"').toString()
    }
}
