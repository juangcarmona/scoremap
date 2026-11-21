---
id: QR-READABILITY
type: quality-requirement
title: Readable accessible exact-pitch preparation and consultation
status: draft
quality-attribute: usability
applies-to:
  - JRN-PREPARE-PERFORM
verification:
  - scenario-ref: SB-PERFORMANCE
  - scenario-ref: SB-KEYBOARD
  - scenario-ref: SB-NOTATION
  - scenario-ref: SB-NAVIGATION
  - scenario-ref: SB-VOICING
  - scenario: With several assigned keyboards in landscape tablet consultation, select a shared event by touch; retain simultaneously readable relevant keyboards with independent ranges, part labels and the same selected context.
  - scenario: With a narrow viewport and text enlarged to 200 percent, consult an arrangement; retain readable labels and operable controls without page-level horizontal overflow, using bounded keyboard scrolling or explicit view controls.
  - scenario: With the same valid performed-note edit available through pointer, touch and keyboard, complete each input-specific journey independently; obtain equivalent intended music and visible feedback with focus and accessible states preserved.
  - scenario: With overlapping equal-pitch layers, open consultation; identify each owning part without relying on color alone or merging their event identities.
  - scenario: With a played pitch outside the visible keyboard range, consult its event; identify the pitch, octave and owning part without fabricating an in-range played key or changing the music.
uses-terms:
  - TERM-MODE
  - TERM-CHORD
  - TERM-SECTION
  - TERM-ARRANGEMENT
  - TERM-VOICING
  - TERM-EVENT
---

## Requirement

The product MUST retain high contrast, restrained nearly square general components, clear structure, rapid song switching and touch targets at least 48 CSS pixels in the web realization and at least 48 density-independent pixels in native Android. Musical keyboard geometry MUST remain realistic rather than being distorted to fit general component proportions. Preparation and protected consultation MUST work on desktop, landscape touch tablet and narrow phone views, meet WCAG 2.2 AA and remain operable at 200 percent text enlargement.

The musician MUST be able to place and remove exact pitches through equivalent pointer, touch and keyboard actions without numerical pitch entry or internal notation syntax. Focus MUST be visible; controls and notes MUST expose meaningful accessible names and states. Each selected played pitch MUST have an individual pitch-and-octave label. Anglo-American, fixed-name Latin and dual-primary notation MUST be consistent across every musical and accessible label, without changing stored meaning.

Theoretical pitch-class references and exact performed notes MUST be distinguishable without color alone. The piano MUST preserve chromatic white/black positions, including no black key between E/F or B/C, in configurable two- or three-octave views. Multiple assigned keyboards MUST present their own ranges, part names and musical roles under one active section/occurrence/measure/event context. Silence MUST clear stale highlights; out-of-view notes MUST remain identifiable. Equal-pitch layers MUST retain visible ownership cues rather than suggesting only one performed event.

Relevant keyboards MUST be readable together in landscape tablet consultation. Narrow views MUST preserve key proportions using bounded keyboard scrolling or intentional view controls, not page overflow or unusable keys. Content MUST remain protected in performance mode regardless of available private editing capability. Loading, empty, saving, unsaved, conflict, validation and authorization-lock/failure states MUST be understandable without relying on color or describing unacknowledged work as remotely saved. No fixed application or evidence publication origin is required for readability qualification.

For native Android, preserve the same musical, contrast, input-equivalence, performance protection and accessible naming outcomes in actual Compose views. Native content needs no login or service acknowledgement; account-lock states apply only to private-service content. Qualify Android text scaling, TalkBack, focus/keyboard navigation, system insets and back navigation without obscuring essential musical controls. Browser CSS coordinates and browser-only automation cannot establish those native results.

## Measurement

Inspect actual rendered editor and consultation journeys on desktop, landscape touch-tablet and narrow viewports, recording the exact dimensions, text scale and source. Measure the existing minimum 48 CSS pixel touch targets and verify no page-level horizontal overflow at narrow width with 200 percent text. Deliberate bounded keyboard scrolling must leave controls reachable and note labels readable. Compare key positions against independently expected chromatic geometry, not a screenshot alone.

For native Android, inspect the actual installed candidate on declared tablet and narrow device configurations at normal and 200 percent font scale; record density, orientation, dimensions and source/artifact identity. Measure at least 48dp essential touch targets and readable exact pitch/part labels with reachable controls. Exercise TalkBack and external-keyboard focus/actions, system insets and back navigation. Compare actual Compose musical geometry/context against independently expected values, including silence, overlaps, repeats and out-of-view notes. Android accessibility checks supplement manual inspection and physical-tablet musician acceptance remains a separate unperformed gate until exercised.

Run WCAG 2.2 AA checks with automated analysis supplemented by manual keyboard, screen-reader, focus, contrast and touch inspection; automated absence of findings alone is insufficient. All applicable checks must conform, with zero inaccessible essential commands, unlabeled selected pitches or color-only meaning. Assert each notation mode and dual primary against independent spelled labels and verify music is unchanged by preference/view changes.

For all six arrangement scenarios compare actual selected context and displayed played pitches to independent expected values for each part/device. Include silence after a populated event, out-of-view pitches, repeats, removed selection and overlapping equal-pitch layers. A fourth assigned part/device must not be refused by a three-device domain cap; this is not an unlimited viewport or capacity promise. Verify pointer, touch and keyboard journeys separately and compare their intended results.

Retain exact source/run/commands, observable assertions, step screenshots, videos and useful redacted failure reports. The connected first checkpoint must use actual login and private save/reopen/logout plus refused roles through the shared file-driven manual/automated inputs, across desktop, touch-tablet and narrow views. Use synthetic content only. Missing configuration and authorization failure must have readable safe outcomes, not hidden bypasses. That evidence establishes only its exercised scope: authored criteria, rendered checks, real connected execution, independent assessment, physical-device acceptance, full later arrangements and production deployment remain distinct facts.
