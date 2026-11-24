# Epic #92 status: what is delivered and what is still open

Recorded after PR #116 merged into `lighthouse/epic-92`. Authored coverage, actual execution, independent review
and deployment are separate facts; a green aggregate does not attest the last two.

## Delivered on `lighthouse/epic-92` (all merged with passing required checks)

| Slice | PRs | What exists |
| --- | --- | --- |
| AND-00 product traceability | #103 | `verify:traceability` binds the applied product change and the four native SBs. |
| AND-01 build and runners | #102 | Locked Gradle build, convention plugins, `verifyHost`, `verifyDevice`, TDD runners. |
| AND-02 architecture refusals | #104, #106, #107, #108 | Project graph, pure domain, storage ownership, gate-integrity refusals (suppressions, downgrades, omitted tasks, empty suites). AND-G04 and AND-G05 await real feature code. |
| AND-03 gates and receipts | #111 | `verifyRelease`, source-bound artifact and execution receipts, root adapters. |
| AND-04 pure musical rules | #112 | Spelling, exact pitch, register, full chord catalogue and library rules checked against hand-derived literals and the existing web domain. |
| AND-05 local lifecycle | #113, #114 | Sets, retained history, recoverable delete, restore with a new revision, confirmed purge, anti-resurrection, guarded commands, the store port and application service, and the Room adapter with real-device tests. |
| AND-06 transfer | #115 | Versioned format, bounded codec, preview and cancel, validated import with fresh identities. |
| AND-07 first native slice | #116 | Compose library screen on Room (create, delete, restore, edit-mode guard) with device tests. |
| CI | #105, #109, #110 | Node 26, parallel verification jobs behind the required `Verify ScoreMap` gate, cache reuse, fail-fast cancellation. |

## Not delivered (still open acceptance evidence)

AND-05 (#99)
- PDF attachments and their Room/PDF tests, schema export and migration-recovery tests.
- Set screens and history screens; the screen offers songs only.

AND-06 (#100)
- Owned PDF bytes in the package; the file picker and share/receive intents; oversize handling at the operating-system boundary.
- A real exchange between two installations on two devices (only two independent in-process libraries were exercised).

AND-07 (#101)
- Editor, piano, staff, song-sheet, phrase and lyrics screens; independent parts and bindings; hand ownership.
- Release upgrade and rollback refusal and release performance budgets (`verifyRelease` states them as pending).
- Signed release and update journey (needs signing credentials held outside Git).

Gates nobody has performed
- Independent review of the current head.
- Installation on the target tablet, accessibility on the device, playing-distance readability and musician acceptance.
  These remain unperformed gates; no emulator result stands in for them.
- The four native SBs have no native acceptance evidence yet; `verify:traceability` keeps them pending.

## Decisions for the owner
- `LIGHTHOUSE_AUTOMATION_ENABLED` and `LIGHTHOUSE_MAINTENANCE_ENABLED` were set to false while model tokens were out;
  restoring them is the owner's call.
- The aggregate CI job no longer re-runs `verifyHost` itself; the required gate waits for the Android host job on the
  same SHA instead (see `docs/evidence/bootstrap/infrastructure.md`).
