package scoremap.feature.library

import scoremap.library.EventId
import scoremap.library.Hand
import scoremap.library.HandRole
import scoremap.library.PhraseItem
import scoremap.library.Section
import scoremap.library.Song
import scoremap.music.Piano
import scoremap.music.PitchRange

/** One exact performed note as listed: its label keeps pitch and octave independent of color. */
public data class NoteItem(
    val midi: Int,
    val label: String,
    val hand: Hand,
)

public data class VoicingItem(
    val eventId: String,
    val chord: String,
    val notes: List<NoteItem>,
)

/** A prepared phrase as listed: its steps in order, with the timing only when it was supplied. */
public data class PhraseView(
    val id: String,
    val name: String,
    val section: String?,
    val items: List<PhraseItem>,
    val lines: List<String>,
)

/** A part's binding to a device: where it plays and with which sound. */
public data class BindingItem(
    val id: String,
    val device: String,
    val range: String,
    val sound: String,
)

public data class DeviceItem(
    val id: String,
    val name: String,
    val range: String,
    val bindingCount: Int,
)

public data class PartItem(
    val id: String,
    val name: String,
    val voicings: List<VoicingItem>,
    val phrases: List<PhraseView> = emptyList(),
    val hand: HandRole? = null,
    val bindings: List<BindingItem> = emptyList(),
)

/** A chord the musician can give a voicing: where it is and its symbol. */
public data class ChordChoice(
    val eventId: String,
    val label: String,
)

internal fun sectionItem(
    section: Section,
    voiced: Set<EventId>,
): SectionItem =
    SectionItem(
        section.id.value,
        section.name,
        section.repeats,
        section.lyrics,
        section.cue,
        section.measures.map { m ->
            MeasureItem(
                m.id.value,
                m.meter.label,
                m.events.map {
                    EventItem(
                        it.id.value,
                        it.chord.symbol,
                        it.start.toString(),
                        it.duration.toString(),
                        it.lyricIndex,
                        it.id in voiced,
                    )
                },
            )
        },
    )

internal fun chordChoices(song: Song): List<ChordChoice> =
    song.sections.flatMap { section ->
        section.measures.flatMapIndexed { index, measure ->
            measure.events.map { ChordChoice(it.id.value, "${section.name}, measure ${index + 1}: ${it.chord.symbol}") }
        }
    }

internal fun partItems(song: Song): List<PartItem> {
    val symbols =
        song.sections.flatMap { s -> s.measures.flatMap { m -> m.events } }.associate {
            it.id to
                it.chord.symbol
        }
    return song.parts.map { part ->
        PartItem(
            part.id.value,
            part.name,
            part.voicings.map { v ->
                VoicingItem(
                    v.eventId.value,
                    symbols.getValue(v.eventId),
                    v.notes.map {
                        NoteItem(it.midi, Piano.label(it.midi), it.hand)
                    },
                )
            },
            part.phrases.map { p ->
                PhraseView(
                    p.id.value,
                    p.name,
                    song.sections.firstOrNull { it.id == p.section }?.name,
                    p.items,
                    PhraseEditorModel(p.items).lines(),
                )
            },
            part.hand,
            song.bindings.filter { it.partId == part.id }.map { b ->
                val device = song.devices.firstOrNull { it.id == b.deviceId }
                BindingItem(b.id.value, device?.name.orEmpty(), rangeLabel(b.range), b.sound)
            },
        )
    }
}

internal fun rangeLabel(range: PitchRange): String = "${Piano.label(range.lower)}-${Piano.label(range.upper)}"

internal fun deviceItems(song: Song): List<DeviceItem> =
    song.devices.map { d ->
        DeviceItem(
            d.id.value,
            d.name,
            rangeLabel(d.range),
            song.bindings.count {
                it.deviceId ==
                    d.id
            },
        )
    }
