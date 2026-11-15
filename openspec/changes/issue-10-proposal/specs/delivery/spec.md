<!-- pdac-scope: cited -->

## Product dependencies

<!-- pdac:cite id="SB-OFFLINE" digest="sha256:40eef81b2f397f73f52df9d8a0892f678edfdbaeea5a485d6a16003086a24a26" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:f6e8a52fdb28d495f07304870d8d2bfa6c6e5adce7722d919ce64efca735c57e" -->
<!-- pdac:cite id="CON-PLATFORM" digest="sha256:ed4f4900b26c706198a0448376f26d57d0665462c5e77ac4dbadc04bb75e6bf5" -->
<!-- pdac:cite id="FR-OFFLINE" digest="sha256:68f558e306eea39e0a533194ce6429c4c97180f94aabca6bbb6ca6a174f9cb0f" -->
<!-- pdac:cite id="UC-OFFLINE" digest="sha256:7ad9b33e0b6a86443b7536a7436832cf916d2951d055a608d76fee0dabf2cee1" -->

## ADDED Requirements

### Requirement: Realize the accepted delivery behaviour

The implementation SHALL satisfy the cited product behaviours and governing invariants for this slice. This is a consumer projection of CHG-INITIAL; the ProductShape artifacts remain canonical.

#### Scenario: SB-OFFLINE

- **WHEN** The musician reloads, opens a song, edits a note and saves
- **THEN** The application and complete sketch open without network access; The note is persisted and survives another reload; Chord references and repertoire navigation work
