## ADDED Requirements

<!-- pdac-scope: cited -->

### Requirement: Consistent spelling-preserving notation

The product MUST render Anglo-American, fixed-name Latin and dual notation with either primary across every current musical surface, preserving spelling, octave, quality and all stored musical content.

#### Scenario: Presentation-only change

- **GIVEN** an existing C-sharp minor or D-flat major current-format song
- **WHEN** the musician switches among all notation choices during editing or performance
- **THEN** selectors, chord symbols, keyboard captions and accessible labels use that choice while the complete musical library and revision remain unchanged.

<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->

### Requirement: Separate principal and anonymous preference acknowledgement

The product MUST keep anonymous device preference separate from each authenticated principal's independently acknowledged preference, refuse stale/invalid changes and display pending or failure without claiming a musical save.

#### Scenario: Account persistence and isolation

- **GIVEN** independent signed-in principals and an anonymous device preference
- **WHEN** one principal acknowledges a notation change and signs in in a clean browser
- **THEN** only that principal's choice is recovered and other preferences and music remain unchanged.

<!-- pdac:cite id="BR-ACCESS" digest="sha256:9b679c2f86bdff7fc86ae00f0669e3a76023c3579895249dd21bbb3d617494a9" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->

#### Scenario: Failed preference save

- **GIVEN** a valid displayed preference candidate whose server acknowledgement fails
- **WHEN** the musician observes the result or explicitly retries
- **THEN** the UI reports the pending/error state, preserves the previous durable preference and music, and uses the stable command identity for reconciliation.
