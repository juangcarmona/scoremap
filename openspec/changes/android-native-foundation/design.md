<!-- pdac-scope: cited -->

# Android native foundation design

## Context

The native target is a separate implementation in the existing repository. The owner selects Kotlin/Compose over MAUI for Android and asks for a bounded architecture that can be enforced before features are added. The separate hosted `issue-79-product-change` addresses native local authority and independent exchange while preserving existing web/private-service constraints. AND-00 verifies its integrated apply and native acceptance evidence before changed musician behavior.

<!-- pdac:cite id="CON-PLATFORM" digest="sha256:276120bdea8e88293e6843367e84966dacdad452cd568a124f64f73a24b529d5" -->
<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:3dd07ade8d6c189ac4f9b29fcf0e51d7abc3a6fd1a1f6ab7093918f0c4484c0a" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:19c3bdee25cf34e4b6c6742a5da9a3c8905ba657d9056227fa0180474ed9b5e3" -->
<!-- pdac:cite id="FR-BACKUP" digest="sha256:57286bb21b4c895afe8d7831630bec01797580be96efa5fb5a321e9822dca7e1" -->

## Decisions

[ADR-0010](../../../docs/architecture/09-architecture-decisions/ADR-0010-build-a-separate-native-android-application.md) owns technology/layout rationale. [Arc42 section 05](../../../docs/architecture/05-building-block-view/android-target.md) owns module/slice dependencies, persistence and state boundaries. [Section 10](../../../docs/architecture/10-quality-requirements/android-enforcement.md) owns tooling, gate task names, rule IDs and required refusal evidence. This document owns implementation ordering and integration risks.

Establish an independent Gradle build and quality convention plugins before feature code. A pure Kotlin musical domain and application operations make musical tests runnable without Android. Real Room/device tests remain necessary for actual transactions and migrations. Kotlin visibility, evaluated project references, compiled architecture tests and source-declaration rules cover different failure modes; none alone is called complete enforcement.

## Delivery strategy

1. Align product intent and the affected citations through the Product Change apply route.
2. Deliver the minimal build, test runners and reproducible toolchain; define source inventories without moving the current app.
3. Deliver rule fixtures and enforce the complete target graph, including a new-module opt-out attempt.
4. Wire aggregate CI and prove an injected violation fails the result actually required for integration.
5. Port pure musical rules with independent expectations, then deliver the complete synthetic create/save/reopen slice using red/green/refactor before expanding the native editor.
6. Deliver song/set transfer only with an approved identity/compatibility policy, then verify independent-installation use and later native feature parity.

Keep all new Android verification additive to root product/citation/spec/architecture checks. Do not weaken existing private-application qualification to make an unrelated native scaffold pass. Native source scanning must account for Kotlin/Gradle/resources without treating every file under `src` as TypeScript or C#.

## Test and migration design

Map selected SB/LC transitions to tests with independently expected musical values, including preserved identity/content during reorder and prior revision after failed save. Capture expected red failures before implementation. Cross-language fixtures share inputs and expected semantics; existing provider output is not the only oracle. Distinguish format version, database schema version, content revision and app version in compatibility tests.

<!-- pdac:cite id="SB-SECTION-REORDER" digest="sha256:610413c7eae977e5760aa413f58ec499375fdafe0952dca8cbc7591cbda639e5" -->
<!-- pdac:cite id="LC-STRUCTURE" digest="sha256:31caaa7320486ab3a837e8b0f3ac2b14f6e5623b664f131cb85af1ce030a24ef" -->
<!-- pdac:cite id="SB-PERSIST-FAILURE" digest="sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:d822f18f163b8685937ae5a3137dc04ef4a2d5947ab7a9954245bd965b72fa45" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->

For legacy transfer, inspect actual supported exports and backend validators. No direct access to existing private databases or browser origins is assumed. Keep old exports intact; unknown or unsupported content refuses before any activation. Migrating existing music into a new local Room library uses only the approved import workflow, with synthetic fixtures for qualification; ordinary native first-song creation remains supported. A device-local commit is the new target acknowledgement after the separately applied native Product Change; existing service acknowledgements retain their meaning.

<!-- pdac:cite id="BR-BACKUP" digest="sha256:6e01f0285df7783f48eb0c482fa31f490f09e97e0f67a3a5fb3261dc1d1ed29c" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:19c3bdee25cf34e4b6c6742a5da9a3c8905ba657d9056227fa0180474ed9b5e3" -->

## Risks and qualification

Toolchain compatibility, Kotlin bytecode/visibility interpretation, attachment filesystem durability, storage exhaustion, incoming-file compatibility and real tablet readability require implementation evidence. No performance claim follows from selecting Kotlin. Measure release startup, song switching, scrolling and keyboard interaction on the declared target; agree budgets from those measurements. Hardware MIDI/audio and acoustic chord recognition require separately scoped trials.

## Out of scope

Implementation in this proposal, product approval/apply, removal of the existing web/backend, changes to active issue #74 execution, native signing credentials, store submission and user-data migration. No toolkit-derived global skills or parallel ADR directory are used.
