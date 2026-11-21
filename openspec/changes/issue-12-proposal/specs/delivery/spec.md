<!-- pdac-scope: cited -->

## Product dependencies

<!-- pdac:cite id="SB-BACKUP-CANCEL" digest="sha256:a1b39939e1798f96a3d4d4a6d0eea6f09ba4156293d49b05ae692953a1975806" -->
<!-- pdac:cite id="SB-BACKUP-EXPORT" digest="sha256:4dc53a109e0e344b95c117d7a429c92b3b54d4ce8856cf00104b501d13f86237" -->
<!-- pdac:cite id="SB-BACKUP-IMPORT-EMPTY" digest="sha256:94feeffb023102ad9861da55203c10d9df2f94ffe120ab962c346aa331908c6d" -->
<!-- pdac:cite id="SB-BACKUP-IMPORT" digest="sha256:a91c468115f1a66e2222f71eb936d54052e1959dfe93867da92c93476ac28d3e" -->
<!-- pdac:cite id="SB-BACKUP-REJECT" digest="sha256:f6b3ca347fe8d7d709509474f84ae9b7d4ecfc01ac4a66c3af5de77c20784e5d" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:6e01f0285df7783f48eb0c482fa31f490f09e97e0f67a3a5fb3261dc1d1ed29c" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="LC-LIBRARY" digest="sha256:87592e7d48ad80b922f219f370fee009668a74146f83cbb2f159e16752fbdda5" -->
<!-- pdac:cite id="FR-BACKUP" digest="sha256:57286bb21b4c895afe8d7831630bec01797580be96efa5fb5a321e9822dca7e1" -->
<!-- pdac:cite id="UC-BACKUP" digest="sha256:ce5f43fc20dbe7e1482447d0334509c00460c28f84e33b3e8aacfcc2e4cbeb9a" -->

## ADDED Requirements

### Requirement: Realize the accepted delivery behaviour

The implementation SHALL satisfy the cited product behaviours and governing invariants for this slice. This is a consumer projection of CHG-INITIAL; the ProductShape artifacts remain canonical.

#### Scenario: SB-BACKUP-CANCEL

- **WHEN** The musician declines replacement confirmation
- **THEN** The current library remains unchanged

#### Scenario: SB-BACKUP-EXPORT

- **WHEN** The musician exports a backup
- **THEN** A versioned ScoreMap JSON document contains all songs, memberships and associated local content; Export does not change the library

#### Scenario: SB-BACKUP-IMPORT-EMPTY

- **WHEN** The musician imports the backup
- **THEN** The library becomes empty atomically; The empty result is visible

#### Scenario: SB-BACKUP-IMPORT

- **WHEN** The musician imports the backup
- **THEN** All imported associations, identities, order and content are recovered atomically; No extra songs are silently merged

#### Scenario: SB-BACKUP-REJECT

- **WHEN** The musician imports malformed, unsupported or inconsistent backup content
- **THEN** Import is refused before any replacement; The current library remains unchanged; The validation reason is visible
