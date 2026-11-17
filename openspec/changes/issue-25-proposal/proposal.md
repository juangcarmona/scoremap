<!-- pdac-scope: cited -->
# Connected private libraries

## Why

The browser-only alpha cannot enforce account ownership or recover saved work in another browser. The owner explicitly requested autonomous implementation of the usable MVP. CHG-ARRANGEMENT-EVOLUTION has been overlay-validated and applied through ProductShape on this branch; PR integration still accepts the baseline separately from execution and deployment.

## What Changes

Retain the existing current-format song editor and anonymous local library. Add a real OIDC/Keycloak sign-in, server-held sessions, current song-scoped owner/editor/viewer permissions and conditional acknowledged PostgreSQL commits. Import current v1 library-envelope JSON explicitly, preserving original files, identities, associations and existing destination music; copies require explicit new-identity confirmation. Prove reopening in a clean authenticated browser session.

<!-- pdac:cite id="FR-PERSIST" digest="sha256:5f901e669e39923921cd1d28302b3f308460a72bda3bce53d83ffa7255934cd4" -->
<!-- pdac:cite id="BR-ACCESS" digest="sha256:fcc173c80ae4a5903dbeb2e11c141cb6ee8d03382c812ebc527d5065347b72c9" -->
<!-- pdac:cite id="BR-SESSION" digest="sha256:a8c63526b6fe52375791a737ed14280609d00938808928153d49fd2627416326" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->

## Capabilities

- New `private-library`: real login, authenticated import/read/save, current grants, conflicts, retry receipts, protected pending work and portable startup.
- The full accepted arrangement model remains in the applied Product Change. Rich harmony/voicings/parts, qualified persistent private offline work and complete retention/history UI remain separately tracked; this checkpoint does not close the whole evolution.

## Impact

Source: the existing library/editor boundary, a feature-oriented .NET module and BFF, PostgreSQL, Aspire development, separate private production configuration and Compose artifacts. Original anonymous IndexedDB data is not deleted or automatically claimed. Read the governing SB/LC/FR/BR and architecture before each follow-on change. Existing anonymous major/minor, membership, notes and section identity cases remain compatible subsets; PDF transfer remains refused.
