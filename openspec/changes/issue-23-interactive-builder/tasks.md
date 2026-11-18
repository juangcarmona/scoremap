<!-- pdac-scope: cited -->
<!-- pdac:cite id="FR-CHORDS" digest="sha256:4da1a2f14b722446609a1fca78c027c682d149ecbef18a835eb561f6050f1ae4" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->

# Tasks

- [x] Add exact-pitch piano geometry/labels and view-only range controls with component/domain checks.
- [x] Integrate draft, cancel/apply, octave/inversion, explicit candidate selection and conflict-safe undo into the actual song.
- [x] Add principal-owned versioned preset persistence and copied application semantics.
- [x] Execute real editor keyboard/pointer/touch journeys, complete durable comparisons, narrow/enlarged text and accessibility checks.
- [ ] Retain exact-source evidence; report independent review and deployment separately.

Executed candidate qualification: `npm run verify` passed (127 unit/component tests, 29 backend tests and real compiler refusals); all 23 anonymous browser journeys passed. Nine connected journeys passed, including the actual private octave edit and independent preset ownership/versioning; a tenth connected journey separately passed a lost-committed-response preset-import recovery after reload. Exact-source delivery receipts, independent review, native acceptance and deployment remain separate. Multi-keyboard configuration/consultation remains #24.
