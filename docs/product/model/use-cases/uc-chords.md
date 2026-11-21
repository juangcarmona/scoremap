---
id: UC-CHORDS
type: use-case
title: Prepare spelled harmony and exact performed pitches
status: draft
primary-actor: ACT-MUSICIAN
bounded-context: BC-SKETCH
governed-by:
  - BR-CHORDS
  - BR-EDIT-GUARD
  - BR-STRUCTURE
  - BR-IDENTITY
  - BR-DURABILITY
  - BR-ACCESS
  - BR-SESSION
uses-terms:
  - TERM-CHORD
  - TERM-SECTION
  - TERM-SONG
  - TERM-EVENT
  - TERM-VOICING
  - TERM-ARRANGEMENT
  - TERM-PRINCIPAL
---

## Goal

Prepare an identified harmonic sequence and independent performed voicings in the real song editor, seeing accurate theoretical spelling and exact played pitches without confusing harmony, register or display language. Existing major/minor preparation remains valid within the bounded catalogue.

## Trigger

The musician selects a song section/measure and requests harmonic preparation, opens an existing event's integrated builder, or requests a notation or voicing action. Each action has its own admission and result; this is not a requirement to execute every alternative in one command.

## Preconditions

The relevant content is readable and selected identities resolve. Private viewing requires current scoped read authority under BR-SESSION. A musical mutation additionally requires current scoped write capability, edit admission, complete valid values/references and the expected revision at its declared commit boundary. Principal-owned preset/preference actions require authority for that personal resource, not merely a song grant. Empty songs and empty sequences are valid starting points, but event creation requires valid identified form.

## Main Flow

1. The musician selects the intended section, measure and harmonic event or requests a new event at a valid explicit musical position and duration. The editor identifies the active arrangement and performed part separately from shared harmonic form.
2. The musician chooses spelled root, catalogue quality/extension and compatible alterations, with optional explicit slash bass. The product immediately previews independently meaningful theoretical notes and pitch classes; C major-seventh shows C/E/G/B. Root spelling and derived degree accidentals remain distinct from enharmonic pitch equivalence.
3. The musician chooses exact performed pitches by adding/removing keys or changing individual octave/register in the integrated piano. The product labels each played pitch and distinguishes it from theoretical reference highlights. Pointer, touch and keyboard actions have equivalent outcomes without requiring internal syntax or numerical pitch entry.
4. The musician reviews the preview. Voicing, inversion and octave changes preserve harmonic identity unless the musician explicitly requests a harmonic change. Existing event identity, timing, owning part and bindings remain stable unless deliberately edited. Shared harmonic changes remain song-form edits affecting referencing arrangements under BR-STRUCTURE.
5. For a requested musical commit, the product enforces current capability, edit guard, complete musical/reference validity and expected revision independently. It commits only the declared complete boundary and reports success after its durable acknowledgement. A private song commit does not claim separately pending personal-resource changes were acknowledged.
6. The editor presents the actual acknowledgement alongside any newer draft, without allowing an older response to overwrite it. All unaffected parts, arrangements, bindings and personal resources retain their prior meaning and identity.

## Alternative Flows

- The musician changes Anglo-American, fixed-name Latin or dual-primary notation. All musical and accessible labels update consistently; only the separately owned preference changes. Apply the documented anonymous/authenticated preference precedence without rewriting music or another principal's preference.
- The musician changes the visible two- or three-octave range/position. Geometry and labels update while all performed pitches remain unchanged; outside-view notes stay identifiable. Physical assignment validity is separate from viewport choice.
- The musician requests inversion or an alternative voicing. Preview the intended exact pitches, preserving harmonic identity and event associations; commit only if bounds and physical assignments remain valid.
- Incompatible manual tones require explicit reconciliation before commit, such as a deliberately retained custom voicing. Candidate identification offers supported alternatives or an honest ambiguous/unknown state. Only explicit selection of a candidate changes harmonic identity.
- The musician names a reusable custom voicing or applies a permitted preset version. The personal preset is independently owned and acknowledged; application copies content/version provenance into the arrangement. Later preset changes/deletion cannot silently change that copy.
- Cancel restores the pre-edit state without a musical commit. Undo of an eligible reversible edit restores the intended prior content through the applicable admission/acknowledgement boundary, without erasing intervening acknowledged history.

## Failure Conditions

Unknown identities, unsupported qualities/symbols, contradictory alterations, inconsistent pitch spelling/octave, out-of-bound pitches, invalid timing and dangling or excluded assignments MUST refuse without coerced harmony, clipped notes or partial durable changes. Performance mode refuses musical mutation independently of private role. A viewer or revoked principal cannot gain write authority through the builder.

Stale revisions refuse rather than overwrite; transaction failure preserves prior acknowledgement and recoverable work. An ambiguous response remains unconfirmed until receipt reconciliation and cannot justify duplicate replay. Session expiry or unknown authority locks private content and retains only protected principal-bound pending work; recovery requires same-principal reauthentication and current online permissions/revision checks. No forced plaintext export or cross-account recovery is implied. Anonymous work remains separate.

## Postconditions

The requested preview, presentation change or acknowledged musical edit is observable with accurate spelling and played octaves. Only deliberately edited content changes. Stable event/time/part references and independent arrangements remain intact; cancelled/refused/failed operations create no false success or lifecycle transition. Navigation, view range, notation and save status are not musical publishing states. The use case introduces no audio, hardware control, transcription or other-instrument visualizer.

## Full-range chord preparation and notation

The musician can see the standard 88-key extent A0 through C8 and choose a legible, touch-operable enlarged range anywhere within it. The overview and enlarged range preserve exact pitch and octave, including partial end octaves; changing range never changes stored notes. The musician chooses left or right hand and selects or removes actual keys, reviews both hands together, and explicitly saves or cancels. Each hand retains its separate ownership and notes outside the current viewport remain identifiable. Existing separately assigned parts and their independent authorization and commit boundaries continue to apply.

A compact grand staff beside the enlarged keyboard immediately shows the selected exact notes, the appropriate clefs and the song's known key signature; distinguish hands and show necessary accidentals and ledger lines or explicit octave indicators accurately. Octave color follows the approved reference in both score and piano and is supplemented by note and hand labels. Do not imply rhythm or a key signature that the musician has not supplied. The selected chord does not consume a full-width empty staff.

The musician may prepare a melodic passage as an ordered sequence of exact piano notes and, where known, explicit durations and rests for its hand or part. They can review, edit, save or cancel the sequence under the same guarded and acknowledged boundary; missing timing is not invented. The synchronized score-and-piano reference can subsequently locate each prepared note.
