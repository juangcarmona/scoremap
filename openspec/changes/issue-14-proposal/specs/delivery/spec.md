<!-- pdac-scope: cited -->

## Product dependencies

<!-- pdac:cite id="SB-BACKUP-REJECT" digest="sha256:f6b3ca347fe8d7d709509474f84ae9b7d4ecfc01ac4a66c3af5de77c20784e5d" -->
<!-- pdac:cite id="SB-KEYBOARD" digest="sha256:cda070d024497257667b098a1cdd8841ea33ef5c1483ae5094a2370e6ea751a7" -->
<!-- pdac:cite id="SB-OFFLINE" digest="sha256:c8e62d06222a082c057240a58f14633bda2e04f4655a6a0beb6c1f54af7e7955" -->
<!-- pdac:cite id="SB-PERFORMANCE" digest="sha256:c004c86080428dd85d0c3b42ce24be640955fc52f3d9245f05db6e90e6344355" -->
<!-- pdac:cite id="SB-PERSIST-CONFLICT" digest="sha256:3a7fdc4b47da270a63bc50bf681af96793fb46a8283af9093b01d9959f026b37" -->
<!-- pdac:cite id="SB-PERSIST-FAILURE" digest="sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357" -->
<!-- pdac:cite id="SB-PERSIST-RECOVER" digest="sha256:3bb4bec701cf460455382daec1bd17f1e87e0a7f2f5cddc33e244a5b6287d9af" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:6e01f0285df7783f48eb0c482fa31f490f09e97e0f67a3a5fb3261dc1d1ed29c" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="QR-INTEGRITY" digest="sha256:efafc9b7b32a7ff39fdb822f04ef46def7c7534b84b2e48a606fce99bea603e6" -->
<!-- pdac:cite id="QR-OFFLINE" digest="sha256:a3c8b14e8eb2c0b1a419ec1a266cf50ff4d0b739936b2f6cf0c0cdfc7db38827" -->
<!-- pdac:cite id="QR-READABILITY" digest="sha256:7139af1523273cf318b98b0f01da8688627c1a747f656b10017dcd3f0424c4af" -->
<!-- pdac:cite id="UC-BACKUP" digest="sha256:ce5f43fc20dbe7e1482447d0334509c00460c28f84e33b3e8aacfcc2e4cbeb9a" -->
<!-- pdac:cite id="UC-CHORDS" digest="sha256:8824f28ac95b8a1f38fa68249fdf8e32441cfc3a4efa5b9e20ef10d81a392ae8" -->
<!-- pdac:cite id="UC-CONSULT" digest="sha256:d27ea53e1c307569b2fe941ea94eec4bb0e98e6478f2d947ec7123273f419562" -->
<!-- pdac:cite id="UC-OFFLINE" digest="sha256:1106de43fb4ae8be6f0841e7e806c92c3ee15b2050cfc56b74b3d35292aa1922" -->
<!-- pdac:cite id="UC-PERSIST" digest="sha256:ea669e891adfc7641a2cf80bd5cd198d3909ee2fd6424c505a7cf991314c602f" -->

## ADDED Requirements

### Requirement: Realize the accepted delivery behaviour

The implementation SHALL satisfy the cited product behaviours and governing invariants for this slice. This is a consumer projection of CHG-INITIAL; the ProductShape artifacts remain canonical.

#### Scenario: SB-BACKUP-REJECT

- **WHEN** The musician imports malformed, unsupported or inconsistent backup content
- **THEN** Import is refused before any replacement; The current library remains unchanged; The validation reason is visible

#### Scenario: SB-KEYBOARD

- **WHEN** The musician consults the visual keyboard
- **THEN** White keys follow C D E F G A B in each octave; Black keys occupy only C-sharp D-sharp F-sharp G-sharp A-sharp positions; Highlighted keys match the chord pitch classes in the displayed octaves; The chord label retains its root spelling

#### Scenario: SB-OFFLINE

- **WHEN** The musician reloads, opens a song, edits a note and saves
- **THEN** The application and complete sketch open without network access; The note is persisted and survives another reload; Chord references and repertoire navigation work

#### Scenario: SB-PERFORMANCE

- **WHEN** The musician enters performance mode
- **THEN** The title and complete sketch are immediately readable; Editing actions are unavailable; Mode switching changes no musical content

#### Scenario: SB-PERSIST-CONFLICT

- **WHEN** The other session attempts to save its older revision
- **THEN** The stale write is refused; The newer durable data is preserved; The conflict is visible and the older session can export its work

#### Scenario: SB-PERSIST-FAILURE

- **WHEN** The musician requests a save
- **THEN** A save failure is clearly shown without a success acknowledgement; The prior durable revision remains recoverable; The musician can retain or export unsaved work

#### Scenario: SB-PERSIST-RECOVER

- **WHEN** The musician reopens ScoreMap
- **THEN** The last acknowledged songs, repertoires, memberships and sketch content are recovered; Stable identities and order remain unchanged
