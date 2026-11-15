<!-- pdac-scope: cited -->

# Validated backup export and import

## Why

Realize the already supplied ScoreMap product intent for [issue #12](https://github.com/juangcarmona/scoremap/issues/12). The applied CHG-INITIAL is the only source of product semantics; this delivery change supplies implementation and verification.

## What Changes

Implement the accepted behaviours cited below in the bounded paths `src/features/library/backup.ts`, `tests/library/backup.test.ts`. Dependencies: #5, #11.

## Capabilities

### New Capabilities

- delivery: Observable implementation of the cited slice.

### Modified Capabilities

None.

## Impact

<!-- pdac:cite id="SB-BACKUP-CANCEL" digest="sha256:a1b39939e1798f96a3d4d4a6d0eea6f09ba4156293d49b05ae692953a1975806" -->
<!-- pdac:cite id="SB-BACKUP-EXPORT" digest="sha256:4dc53a109e0e344b95c117d7a429c92b3b54d4ce8856cf00104b501d13f86237" -->
<!-- pdac:cite id="SB-BACKUP-IMPORT-EMPTY" digest="sha256:94feeffb023102ad9861da55203c10d9df2f94ffe120ab962c346aa331908c6d" -->
<!-- pdac:cite id="SB-BACKUP-IMPORT" digest="sha256:a91c468115f1a66e2222f71eb936d54052e1959dfe93867da92c93476ac28d3e" -->
<!-- pdac:cite id="SB-BACKUP-REJECT" digest="sha256:f6b3ca347fe8d7d709509474f84ae9b7d4ecfc01ac4a66c3af5de77c20784e5d" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:4344f228dbb32818f9dfdce278ec73ac6acd8dc4689069ac6c79d12c1571b917" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:f6e8a52fdb28d495f07304870d8d2bfa6c6e5adce7722d919ce64efca735c57e" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="LC-LIBRARY" digest="sha256:b1df9b0635c42d7a335d0aa1ba95c23b41b6d22d6380a98027c6ddc52a9ebe49" -->
<!-- pdac:cite id="FR-BACKUP" digest="sha256:5241b06d0c1813ecb8289067643f5eda97e41786e949b83a0fa18208f2bb5b1f" -->
<!-- pdac:cite id="UC-BACKUP" digest="sha256:d8af4df96fe863209df6f1481ab18941abeb08a1c8808c40b599a32311000e86" -->

The complete model was examined for shared identity, mode and durability rules. MIDI, accounts and cloud features were excluded because they are outside CON-SCOPE. Read applicable lifecycle transitions and refusal behaviours before authoring tests.
