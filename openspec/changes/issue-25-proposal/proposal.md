<!-- pdac-scope: cited -->
# Connected private libraries

## Why

The browser-only alpha cannot enforce account ownership or recover saved work in another browser. The owner explicitly requested autonomous implementation of the usable MVP. CHG-ARRANGEMENT-EVOLUTION has been overlay-validated and applied through ProductShape on this branch; PR integration still accepts the baseline separately from execution and deployment.

## What Changes

Retain the existing current-format song editor and anonymous local library. Add a real OIDC/Keycloak sign-in, server-held sessions, current song-scoped owner/editor/viewer permissions and conditional acknowledged PostgreSQL commits. Import current v1 library-envelope JSON explicitly, preserving original files, identities, associations and existing destination music; copies require explicit new-identity confirmation. Prove reopening in a clean authenticated browser session.

<!-- pdac:cite id="FR-PERSIST" digest="sha256:19c3bdee25cf34e4b6c6742a5da9a3c8905ba657d9056227fa0180474ed9b5e3" -->
<!-- pdac:cite id="BR-ACCESS" digest="sha256:9b679c2f86bdff7fc86ae00f0669e3a76023c3579895249dd21bbb3d617494a9" -->
<!-- pdac:cite id="BR-SESSION" digest="sha256:ef810362632ea22983eed6cfcdb6adfafb1d37497623582d64c0bc7c349e7bc2" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:6e01f0285df7783f48eb0c482fa31f490f09e97e0f67a3a5fb3261dc1d1ed29c" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->

## Capabilities

- New `private-library`: real login, authenticated import/read/save, current grants, conflicts, retry receipts, protected pending work and portable startup.
- The full accepted arrangement model remains in the applied Product Change. Rich harmony/voicings/parts, qualified persistent private offline work and complete retention/history UI remain separately tracked; this checkpoint does not close the whole evolution.

## Impact

Source: the existing library/editor boundary, a feature-oriented .NET module and BFF, PostgreSQL, Aspire development, separate private production configuration and Compose artifacts. Original anonymous IndexedDB data is not deleted or automatically claimed. Read the governing SB/LC/FR/BR and architecture before each follow-on change. Existing anonymous major/minor, membership, notes and section identity cases remain compatible subsets; PDF transfer remains refused.
