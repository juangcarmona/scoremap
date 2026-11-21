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

<!-- pdac:cite id="BR-BACKUP" digest="sha256:6e01f0285df7783f48eb0c482fa31f490f09e97e0f67a3a5fb3261dc1d1ed29c" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
