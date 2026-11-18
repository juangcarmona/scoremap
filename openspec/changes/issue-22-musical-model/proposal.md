<!-- pdac-scope: cited -->
# Identified musical form and performed arrangements

## Why
Current sections store unidentified triad arrays. The accepted product requires identified measures/events and exact performed pitches independent of harmony and physical assignments, while keeping existing music recoverable.

## What Changes
- A finite catalogue derived from accepted BR-CHORDS and a pinned Tonal adapter for spelled theoretical notes and explicit ambiguous/unknown identification.
- Version-2 songs with identified measures/harmonic occurrences, independent arrangements/parts/performed notes, voicings and binding references.
- Explicit per-song migration and v1 import migration with original recovery copies, generated-ID mappings and acknowledged atomic activation. Mixed legacy and upgraded songs remain readable; unrequested other-song migration is avoided.
- Existing editor integration and versioned backup round trips; unsupported versions and attachments remain refused intact.

## Capabilities
### New Capabilities
- `musical-arrangements`: identified form, exact performed content and safe legacy migration.
### Modified Capabilities
- Existing song/section/chord preparation consumes the same guarded domain boundary.

## Impact
Library and shared music domain/validation, compatibility UI, IndexedDB/private adapters and .NET validation/persistence, portable envelopes, targeted tests and architecture/evidence. Chord Builder and multi-keyboard UI follow their existing children.

<!-- pdac:cite id="FR-CHORDS" digest="sha256:4da1a2f14b722446609a1fca78c027c682d149ecbef18a835eb561f6050f1ae4" -->
<!-- pdac:cite id="FR-SECTIONS" digest="sha256:a8314412962608a99effe44d9872f7c8261e039e75182e25d111b353609dc95b" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->
<!-- pdac:cite id="BR-STRUCTURE" digest="sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="BR-ACCESS" digest="sha256:fcc173c80ae4a5903dbeb2e11c141cb6ee8d03382c812ebc527d5065347b72c9" -->
