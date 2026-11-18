<!-- pdac-scope: cited -->

## Product dependencies

<!-- pdac:cite id="SB-BACKUP-REJECT" digest="sha256:f6b3ca347fe8d7d709509474f84ae9b7d4ecfc01ac4a66c3af5de77c20784e5d" -->
<!-- pdac:cite id="SB-KEYBOARD" digest="sha256:cda070d024497257667b098a1cdd8841ea33ef5c1483ae5094a2370e6ea751a7" -->
<!-- pdac:cite id="SB-OFFLINE" digest="sha256:c8e62d06222a082c057240a58f14633bda2e04f4655a6a0beb6c1f54af7e7955" -->
<!-- pdac:cite id="SB-PERFORMANCE" digest="sha256:c004c86080428dd85d0c3b42ce24be640955fc52f3d9245f05db6e90e6344355" -->
<!-- pdac:cite id="SB-PERSIST-CONFLICT" digest="sha256:3a7fdc4b47da270a63bc50bf681af96793fb46a8283af9093b01d9959f026b37" -->
<!-- pdac:cite id="SB-PERSIST-FAILURE" digest="sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357" -->
<!-- pdac:cite id="SB-PERSIST-RECOVER" digest="sha256:3bb4bec701cf460455382daec1bd17f1e87e0a7f2f5cddc33e244a5b6287d9af" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="QR-INTEGRITY" digest="sha256:ab546fccd5704db577b5005460adc8c643dc6adb9173cf2ee750e7f1e6e0ae3e" -->
<!-- pdac:cite id="QR-OFFLINE" digest="sha256:a3c8b14e8eb2c0b1a419ec1a266cf50ff4d0b739936b2f6cf0c0cdfc7db38827" -->
<!-- pdac:cite id="QR-READABILITY" digest="sha256:fd18e2b171a6c15b68dc256acc88c7cf32f0376d723faf7a662a374ce49a9f5f" -->
<!-- pdac:cite id="UC-BACKUP" digest="sha256:e990e6964f53a63968975d1e12729cdb299fe31d99856efad9539ab4ecd8a6d8" -->
<!-- pdac:cite id="UC-CHORDS" digest="sha256:8824f28ac95b8a1f38fa68249fdf8e32441cfc3a4efa5b9e20ef10d81a392ae8" -->
<!-- pdac:cite id="UC-CONSULT" digest="sha256:d27ea53e1c307569b2fe941ea94eec4bb0e98e6478f2d947ec7123273f419562" -->
<!-- pdac:cite id="UC-OFFLINE" digest="sha256:1106de43fb4ae8be6f0841e7e806c92c3ee15b2050cfc56b74b3d35292aa1922" -->
<!-- pdac:cite id="UC-PERSIST" digest="sha256:11f7381952aca132adad468fc62c648341ccc68c29bdc3b805020ee0997c3d0b" -->

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
