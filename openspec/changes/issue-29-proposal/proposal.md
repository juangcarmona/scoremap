<!-- pdac-scope: cited -->

# Browser evidence for persistence refusal and recovery

## Why

[Issue #29](https://github.com/juangcarmona/scoremap/issues/29) supplies an early, independent verification slice of #27. Current storage/application tests exercise conflicts and failure in isolation; the browser suite lacks the corresponding visible draft/export/retry journeys. This delivery consumes accepted CHG-INITIAL semantics and changes no product behavior.

## What Changes

Add only `tests/e2e/persistence.spec.ts` and this delivery change. Reuse existing browser helpers, production build, report attachments and evidence recorder. No shared configuration, dependency, application, backend, canonical model or architecture edits.

## Capabilities

### New Capabilities

- persistence-browser-evidence: Executable browser proof of existing persistence behavior.

### Modified Capabilities

None.

## Product dependencies

Direct dependencies are persistence refusal/recovery, complete backup export, their governing rules and existing requirement/quality authority:

<!-- pdac:cite id="SB-PERSIST-CONFLICT" digest="sha256:3a7fdc4b47da270a63bc50bf681af96793fb46a8283af9093b01d9959f026b37" -->
<!-- pdac:cite id="SB-PERSIST-FAILURE" digest="sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357" -->
<!-- pdac:cite id="SB-PERSIST-RECOVER" digest="sha256:3bb4bec701cf460455382daec1bd17f1e87e0a7f2f5cddc33e244a5b6287d9af" -->
<!-- pdac:cite id="SB-BACKUP-EXPORT" digest="sha256:4dc53a109e0e344b95c117d7a429c92b3b54d4ce8856cf00104b501d13f86237" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:6e01f0285df7783f48eb0c482fa31f490f09e97e0f67a3a5fb3261dc1d1ed29c" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:19c3bdee25cf34e4b6c6742a5da9a3c8905ba657d9056227fa0180474ed9b5e3" -->
<!-- pdac:cite id="QR-INTEGRITY" digest="sha256:efafc9b7b32a7ff39fdb822f04ef46def7c7534b84b2e48a606fce99bea603e6" -->
<!-- pdac:cite id="UC-PERSIST" digest="sha256:ea669e891adfc7641a2cf80bd5cd198d3909ee2fd6424c505a7cf991314c602f" -->
<!-- pdac:cite id="LC-LIBRARY" digest="sha256:87592e7d48ad80b922f219f370fee009668a74146f83cbb2f159e16752fbdda5" -->

The existing model inventory and `prodshape impact` results were checked before writing this change. Neighbours ACT-MUSICIAN, BC-RECOVERY and TERM-LIBRARY supply unchanged context, not new actor/context/data definitions. LC-LIBRARY remains POPULATED: note edits/refused writes introduce no library-presence transition. Existing annotation, section, chord, repertoire, performance, offline and update scenarios remain owned by their existing tests. Backup import/replacement and unreadable-startup cases remain existing coverage, not this slice. PDF stays deferred under #13. No drift or Product Change is proposed.

## Impact

One test file, two browser journeys, existing report/CI discovery. Lighthouse retains ownership of #20–#28 implementation. This slice neither authenticates users nor qualifies future server persistence, hosting or physical devices.
