# Epic 92: native planning concepts

These five screens are a disposable **static planning proposal**, rendered by a real Android emulator from a small standalone Jetpack Compose / Material 3 app (`com.scoremap.planning92`). They are not ScoreMap implementation, feature acceptance, usable storage or file exchange. Buttons and fields have inert handlers. All music and file names are synthetic.

The accepted design references remain authoritative: `docs/design/ideal-performance-reference.png`, `docs/design/song-performance/editor-88-partitura-compacta.png`, `docs/design/DESIGN.md`, and the exact octave palette in `docs/design/piano-octave-colors.md`. The proposal follows the installed Impeccable Android guide; it does not replace ProductShape, ArcShape or the accepted eight-stage implementation scope.

## Captures

- `01-phone-library.png`: empty local library, Songs/Sets tabs, separate Create song and Import actions, Edit mode on.
- `02-tablet-editor.png`: The Quiet Atlas; Stage keys/Synth/Aux; unsaved changes and Save; authored LH C3 G3 / RH E4 G4 C5; 88-key overview plus expanded keyboard and pitch-only staff. Timing is not set.
- `03-tablet-protected-consultation.png`: continuous protected musical sheet, no sidebar, Verse repeat 2×; Cmaj7 / Am7 / Dm7 / G7 with explicitly authored pitches. Colours identify scientific octaves; independent text identifies hands.
- `04-phone-import-preview.png`: Friday Rehearsal, four songs and one owned PDF; independent editable copies, existing music unchanged; Cancel / Import copies.
- `05-phone-import-error.png`: unreadable synthetic file; library is unchanged; Try again / Cancel.

Phone display: 390×844 dp/pixels. Tablet display: 1280×800 dp/pixels. Density override 160dpi, font scale 1.0, light theme, system sans-serif/Roboto. These are full-display screenshots, including actual Android status/navigation/taskbar insets. Layout uses Compose Scaffold/window insets. Capture command: `adb exec-out screencap -p`; startup waits for the activity and settles before capture. The PNG files have not been composited or retouched.

## Reproduction and limits

Pins and source/capture SHA256 values are in `capture-manifest.json`. The provided source is standalone planning code. `app.build.gradle.kts` omits only the private render fixture's external debug-signing override; Android's normal disposable debug signing can be used for a separate reproduction. No key or APK is published. Captures were built with AGP builtin Kotlin, not `org.jetbrains.kotlin.android`.

No persistence/import/export/PDF rendering/MIDI/audio or production navigation is implemented here. No interaction, TalkBack, contrast, font scaling, responsive-device coverage, physical-tablet acceptance or native test-suite pass is claimed. Small piano keys are static note visualizations, not qualified touch targets. Real implementation still requires independent architecture, behavioral, accessibility and device verification. Review and acceptance of these concepts belong to the parent reviewer/owner.

Capture provenance: the first four screens retain their original APK/source hashes; only the error screen was recaptured after a one-line grammar correction to “Your library is unchanged”. `captureBuilds` and each capture’s `buildId` record the distinction. Published source contains that final correction.
