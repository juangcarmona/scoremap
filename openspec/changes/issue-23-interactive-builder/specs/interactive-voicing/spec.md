<!-- pdac-scope: cited -->
<!-- pdac:cite id="FR-CHORDS" digest="sha256:4da1a2f14b722446609a1fca78c027c682d149ecbef18a835eb561f6050f1ae4" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->

## ADDED Requirements

### Requirement: Exact performed notes remain separate from harmonic theory
The builder MUST edit individual spelled pitches with consistent octaves and absolute pitch while preserving the identified event, timing, bindings and other parts. Theoretical markers MUST remain distinguishable from performed keys. View changes MUST retain off-screen pitches and change no content.

#### Scenario: One octave edit
- **GIVEN** C major-seventh and independent C2/G2/E4/B4 performance
- **WHEN** the musician previews and applies one valid octave increase to B4
- **THEN** only the identified B4 occurrence becomes B5 and the complete acknowledged song retains its other musical data.

### Requirement: Explicit reversible interaction
The builder MUST provide cancel, guarded apply and conflict-aware undo; identification MUST show ambiguity or unknown without automatically rewriting harmony or performed notes.

#### Scenario: Cancel preview
- **GIVEN** acknowledged music and an uncommitted played-note draft
- **WHEN** the musician cancels
- **THEN** the original content remains without a new content revision.

### Requirement: Independently owned copied presets
Named presets MUST have independent owner scope and acknowledged versions. Applying a preset MUST copy content/version provenance; later edits or deletion MUST NOT alter already prepared arrangements.

#### Scenario: Update a reused preset
- **GIVEN** a versioned preset copied into two song events
- **WHEN** its owner acknowledges a new preset version
- **THEN** both song copies retain their existing pitches and provenance until explicitly changed.
