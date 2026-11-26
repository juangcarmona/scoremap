# ScoreMap Android design contract

Issue: #133. Authorities: [Lighthouse](DESIGN.md), [ScoreMap design process](scoremap-design-process.md), [performance direction](ideal-performance-view.md), [octave palette](piano-octave-colors.md), and QR-READABILITY. This adapter translates the installed `@juangcarmona/lighthouse-ui/tokens.css` into Compose. It does not replace the product model.

## Semantic mapping

| Lighthouse role | Compose role | Light / dark |
| --- | --- | --- |
| canvas | background | ice `#f8faff` / night `#0d0f17` |
| surface | surface | white / navy `#111b2b` |
| surface-muted, action-soft | surfaceVariant, primaryContainer | slate-light `#dce1eb` / slate `#26344b` |
| text | onSurface, onBackground | night / ice |
| text-muted | onSurfaceVariant | slate / muted `#aab6c9` |
| action, on-action | primary, onPrimary | blue-deep `#1f6fd1` + white / blue `#4da3ff` + night |
| border | outlineVariant | slate-light / slate |
| border-strong | outline | contrast-adjusted `#647188` / muted |
| focus | focused Material control state | primary; preserve visible keyboard focus |
| positive, positive-surface | acknowledged result banner | `#195c40`, `#e3f3e9` / `#96e4ad`, `#173e2b` |
| caution, caution-surface | mode refusal banner | `#765211`, `#fff2d7` / `#f8cf79`, `#473612` |
| negative, negative-surface | error, errorContainer | `#9a3434`, `#fce8e5` / `#ffb6ab`, `#492825` |
| font-sans | Material type scale / Android system sans | sp, respects system text size |
| font-mono | lyric/chord alignment only | no decorative technical styling |
| spacing / radii | dp rhythm / Shapes | multiples of 4dp, 6dp controls, 10dp panels |

Material behavior supplies Android interaction semantics. Colors are confined to `ScoreMapTheme.kt`; the music palette remains in the musical model. System light/dark is the default appearance choice. Wallpaper colors must not replace the declared palette. Staff paper remains white with black notation in both appearances. Keyboard surfaces remain recognizably black/white with the owner's octave colors for played notes. Musical colors communicate register, never hand or ownership alone.

## Composition and behavior

The library is a bounded 280dp navigation column at expanded widths (840dp and above). The selected song takes the remaining width; compact windows show the selected song alone. Songs and sets are explicit destinations. Each song has Music, Parts, PDFs, History and Song details task destinations. Music opens with lyrics, cues and chord summaries; section forms open on request. The focused performance sheet omits the library rail and global header and gives piano positions the available width. System Back exits the current sub-editor before the song workspace. Insets include status/navigation bars and the IME.

Use a clear type hierarchy, thin boundaries and quiet surfaces. Primary create/save actions use blue filled controls with restrained corners; navigation and secondary actions use text treatment. Fields and actions wrap at narrow widths and enlarged text rather than shrinking touch targets. Selection, refusal, save acknowledgement and unknown musical data must have text. Transient acknowledgement is announced through a polite live region.

Every essential interactive target is at least 48dp. Musical visualizations are not silently represented as touch controls; editable keys preserve geometry and bounded scrolling. Preserve local atomic storage outcomes, edit-mode admission and recovery. A confirmation must identify the content affected and retain a cancel path. Motion must respect system animation settings; no decorative motion is introduced.

## Evidence and acceptance

Use synthetic content and actual installed APKs. Retain source revision, APK digest, display dimensions, density, orientation, font scale and appearance with screenshots. Compare phone/tablet, light/dark and 200% text, exercise navigation, musical edits, refusal/cancel and storage results. Automated tests supplement actual visual inspection. TalkBack, external-keyboard operation, contrast measurements, physical-tablet musician readability and owner visual acceptance each require their own recorded evidence; a screenshot alone does not prove them.

Text scaling enlarges the key geometry and staff spacing with system font scale. The 88-key overview is a labelled, read-only orientation diagram. Save and Cancel remain outside the musical editor scroll area.

The native launch theme projects the same light/dark canvas before Compose starts and reuses ScoreMap's existing icon asset. Platform switches keep their native geometry; the nearly square rule applies to general application controls and containers.
