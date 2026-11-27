# Android design evidence · issue #133

Actual Compose application captured with Android UiAutomation.takeScreenshot; original PNG pixels are retained without crops, recoloring or compositing. Synthetic local Room data only. Source: `13d4a45441a9af5505528e2d2e62a10cee874331`. See [manifest](manifest.json) for APK, source tree and individual PNG digests.

## Profiles

One Android 17 / API 37 x86_64 AVD, Pixel Tablet hardware profile. Tablet: 2560×1600, density 276, landscape. Compact phone viewport: 1080×2340, density 440, portrait, configured with Android wm. These are emulator viewports, not physical-device qualification. Appearance follows the Android system setting. `200` means system font_scale=2.0; remaining profiles use 1.0. The same locally debug-signed APK and test APK produced every capture.

## Journeys

| Capture | What to review |
| --- | --- |
| 01 | Empty library and primary create action |
| 02 | Populated library with synthetic song titles |
| 03 | Music-first workspace, section hierarchy and task navigation |
| 04 | Protected consultation, key, lyrics and performed-note switch |
| 05 | Authored two-hand piano, octave colors, explicit hand/pitch labels and pinned save/cancel |
| 06 | Validation feedback, with readable text as well as color |
| 07 | Destructive confirmation and cancellation |
| 08 | Range-exclusion decision preserving exact authored pitches |
| 09 | Read-only performed piano after bounded scrolling, including large-text compact view |

The journey also asserts explicit accessible names for the mode and performed-note switches. The journey asserts minimum 48dp key/action targets, key visibility, noninteractive consultation and unchanged content after cancellation. Source-bound instrumentation logs accompany each profile. Text and piano geometry scale together; pianos intentionally support bounded horizontal scrolling.

## Gallery

### tablet-light

<details><summary>01-empty-library</summary>

![tablet-light 01-empty-library](tablet-light/01-empty-library.png)

</details>

<details><summary>02-populated-library</summary>

![tablet-light 02-populated-library](tablet-light/02-populated-library.png)

</details>

<details><summary>03-song-workspace</summary>

![tablet-light 03-song-workspace](tablet-light/03-song-workspace.png)

</details>

<details><summary>04-protected-song-sheet</summary>

![tablet-light 04-protected-song-sheet](tablet-light/04-protected-song-sheet.png)

</details>

<details><summary>05-two-hand-editor</summary>

![tablet-light 05-two-hand-editor](tablet-light/05-two-hand-editor.png)

</details>

<details><summary>06-validation-feedback</summary>

![tablet-light 06-validation-feedback](tablet-light/06-validation-feedback.png)

</details>

<details><summary>07-delete-confirmation</summary>

![tablet-light 07-delete-confirmation](tablet-light/07-delete-confirmation.png)

</details>

<details><summary>08-range-confirmation</summary>

![tablet-light 08-range-confirmation](tablet-light/08-range-confirmation.png)

</details>

<details><summary>09-consultation-piano</summary>

![tablet-light 09-consultation-piano](tablet-light/09-consultation-piano.png)

</details>

### tablet-dark

<details><summary>01-empty-library</summary>

![tablet-dark 01-empty-library](tablet-dark/01-empty-library.png)

</details>

<details><summary>02-populated-library</summary>

![tablet-dark 02-populated-library](tablet-dark/02-populated-library.png)

</details>

<details><summary>03-song-workspace</summary>

![tablet-dark 03-song-workspace](tablet-dark/03-song-workspace.png)

</details>

<details><summary>04-protected-song-sheet</summary>

![tablet-dark 04-protected-song-sheet](tablet-dark/04-protected-song-sheet.png)

</details>

<details><summary>05-two-hand-editor</summary>

![tablet-dark 05-two-hand-editor](tablet-dark/05-two-hand-editor.png)

</details>

<details><summary>06-validation-feedback</summary>

![tablet-dark 06-validation-feedback](tablet-dark/06-validation-feedback.png)

</details>

<details><summary>07-delete-confirmation</summary>

![tablet-dark 07-delete-confirmation](tablet-dark/07-delete-confirmation.png)

</details>

<details><summary>08-range-confirmation</summary>

![tablet-dark 08-range-confirmation](tablet-dark/08-range-confirmation.png)

</details>

<details><summary>09-consultation-piano</summary>

![tablet-dark 09-consultation-piano](tablet-dark/09-consultation-piano.png)

</details>

### tablet-dark-200

<details><summary>01-empty-library</summary>

![tablet-dark-200 01-empty-library](tablet-dark-200/01-empty-library.png)

</details>

<details><summary>02-populated-library</summary>

![tablet-dark-200 02-populated-library](tablet-dark-200/02-populated-library.png)

</details>

<details><summary>03-song-workspace</summary>

![tablet-dark-200 03-song-workspace](tablet-dark-200/03-song-workspace.png)

</details>

<details><summary>04-protected-song-sheet</summary>

![tablet-dark-200 04-protected-song-sheet](tablet-dark-200/04-protected-song-sheet.png)

</details>

<details><summary>05-two-hand-editor</summary>

![tablet-dark-200 05-two-hand-editor](tablet-dark-200/05-two-hand-editor.png)

</details>

<details><summary>06-validation-feedback</summary>

![tablet-dark-200 06-validation-feedback](tablet-dark-200/06-validation-feedback.png)

</details>

<details><summary>07-delete-confirmation</summary>

![tablet-dark-200 07-delete-confirmation](tablet-dark-200/07-delete-confirmation.png)

</details>

<details><summary>08-range-confirmation</summary>

![tablet-dark-200 08-range-confirmation](tablet-dark-200/08-range-confirmation.png)

</details>

<details><summary>09-consultation-piano</summary>

![tablet-dark-200 09-consultation-piano](tablet-dark-200/09-consultation-piano.png)

</details>

### phone-light

<details><summary>01-empty-library</summary>

![phone-light 01-empty-library](phone-light/01-empty-library.png)

</details>

<details><summary>02-populated-library</summary>

![phone-light 02-populated-library](phone-light/02-populated-library.png)

</details>

<details><summary>03-song-workspace</summary>

![phone-light 03-song-workspace](phone-light/03-song-workspace.png)

</details>

<details><summary>04-protected-song-sheet</summary>

![phone-light 04-protected-song-sheet](phone-light/04-protected-song-sheet.png)

</details>

<details><summary>05-two-hand-editor</summary>

![phone-light 05-two-hand-editor](phone-light/05-two-hand-editor.png)

</details>

<details><summary>06-validation-feedback</summary>

![phone-light 06-validation-feedback](phone-light/06-validation-feedback.png)

</details>

<details><summary>07-delete-confirmation</summary>

![phone-light 07-delete-confirmation](phone-light/07-delete-confirmation.png)

</details>

<details><summary>08-range-confirmation</summary>

![phone-light 08-range-confirmation](phone-light/08-range-confirmation.png)

</details>

<details><summary>09-consultation-piano</summary>

![phone-light 09-consultation-piano](phone-light/09-consultation-piano.png)

</details>

### phone-dark

<details><summary>01-empty-library</summary>

![phone-dark 01-empty-library](phone-dark/01-empty-library.png)

</details>

<details><summary>02-populated-library</summary>

![phone-dark 02-populated-library](phone-dark/02-populated-library.png)

</details>

<details><summary>03-song-workspace</summary>

![phone-dark 03-song-workspace](phone-dark/03-song-workspace.png)

</details>

<details><summary>04-protected-song-sheet</summary>

![phone-dark 04-protected-song-sheet](phone-dark/04-protected-song-sheet.png)

</details>

<details><summary>05-two-hand-editor</summary>

![phone-dark 05-two-hand-editor](phone-dark/05-two-hand-editor.png)

</details>

<details><summary>06-validation-feedback</summary>

![phone-dark 06-validation-feedback](phone-dark/06-validation-feedback.png)

</details>

<details><summary>07-delete-confirmation</summary>

![phone-dark 07-delete-confirmation](phone-dark/07-delete-confirmation.png)

</details>

<details><summary>08-range-confirmation</summary>

![phone-dark 08-range-confirmation](phone-dark/08-range-confirmation.png)

</details>

<details><summary>09-consultation-piano</summary>

![phone-dark 09-consultation-piano](phone-dark/09-consultation-piano.png)

</details>

### phone-dark-200

<details><summary>01-empty-library</summary>

![phone-dark-200 01-empty-library](phone-dark-200/01-empty-library.png)

</details>

<details><summary>02-populated-library</summary>

![phone-dark-200 02-populated-library](phone-dark-200/02-populated-library.png)

</details>

<details><summary>03-song-workspace</summary>

![phone-dark-200 03-song-workspace](phone-dark-200/03-song-workspace.png)

</details>

<details><summary>04-protected-song-sheet</summary>

![phone-dark-200 04-protected-song-sheet](phone-dark-200/04-protected-song-sheet.png)

</details>

<details><summary>05-two-hand-editor</summary>

![phone-dark-200 05-two-hand-editor](phone-dark-200/05-two-hand-editor.png)

</details>

<details><summary>06-validation-feedback</summary>

![phone-dark-200 06-validation-feedback](phone-dark-200/06-validation-feedback.png)

</details>

<details><summary>07-delete-confirmation</summary>

![phone-dark-200 07-delete-confirmation](phone-dark-200/07-delete-confirmation.png)

</details>

<details><summary>08-range-confirmation</summary>

![phone-dark-200 08-range-confirmation](phone-dark-200/08-range-confirmation.png)

</details>

<details><summary>09-consultation-piano</summary>

![phone-dark-200 09-consultation-piano](phone-dark-200/09-consultation-piano.png)

</details>

## Review and limits

Authored implementation and visual self-review are by the same agent. Inspected representative originals for hierarchy, light/dark mapping, piano geometry, text scaling, confirmation fit and selection contrast. This review found and corrected the overlapping consultation switch label at 200% and the selected/dialog contrast roles. No independent review or owner visual acceptance is asserted.

[Contrast measurements](contrast.json) cover 30 declared theme and octave-label pairs, minimum 4.68:1. This is not whole-screen WCAG certification. TalkBack, external keyboard, physical-tablet musician readability and owner acceptance remain separate, unexecuted qualifications. The native suite and repository verification are recorded with their actual execution logs; screenshots alone do not prove persistence or admission semantics.

No release or production deployment is claimed. Import/export capability remains limited to the existing implementation; no missing native transfer capability is represented by a fabricated screenshot.

## Final-source execution

Full repository verification passed; native instrumentation passed all 38 tests on the installed APK. Browser E2E passed 48 tests earlier in the cycle with unchanged browser source. [Execution receipt and log digests](execution.json). A cold online dependency resolution also passed after an earlier GitHub plugin-download failure. GitHub current-head results remain a separate gate.
