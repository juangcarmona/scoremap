package scoremap.library

/** The text form of one phrase inside a part; see [PartsText]. */
internal object PhraseText {
    fun encode(phrase: Phrase): String =
        listOf(
            escapeText(phrase.id.value),
            escapeText(phrase.name),
            phrase.section?.let { escapeText(it.value) }.orEmpty(),
            phrase.items.joinToString(",") { item(it) },
        ).joinToString(":")

    private fun item(item: PhraseItem): String {
        val pitch = item.pitch?.let { "${it.midi}${if (it.hand == Hand.LEFT) 'L' else 'R'}" } ?: "r"
        return pitch + (item.duration?.let { "@$it" }.orEmpty())
    }

    fun decode(text: String): Phrase {
        val f = text.split(':').also { check(it.size == FIELDS_PER_PHRASE) { "Corrupt phrase" } }
        val items = if (f[ITEMS].isEmpty()) emptyList() else f[ITEMS].split(',').map(::readItem)
        return Phrase(
            PhraseId(unescapeText(f[0])),
            unescapeText(f[1]),
            f[2].ifEmpty { null }?.let { SectionId(unescapeText(it)) },
            items,
        )
    }

    private fun readItem(text: String): PhraseItem {
        val (pitch, duration) = text.split('@').let { it[0] to it.getOrNull(1) }
        check(text.count { it == '@' } <= 1) { "Corrupt item" }
        val length = duration?.let { checkNotNull(Fraction.parse(it)) { "Corrupt duration" } }
        return PhraseItem(if (pitch == "r") null else PartsText.readNote(pitch), length)
    }

    private const val FIELDS_PER_PHRASE = 4
    private const val ITEMS = 3
}
