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
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="BR-BACKUP" digest="sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b" -->
<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:5f901e669e39923921cd1d28302b3f308460a72bda3bce53d83ffa7255934cd4" -->
<!-- pdac:cite id="QR-INTEGRITY" digest="sha256:ab546fccd5704db577b5005460adc8c643dc6adb9173cf2ee750e7f1e6e0ae3e" -->
<!-- pdac:cite id="UC-PERSIST" digest="sha256:11f7381952aca132adad468fc62c648341ccc68c29bdc3b805020ee0997c3d0b" -->
<!-- pdac:cite id="LC-LIBRARY" digest="sha256:40aaed3bcc086823445f840db9aa19d0e7bdf28ac94bd8ebfa8848b5702c711f" -->

The existing model inventory and `prodshape impact` results were checked before writing this change. Neighbours ACT-MUSICIAN, BC-RECOVERY and TERM-LIBRARY supply unchanged context, not new actor/context/data definitions. LC-LIBRARY remains POPULATED: note edits/refused writes introduce no library-presence transition. Existing annotation, section, chord, repertoire, performance, offline and update scenarios remain owned by their existing tests. Backup import/replacement and unreadable-startup cases remain existing coverage, not this slice. PDF stays deferred under #13. No drift or Product Change is proposed.

## Impact

One test file, two browser journeys, existing report/CI discovery. Lighthouse retains ownership of #20–#28 implementation. This slice neither authenticates users nor qualifies future server persistence, hosting or physical devices.
