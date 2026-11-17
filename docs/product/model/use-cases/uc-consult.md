---
id: UC-CONSULT
type: use-case
title: Consult synchronized performed arrangements safely
status: draft
primary-actor: ACT-MUSICIAN
bounded-context: BC-SKETCH
governed-by:
  - BR-EDIT-GUARD
  - BR-STRUCTURE
  - BR-CHORDS
  - BR-ACCESS
  - BR-SESSION
  - BR-DURABILITY
uses-terms:
  - TERM-MODE
  - TERM-SONG
  - TERM-SECTION
  - TERM-EVENT
  - TERM-ARRANGEMENT
  - TERM-VOICING
  - TERM-PRINCIPAL
---

## Goal

Read and navigate a prepared song and its independently performed parts quickly, with all relevant keyboard views synchronized to one musical moment and musical content protected against accidental change.

## Trigger

The musician deliberately enters performance consultation, opens an authorized song/arrangement or selects another section, repeat occurrence, measure or event.

## Preconditions

The selected content is readable and existing identities resolve. Anonymous content may be consulted locally without private sign-in. Private consultation requires current resource-scoped read capability under BR-SESSION; neither performance mode nor an editing role creates authority. The first private checkpoint requires connectivity and does not enable persistent private offline access. Later qualified offline consultation requires proven protection and an unexpired lease for the specific resources and permissions.

## Main Flow

1. The musician opens the intended song and arrangement and deliberately enters protected performance mode. Switching mode changes no musical content and creates no content revision.
2. The product shows title, ordered sections, repeats, harmonic sequence and personal reminders with the musician's notation preference, plus the independent performed parts and assigned keyboard views.
3. The musician selects one section/occurrence/measure/event context. Every relevant keyboard shows that same context while preserving its own physical/view range, part names and musical roles. Repeated occurrences reference the same stored content rather than duplicate events.
4. Each view shows only its assigned parts' exact played pitches and octaves for that context, separately from theoretical harmonic references. A silent part clears its previous played highlights; equal-pitch layers remain attributable to their separate parts. Outside-view pitches remain identifiable without fabricated keys, transposition or loss.
5. The musician navigates by pointer, touch or keyboard with equivalent results, visible focus and meaningful accessible names/states. Relevant keyboards remain readable together on landscape tablet; narrow views use bounded scrolling or explicit view controls without distorted geometry or page overflow.
6. The product continues enforcing the independent performance guard and private read/session boundary. Navigation does not save music, renew private authority or replay pending writes.

## Alternative Flows

- Empty form, empty event sequences and silent parts have clear empty/silent results rather than invented chords or stale highlights.
- Changing notation or dual primary updates musical and accessible labels without rewriting music; personal preference acknowledgement remains distinct from a song save. Changing visible keyboard range likewise does not change performed pitches.
- If an acknowledged authorized update removes the selected event, clear its invalid selection and highlights, state that it is unavailable and allow valid reselection without a content mutation. Never silently select a different event under the deleted identity.
- The musician deliberately returns to edit mode without a content mutation. Any subsequent content command must separately pass current write capability, edit admission, full validity and expected revision; a viewer cannot gain write capability by switching modes.
- Navigation and permitted remembered page position remain allowed in performance mode. Optional attachment capability and external reference availability retain their independent boundaries; consultation does not deliver an unsupported renderer or offline external target.
- On retained anonymous content, consultation remains available offline. Later qualified private access may continue only within its protected resource/capability lease; it remains distinct from service acknowledgement.

## Failure Conditions

All musical creation, update, deletion and import commands MUST refuse in performance mode, including indirect paths, even for a current owner/editor. Refusal preserves content, bindings and acknowledged revisions and performs no lifecycle transition.

Unknown or inaccessible song/child identities expose no private content. Expiry, unknown authority and observed revocation/disablement lock private views and usable plaintext under BR-SESSION. Retain pending work only as protected principal-bound recovery data; reconnect requires fresh online resource checks before private exposure, export or any explicit reconciliation. No instantaneous unobserved offline revocation, cross-account access or automatic replay is promised. Loading, conflict and authorization failures must remain intelligible without presenting pending work as remotely saved.

## Postconditions

Every relevant view presents the same selected context and only its assigned actual pitches with clear part ownership, notation, silence and out-of-view indications. Musical identities, timing, order and bindings are unchanged by consultation, mode switching and view selection. Session mode, navigation context and save status remain distinct from library presence, structure presence and song retention. Authored consultation requirements do not establish measured accessibility, connected execution, physical-device acceptance or deployment.
