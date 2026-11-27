# Epic #92 status: what is delivered and what is still open

Recorded after PR #129 (editor train 3 to 5) merged into `lighthouse/epic-92`. Authored coverage, actual
execution, independent review and deployment are separate facts; a green aggregate does not attest the last two.
Device tests run only in CI on the managed Pixel Tablet image; nothing was run on a physical tablet.

## Delivered on `lighthouse/epic-92` (merged with passing required checks)

| Slice | PRs | What exists |
| --- | --- | --- |
| AND-00 product traceability | #103 | `verify:traceability` binds the applied product change and the four native SBs. |
| AND-01 build and runners | #102 | Locked Gradle build, convention plugins, `verifyHost`, `verifyDevice`, TDD runners. |
| AND-02 architecture refusals | #104, #106, #107, #108 | Project graph, pure domain, storage ownership, gate-integrity refusals (suppressions, downgrades, omitted tasks, empty suites). AND-G04 and AND-G05 await real feature code. |
| AND-03 gates and receipts | #111 | `verifyRelease`, source-bound artifact and execution receipts, root adapters. |
| AND-04 pure musical rules | #112 | Spelling, exact pitch, register, full chord catalogue and library rules checked against hand-derived literals and the existing web domain. |
| AND-05 local lifecycle | #113, #114, #118, #119, #120, #121 | Sets, retained history, recoverable delete, restore with a new revision, confirmed purge, anti-resurrection, guarded commands, the store port and application service, the Room adapter with real-device tests, set and history screens, PDF attachments (rules, service, file blob store, platform inspection) and a page viewer. |
| AND-06 transfer | #115, #122, #126, #127, #128 and #129 | Versioned format: 1 plain, 2 PDF bytes, 3 key, lyrics and cues, 4 measures and chord events, 5 parts and voicings, 6 phrases, 7 devices, bindings and hands. Bounded strict codec, preview and cancel, atomic validated import with fresh identities, export that refuses an incomplete package, and an unsupported version refused before activation. |
| AND-07 editor | #116, #118, #121, #125, #127, #128 and #129 | Song key, section lyrics and cues; measures with exact rational times and chord events with explicit chord-to-lyric links; the 88-key piano with the approved octave palette and exact two-hand voicings; prepared phrases (notes, rests, optional timing); independent parts, devices, hands and bindings with range rules and explicit reconciliation; compact grand staff with key signature; focused song sheet. Room version 6 with exported schemas and tested migrations. |
| CI | #105, #109, #110 | Node 26, parallel verification jobs behind the required `Verify ScoreMap` gate, cache reuse, fail-fast cancellation. |

## Product defaults taken without a product decision

These were chosen so the work could proceed unattended; the owner can change any of them.
- Devices and parts belong to one song (no library-wide presets); a song has one implicit arrangement.
- A new chord is placed after the last chord of its measure (default one beat); a lyric link is a character position.
- Middle C is written on the treble staff; the staff shows no stems or durations because none are known.
- Black piano keys are 34dp wide (white keys 48dp); pitches outside A0 to C8 stay valid performed pitches.
- A bind range is written like `C3-B4`; a trailing `!` accepts played notes the range leaves out, which are never changed.
- Chords not linked to a lyric position appear only in the chord loop of the song sheet.

## Not delivered (still open acceptance evidence)

AND-05 (#99)
- A retained recovery copy before migrating and a migration that fails halfway are not tested.
- Driving the system document picker itself is not tested (the bytes path below it is).

AND-06 (#100)
- Sharing and receiving packages through the system share sheet or a file picker; oversize handling at the operating-system boundary.
- A real exchange between two installations on two devices (only two independent in-process libraries were exercised).

AND-07 (#101)
- No local tablet run: Compose layout, touch behavior and rendering of the staff are checked only on the CI image.
- Staff: no stems, beams, durations, voices or key changes by design; keys beyond seven accidentals show no signature.
- Reusable device or sound presets, multiple arrangements per song, and MIDI or audio are out of scope or not built.
- Release upgrade and rollback refusal and release performance budgets (`verifyRelease` states them as pending).
- Signed release and update journey (needs signing credentials held outside Git).

Gates nobody has performed
- Independent review of the current head.
- Installation on the target tablet, accessibility on the device, playing-distance readability and musician acceptance.
  These remain unperformed gates; no emulator result stands in for them.
- The four native SBs have no native acceptance evidence yet; `verify:traceability` keeps them pending.

## Decisions for the owner
- `LIGHTHOUSE_AUTOMATION_ENABLED` and `LIGHTHOUSE_MAINTENANCE_ENABLED` were set to false while model tokens were out;
  restoring them is the owner's call.
- The aggregate CI job no longer re-runs `verifyHost` itself; the required gate waits for the Android host job on the
  same SHA instead (see `docs/evidence/bootstrap/infrastructure.md`).
- The product defaults above.
