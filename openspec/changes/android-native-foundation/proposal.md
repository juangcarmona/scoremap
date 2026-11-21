<!-- pdac-scope: cited -->

# Android native foundation proposal

## Why

The owner requests Kotlin/Jetpack Compose Android delivery under `src/android`, retaining existing implementation and canonical knowledge. The musician installs without an account, prepares songs/chords and complete sets, saves locally, shares portable files, imports on another installation and continues editing. This change prepares the architecture and implementation backlog; it does not implement or apply changed product behavior.

## What Changes

- Propose ADR-0010 in the existing ArcShape section 09 collection.
- Define the [module graph](../../../docs/architecture/05-building-block-view/android-target.md) and [hard enforcement contract](../../../docs/architecture/10-quality-requirements/android-enforcement.md).
- Define ordered foundation tasks with deliberate rule violations and meaningful TDD evidence before musical feature delivery.
- Keep the React/backend implementation and root ProductShape/OpenSpec/ArcShape authorities in place during the new client build.

## Capabilities

### New Capabilities

- `android-engineering-foundation`: independently built native client foundations and executable architecture admission.

### Modified Capabilities

None applied. Local song/set transfer and no-login persistence need the Product Change below before feature implementation.

## Product definition drift

The accepted baseline still specifies an installable private web application and authenticated service authority. Anonymous transfer is confirmed whole-library replacement. The owner's proposed Android library and additive song/set imports change those meanings. Future MIDI/audio is a motivation, not hardware scope in this foundation. Do not delete existing authority rules or reinterpret old acceptance evidence as proof of the new client.

<!-- pdac-drift ids="CON-PLATFORM,CON-LOCAL-FIRST,CON-SCOPE,FR-PERSIST,FR-BACKUP,BR-BACKUP,LC-LIBRARY" summary="Owner requests a native personal Android library without login and portable song/set imports; the current model defines private web/service authority and anonymous replacement import." -->

<!-- pdac:cite id="CON-PLATFORM" digest="sha256:635e50e18ab13a558ff7fb34323fb9c54c651858935b841272e22ce860067fbb" -->
<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:a2cd6293106ac4e7a464b7ded96b8670d1de7480624260ba8c49a1400dbc824d" -->
<!-- pdac:cite id="CON-SCOPE" digest="sha256:2934fbcf8f42cd477a77c5f9fb3fecc17beca485b243c2031279056347655216" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:5f901e669e39923921cd1d28302b3f308460a72bda3bce53d83ffa7255934cd4" -->
<!-- pdac:cite id="FR-BACKUP" digest="sha256:26a789dde39b92764b10fe30b3840c614626a63d96a933bae0a87322cac9f066" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b" -->
<!-- pdac:cite id="LC-LIBRARY" digest="sha256:40aaed3bcc086823445f840db9aa19d0e7bdf28ac94bd8ebfa8848b5702c711f" -->

AND-00 must prepare a distinct overlay-validated Product Change, obtain explicit product approval and apply it through the installed integration before musician behavior is implemented. This spec-driven change supplies no approval or apply state.

## Impact and evidence selection

Reviewed baseline: `813b794d36b41c932bc4b30b1fe73f34c5bce413`; 124 canonical artifacts indexed and the selected product rules, lifecycles, behaviors and requirements read. The installed ProductShape CLI generated citations and expanded graph impacts for 26 roots. Preserve `LC-STRUCTURE`, exact-pitch/harmony semantics, stable identities, read-only performance admission, complete acknowledged persistence, transfer completeness and synthetic evidence. These are selected constraints, not implementation claims.

<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="BR-IDENTITY" digest="sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768" -->
<!-- pdac:cite id="BR-STRUCTURE" digest="sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->
<!-- pdac:cite id="LC-STRUCTURE" digest="sha256:31caaa7320486ab3a837e8b0f3ac2b14f6e5623b664f131cb85af1ce030a24ef" -->
<!-- pdac:cite id="SB-SECTION-REORDER" digest="sha256:610413c7eae977e5760aa413f58ec499375fdafe0952dca8cbc7591cbda639e5" -->
<!-- pdac:cite id="SB-PERSIST-FAILURE" digest="sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357" -->
<!-- pdac:cite id="FR-SONG-SHEET" digest="sha256:d1601737decd8d10473cdbbb1a417f4a33fa58c70f272f7378b44a7b78d9139c" -->
<!-- pdac:cite id="FR-PIANO-SCORE" digest="sha256:c7090b853deaf69a52df30a9a1ae62d24b51a0cb620dcb38a272ec1e0856cde5" -->
<!-- pdac:cite id="FR-PHRASE-REFERENCE" digest="sha256:16c20f0819f52467b0ac1ba823db8ac5defc7c6c01fd44ad310bdcf15fb35e5b" -->
<!-- pdac:cite id="QR-INTEGRITY" digest="sha256:ab546fccd5704db577b5005460adc8c643dc6adb9173cf2ee750e7f1e6e0ae3e" -->
<!-- pdac:cite id="QR-OFFLINE" digest="sha256:a3c8b14e8eb2c0b1a419ec1a266cf50ff4d0b739936b2f6cf0c0cdfc7db38827" -->
<!-- pdac:cite id="QR-READABILITY" digest="sha256:fd18e2b171a6c15b68dc256acc88c7cf32f0376d723faf7a662a374ce49a9f5f" -->
<!-- pdac:cite id="CON-CONTENT" digest="sha256:5c08415cc8047dfc3161440d4a427675c191cd7bfecef5d3c7bb139fe0a9752e" -->

Checked neighbours include song/repertoire/membership use cases, grants/session/lease and deleted-song retention, PDF/references, presets/device bindings and notation. AND-00 must reclassify login/ownership/history/lease dependencies for the new local client; this proposal does not remove them from the existing application. Existing musical capabilities remain in the domain scope; PDFs, account collaboration, realtime coediting, MIDI/audio and actual publication are not implemented by foundation tasks. Issue #74 and its current implementation remain separate; follow-up native slices reuse its accepted outcomes rather than creating a competing product model.

## Open product decisions for AND-00

Define same-identity import behavior (explicit replacement versus independent copy/update), revision-history retention and transfer, portable treatment of independently owned reusable resources, attachment support per native milestone, and the eventual relationship between the existing private service and the Android product. The owner has settled Android, local persistence, no login and song/set exchange; these remaining choices are not silently decided by a build harness.

## Impact

Documentation and planning only. No canonical product edits, Android source, CI activation, publication, backend retirement or user-data migration. Existing worktree changes and live libraries are preserved. Source acceptance, executed gates, independent review and device acceptance remain separate facts.
