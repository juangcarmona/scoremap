<!-- pdac-scope: cited -->

# Test design and collision boundaries

## Context

Use the current accepted local storage authority, not the unapplied private-library evolution.

<!-- pdac:cite id="SB-PERSIST-CONFLICT" digest="sha256:3a7fdc4b47da270a63bc50bf681af96793fb46a8283af9093b01d9959f026b37" -->
<!-- pdac:cite id="SB-PERSIST-FAILURE" digest="sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357" -->
<!-- pdac:cite id="SB-PERSIST-RECOVER" digest="sha256:bdcc4abc19436e6b008b9d88047efe937f948e71d6c817e0c06209b3b498cd26" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:f6e8a52fdb28d495f07304870d8d2bfa6c6e5adce7722d919ce64efca735c57e" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:4344f228dbb32818f9dfdce278ec73ac6acd8dc4689069ac6c79d12c1571b917" -->

## Decisions

Two real pages share one BrowserContext and IndexedDB origin. Wait for equal initial snapshots and the winner's acknowledged revision before attempting the stale edit. All content changes use UI fields; direct IndexedDB access only observes durable state through the existing helper. Construct expected snapshots from the initial fixture and independently specified note/revision changes, not application transformation functions.

Install a one-shot fault at the native browser `IDBObjectStore.put` boundary only after initial saves. Match database/store/key, restore the original method before throwing, and assert the injection fired exactly once. This is deterministic QuotaExceededError injection, not measured disk exhaustion. No mocked session/store, persistent init script or timing sleep.

Compare entire snapshots and real downloaded versioned backup envelopes. Attach synthetic backup bytes and readable screenshots to Playwright steps using the existing report mechanism. Failure traces stay under existing configuration. Report generation is portable and does not select a publishing destination.

Only the new test file and this change directory are owned. Do not repair product source opportunistically. Known pre-existing UI caveat: successful retry can leave an old component-level error until dismissal/reload. This slice proves save acknowledgement, retry-control removal and exact durable recovery; it does not claim that separate message-state defect is fixed.

## Verification and review

Independent plan review precedes edits; independent candidate review evaluates the exact committed diff. Run focused browser tests first, then the declared full committed-source `npm run verify:delivery` on Node 24+ (verify, browser suite, evidence recording). Required GitHub CI must independently pass the current PR head. Authored coverage, execution, review, merge, deployment and physical-device evidence remain distinct.

## Risks

The fixed alpha storage schema/selectors will need deliberate adaptation when #20–#28 land. Preserve these observable safety assertions in future real-stack tests; this browser proof cannot close backend isolation/device-change acceptance. Do not merge overlapping runner candidates or bypass source-bound native gates.
