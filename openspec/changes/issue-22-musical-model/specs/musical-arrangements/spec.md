## ADDED Requirements

<!-- pdac-scope: cited -->

### Requirement: Finite spelled harmony and independent performed pitches

The product MUST apply the accepted finite harmony catalogue, preserve degree spelling and represent exact performed notes separately from harmonic identity. Unsupported or contradictory data MUST refuse before mutation.

#### Scenario: Theoretical harmony with independent realization

- **GIVEN** C major-seventh harmony and an independent performed C2/G2/E4/B4 voicing
- **WHEN** one performed note changes octave through a valid guarded command
- **THEN** harmony remains C/E/G/B and only that identified performed note changes.

<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->

### Requirement: Identified form and scoped performed references

The product MUST retain stable section, measure, event, arrangement and part identities with exact valid timing and scoped references, refusing dangling assignments and unconfirmed destructive reconciliation.

#### Scenario: Reordering retains identities

- **GIVEN** a valid song with independent arrangements referencing its shared form
- **WHEN** a valid exact section permutation is committed
- **THEN** position alone changes while identities, content and valid performed assignments remain intact.

<!-- pdac:cite id="BR-STRUCTURE" digest="sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686" -->

### Requirement: Explicit atomic legacy migration and portable round trip

The product MUST preserve supported v1 source content and IDs, retain a pre-migration recovery copy and generated-ID mapping, validate the complete candidate and acknowledge only atomic activation. Unknown versions or failed activation MUST preserve the source and previous durable destination.

#### Scenario: Legacy migration

- **GIVEN** a populated valid v1 library and explicit migration/import confirmation
- **WHEN** its supported songs migrate and activation succeeds
- **THEN** the accepted deterministic quarter-note/default-arrangement mapping is retained without inventing performed notes, and reopen/export/import preserve complete content.

<!-- pdac:cite id="BR-BACKUP" digest="sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
