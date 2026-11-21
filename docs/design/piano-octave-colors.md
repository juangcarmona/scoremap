# Piano octave colors

This is the ScoreMap design reference for octave colors on an 88-key piano.
The owner selected the octave palette shown in the full-keyboard design review
on 2026-11-21. Implementations and design proposals must use this mapping rather
than assigning colors independently.

An octave runs from C through B. A note's octave is its scientific pitch
notation octave, calculated from MIDI as `floor(midi / 12) - 1`; enharmonic
spellings of the same MIDI note share a color. The standard 88-key range runs
from A0 (MIDI 21) through C8 (MIDI 108), so octaves 0 and 8 are partial.

| Octave | Piano range | MIDI range | White-key color | Black-key color |
| --- | --- | --- | --- | --- |
| 0 | A0–B0 | 21–23 | `#d8bce9` | `#704190` |
| 1 | C1–B1 | 24–35 | `#c9c6ed` | `#51479c` |
| 2 | C2–B2 | 36–47 | `#b8d7ee` | `#276698` |
| 3 | C3–B3 | 48–59 | `#aee0df` | `#116d6e` |
| 4 | C4–B4 | 60–71 | `#c8e6bd` | `#4d7e39` |
| 5 | C5–B5 | 72–83 | `#f4e2a4` | `#8e7021` |
| 6 | C6–B6 | 84–95 | `#f5ceaa` | `#a45d25` |
| 7 | C7–B7 | 96–107 | `#edbdc1` | `#9a4552` |
| 8 | C8 | 108 | `#e2c6da` | Not present on an 88-key piano |

Each white or black key uses the corresponding octave's white- or black-key
color. Black keys use the darker shade to retain recognizable keyboard geometry;
color covers the whole selected key. Reuse the same octave mapping for both
hands, and identify the hand independently. Show note names and octave numbers
as well, so neither pitch nor hand depends on color alone. A visualization may
show a smaller range, but cropping and notation preferences must not change a
note's color or pitch. Do not infer exact performed pitches or octaves from a
theoretical chord.

The accepted readability and musical-domain requirements remain authoritative.
This reference records a design decision; the current application has not yet
been updated to implement it. Actual presentation changes require the product
change and delivery process described in `AGENTS.md`.
