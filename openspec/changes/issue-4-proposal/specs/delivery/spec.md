<!-- pdac-scope: cited -->

## Product dependencies

<!-- pdac:cite id="SB-BLANK-NAME" digest="sha256:df469f85a539ac9aabbc71658c59485c3a0232a88349ce62b0ac126d6897f04c" -->
<!-- pdac:cite id="SB-MISSING-IDENTITY" digest="sha256:fff8b2ea2df48cf8b63bb2b5ed2ea1f834b2b24389ed9e300fba67bb6d78c66d" -->
<!-- pdac:cite id="SB-SECTION-FIRST" digest="sha256:142013b9449dc02eff8f99b7752661694163795e29a55ef00daafc6f63e7ac4c" -->
<!-- pdac:cite id="SB-SECTION-INSERT" digest="sha256:419cab857698e48ddda21d1b82e507163f407c0d6459f16785fb096c9324427a" -->
<!-- pdac:cite id="SB-SECTION-INVALID-ORDER" digest="sha256:b504ff2ff04dee9f4f02842b169ef787cff8f53943404f0323b0f946bda08944" -->
<!-- pdac:cite id="SB-SECTION-MODIFY" digest="sha256:d39296e86c35c16c859c4f1c4294a2df9b5edcd9304a505d7b4d5b985274a95b" -->
<!-- pdac:cite id="SB-SECTION-REMOVE-LAST" digest="sha256:4857e323f1014f93ab8b8e8e72e692809d2597c653a7cea01de470132b094e66" -->
<!-- pdac:cite id="SB-SECTION-REMOVE" digest="sha256:a9ebfc7be7dad88eaca3e230d20e904c697d133790d193f4cb46dcf495708e77" -->
<!-- pdac:cite id="SB-SECTION-REORDER" digest="sha256:610413c7eae977e5760aa413f58ec499375fdafe0952dca8cbc7591cbda639e5" -->
<!-- pdac:cite id="SB-SECTION-REPEAT-BOUNDARY" digest="sha256:8290678c017a749dd78b1b1d6ef192b85a7ec141d1cc1f0a1926c91c957217c7" -->
<!-- pdac:cite id="SB-SONG-ADD" digest="sha256:3c802dc04e6f6ee9f01574e60c2a55f3c74c1614762f929575dffdf87b78efe9" -->
<!-- pdac:cite id="SB-SONG-CREATE" digest="sha256:d95b74331bb7efbb0806b44d35f116106618a1460ddc58b6a0fe7ec9183decba" -->
<!-- pdac:cite id="SB-SONG-DELETE-LAST" digest="sha256:6d28d410277829ac14537809d400174250ebf8c7ad66ba5d7fe33b4d8cab5451" -->
<!-- pdac:cite id="SB-SONG-DELETE" digest="sha256:bbd38eb21cb613007349d8e8a1ecedaf120174f33d7caca81a0f0acdcaf2d060" -->
<!-- pdac:cite id="SB-SONG-EDIT" digest="sha256:1e27a22da49c7b805dcc4023c563afa4b2ec78936ca42473957617aecb9fa33a" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="BR-IDENTITY" digest="sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768" -->
<!-- pdac:cite id="BR-STRUCTURE" digest="sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686" -->
<!-- pdac:cite id="LC-LIBRARY" digest="sha256:40aaed3bcc086823445f840db9aa19d0e7bdf28ac94bd8ebfa8848b5702c711f" -->
<!-- pdac:cite id="LC-STRUCTURE" digest="sha256:31caaa7320486ab3a837e8b0f3ac2b14f6e5623b664f131cb85af1ce030a24ef" -->
<!-- pdac:cite id="FR-SECTIONS" digest="sha256:a8314412962608a99effe44d9872f7c8261e039e75182e25d111b353609dc95b" -->
<!-- pdac:cite id="FR-SONGS" digest="sha256:db0ae5a70a9b74fd370621e6c7395f924e13f1ba2a931b59514f6eda7c946625" -->
<!-- pdac:cite id="UC-SECTIONS" digest="sha256:e928650b0097c6c084f0a5da9483b55153571c56163b84edf7e280c991c97ebd" -->
<!-- pdac:cite id="UC-SONGS" digest="sha256:a1e0a3c0e6ef1573fb12557f4916af5b0f457628040dc5529a4db42891be3780" -->

## ADDED Requirements

### Requirement: Realize the accepted delivery behaviour

The implementation SHALL satisfy the cited product behaviours and governing invariants for this slice. This is a consumer projection of CHG-INITIAL; the ProductShape artifacts remain canonical.

#### Scenario: SB-BLANK-NAME

- **WHEN** The musician creates a song with only whitespace in its title
- **THEN** The operation is refused; The library remains unchanged

#### Scenario: SB-MISSING-IDENTITY

- **WHEN** The musician requests an edit of that identity
- **THEN** A missing-song error is shown; No song is created or changed

#### Scenario: SB-SECTION-FIRST

- **WHEN** The musician inserts Intro
- **THEN** One section with a fresh identity appears; The song has an arranged structure

#### Scenario: SB-SECTION-INSERT

- **WHEN** The musician inserts a custom section
- **THEN** A second independently identified section is appended; The first section retains its content

#### Scenario: SB-SECTION-INVALID-ORDER

- **WHEN** The musician submits an order containing one identity twice
- **THEN** The reorder is refused; The previous order and all associations remain unchanged

#### Scenario: SB-SECTION-MODIFY

- **WHEN** The musician changes its label and sets its repeat count to three
- **THEN** Its identity, chords and notes are preserved; The sketch displays the new label and three repetitions

#### Scenario: SB-SECTION-REMOVE-LAST

- **WHEN** The musician removes that section
- **THEN** The song remains and has an empty valid structure

#### Scenario: SB-SECTION-REMOVE

- **WHEN** The musician removes one section
- **THEN** Only the selected section and its owned information disappear; The other section is unchanged

#### Scenario: SB-SECTION-REORDER

- **WHEN** The musician moves the second section before the first
- **THEN** The order is reversed; Each section retains exactly its identity, chords, notes and repetition count

#### Scenario: SB-SECTION-REPEAT-BOUNDARY

- **WHEN** The musician assigns a repetition count outside the integer range one through ninety-nine
- **THEN** The operation is refused; The existing count remains unchanged

#### Scenario: SB-SONG-ADD

- **WHEN** The musician creates another titled song
- **THEN** A distinct song identity is added; Existing content remains unchanged

#### Scenario: SB-SONG-CREATE

- **WHEN** The musician creates a song with a nonblank title
- **THEN** One independently identified song appears with an empty valid structure; The library becomes populated

#### Scenario: SB-SONG-DELETE-LAST

- **WHEN** The musician confirms deletion of that song
- **THEN** The song, its sections and owned attachments are removed; Its memberships disappear and the repertoire remains; The library contains no songs

#### Scenario: SB-SONG-DELETE

- **WHEN** The musician confirms deletion of one song
- **THEN** The selected song and its memberships disappear; The other song remains unchanged

#### Scenario: SB-SONG-EDIT

- **WHEN** The musician changes its title and optional artist
- **THEN** The same song carries the supplied metadata; Sections and memberships retain their associations
