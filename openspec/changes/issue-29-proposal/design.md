<!-- pdac-scope: cited -->

# Test design and collision boundaries

## Context

Use the current accepted local storage authority, not the unapplied private-library evolution.

<!-- pdac:cite id="SB-PERSIST-CONFLICT" digest="sha256:3a7fdc4b47da270a63bc50bf681af96793fb46a8283af9093b01d9959f026b37" -->
<!-- pdac:cite id="SB-PERSIST-FAILURE" digest="sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357" -->
<!-- pdac:cite id="SB-PERSIST-RECOVER" digest="sha256:3bb4bec701cf460455382daec1bd17f1e87e0a7f2f5cddc33e244a5b6287d9af" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:6e01f0285df7783f48eb0c482fa31f490f09e97e0f67a3a5fb3261dc1d1ed29c" -->

## Decisions

Two real pages share one BrowserContext and IndexedDB origin. Wait for equal initial snapshots and the winner's acknowledged revision before attempting the stale edit. All content changes use UI fields; direct IndexedDB access only observes durable state through the existing helper. Construct expected snapshots from the initial fixture and independently specified note/revision changes, not application transformation functions.

Install a one-shot fault at the native browser `IDBObjectStore.put` boundary only after initial saves. Match database/store/key, restore the original method before throwing, and assert the injection fired exactly once. This is deterministic QuotaExceededError injection, not measured disk exhaustion. No mocked session/store, persistent init script or timing sleep.

Compare entire snapshots and real downloaded versioned backup envelopes. Attach synthetic backup bytes and readable screenshots to Playwright steps using the existing report mechanism. Failure traces stay under existing configuration. Report generation is portable and does not select a publishing destination.

Only the new test file and this change directory are owned. Do not repair product source opportunistically. Known pre-existing UI caveat: successful retry can leave an old component-level error until dismissal/reload. This slice proves save acknowledgement, retry-control removal and exact durable recovery; it does not claim that separate message-state defect is fixed.

## Verification and review

Independent plan review precedes edits; independent candidate review evaluates the exact committed diff. Run focused browser tests first, then the declared full committed-source `npm run verify:delivery` on Node 24+ (verify, browser suite, evidence recording). Required GitHub CI must independently pass the current PR head. Authored coverage, execution, review, merge, deployment and physical-device evidence remain distinct.

## Risks

The fixed alpha storage schema/selectors will need deliberate adaptation when #20–#28 land. Preserve these observable safety assertions in future real-stack tests; this browser proof cannot close backend isolation/device-change acceptance. Do not merge overlapping runner candidates or bypass source-bound native gates.
