# Epic #92 status: what is delivered and what is still open

Recorded after PR #122 merged into `lighthouse/epic-92`. Authored coverage, actual execution, independent review
and deployment are separate facts; a green aggregate does not attest the last two.

## Delivered on `lighthouse/epic-92` (all merged with passing required checks)

| Slice | PRs | What exists |
| --- | --- | --- |
| AND-00 product traceability | #103 | `verify:traceability` binds the applied product change and the four native SBs. |
| AND-01 build and runners | #102 | Locked Gradle build, convention plugins, `verifyHost`, `verifyDevice`, TDD runners. |
| AND-02 architecture refusals | #104, #106, #107, #108 | Project graph, pure domain, storage ownership, gate-integrity refusals (suppressions, downgrades, omitted tasks, empty suites). AND-G04 and AND-G05 await real feature code. |
| AND-03 gates and receipts | #111 | `verifyRelease`, source-bound artifact and execution receipts, root adapters. |
| AND-04 pure musical rules | #112 | Spelling, exact pitch, register, full chord catalogue and library rules checked against hand-derived literals and the existing web domain. |
| AND-05 local lifecycle | #113, #114, #118, #119, #120, #121 | Sets, retained history, recoverable delete, restore with a new revision, confirmed purge, anti-resurrection, guarded commands, the store port and application service, the Room adapter with real-device tests, set and history screens, PDF attachments (rules, service, Room version 2 with an exported schema and a device-tested migration from a version 1 database, file blob store, platform PDF inspection) and a page viewer with the last page remembered. |
| AND-06 transfer | #115, #122 | Versioned format (version 2 carries PDF bytes), bounded codec, preview and cancel, atomic validated import with fresh identities (every PDF inspected and stored whole before the commit), and export that refuses an incomplete package. |
| AND-07 first native slices | #116, #118, #121 | Compose library screen on Room (create, delete, restore, rename, add sections, ordered sets, history with restore, PDFs with a viewer and the system picker, edit-mode guard) with device tests. |
| CI | #105, #109, #110 | Node 26, parallel verification jobs behind the required `Verify ScoreMap` gate, cache reuse, fail-fast cancellation. |

## Not delivered (still open acceptance evidence)

AND-05 (#99)
- A retained recovery copy before migrating and a migration that fails halfway are not tested.
- Driving the system document picker itself is not tested (the bytes path below it is).

AND-06 (#100)
- Sharing and receiving packages through the system share sheet or a file picker; oversize handling at the operating-system boundary.
- A real exchange between two installations on two devices (only two independent in-process libraries were exercised).

AND-07 (#101)
- Piano, staff, song-sheet, phrase and lyrics screens and the full editor; independent parts and bindings; hand ownership. Only structure editing (rename, sections) exists.
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
