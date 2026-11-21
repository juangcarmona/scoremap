<!-- pdac-scope: cited -->

# Android engineering foundation

## ADDED Requirements

### Requirement: Isolate the native build and retain canonical authorities

The foundation SHALL place its independently invokable build under `src/android`, retaining root ProductShape/OpenSpec/ArcShape authorities and existing implementations.

<!-- pdac:cite id="CON-PLATFORM" digest="sha256:635e50e18ab13a558ff7fb34323fb9c54c651858935b841272e22ce860067fbb" -->
<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:a2cd6293106ac4e7a464b7ded96b8670d1de7480624260ba8c49a1400dbc824d" -->

#### Scenario: Bootstrap a new client without moving the old application

- **WHEN** the Android foundation is introduced
- **THEN** its Gradle build runs independently and canonical product/architecture sources remain at their existing paths

### Requirement: Admit changed musician behavior through Product Change

Delivery SHALL require an overlay-validated, approved and applied Product Change before implementing native local authority or additive song/set import.

<!-- pdac:cite id="FR-PERSIST" digest="sha256:5f901e669e39923921cd1d28302b3f308460a72bda3bce53d83ffa7255934cd4" -->
<!-- pdac:cite id="FR-BACKUP" digest="sha256:26a789dde39b92764b10fe30b3840c614626a63d96a933bae0a87322cac9f066" -->

#### Scenario: Plan before product application

- **WHEN** a task implements those changes without their applied Product Change
- **THEN** delivery admission refuses the changed behavior and retains the accepted baseline

### Requirement: Enforce the reviewed dependency and visibility graph

The foundation SHALL enforce section 05/10 dependencies and rule IDs with allowed/forbidden fixtures, evaluated references and compiled checks. Compilation-based rules SHALL prove actual rejection.

<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->

#### Scenario: New module attempts to bypass quality conventions

- **WHEN** a fixture introduces a production module without its convention or an unused forbidden project dependency
- **THEN** the root verifier fails with the violated rule and remediation

#### Scenario: Presentation bypasses application admission

- **WHEN** a fixture introduces a ViewModel/Activity shortcut to a DAO or storage port, or a nested adapter-entity API leak
- **THEN** verification rejects it even when the Kotlin source compiles

### Requirement: Derive musical TDD from accepted transitions

Slices SHALL record meaningful red/green/refactor evidence for the selected accepted transitions and preservation outcomes.

<!-- pdac:cite id="LC-STRUCTURE" digest="sha256:31caaa7320486ab3a837e8b0f3ac2b14f6e5623b664f131cb85af1ce030a24ef" -->
<!-- pdac:cite id="SB-SECTION-REORDER" digest="sha256:610413c7eae977e5760aa413f58ec499375fdafe0952dca8cbc7591cbda639e5" -->

#### Scenario: Section reorder preserves the complete association graph

- **WHEN** a slice reorders two differently populated synthetic sections
- **THEN** independently expected identities, music and repeats remain associated with their original sections

### Requirement: Test native durability at the actual storage boundary

Room/device qualification SHALL prove transaction failure preserves the prior complete revision and cannot produce a success acknowledgement.

<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="SB-PERSIST-FAILURE" digest="sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357" -->

#### Scenario: A failed save cannot report success

- **WHEN** qualification injects a transaction failure after editing synthetic music
- **THEN** the prior revision remains recoverable and the candidate is not acknowledged as saved

### Requirement: Keep device acceptance distinct from automation

Release acceptance SHALL record physical-tablet musician use separately from host/emulator results and source review.

<!-- pdac:cite id="QR-READABILITY" digest="sha256:fd18e2b171a6c15b68dc256acc88c7cf32f0376d723faf7a662a374ce49a9f5f" -->

#### Scenario: Automated tests pass without a physical trial

- **WHEN** host and emulator tests pass but no musician has exercised the tablet
- **THEN** physical-device acceptance remains unperformed

### Requirement: Include Android checks in actual integration admission

The required CI result SHALL include applicable host/device checks and sanitized evidence. Missing/skipped suites, disabled rules and zero-test execution SHALL fail their gates.

<!-- pdac:cite id="CON-CONTENT" digest="sha256:5c08415cc8047dfc3161440d4a427675c191cd7bfecef5d3c7bb139fe0a9752e" -->
<!-- pdac:cite id="QR-INTEGRITY" digest="sha256:ab546fccd5704db577b5005460adc8c643dc6adb9173cf2ee750e7f1e6e0ae3e" -->

#### Scenario: Checks are omitted from an apparently green pipeline

- **WHEN** an injected fixture skips required device qualification or removes a required architecture task
- **THEN** the final required result fails
