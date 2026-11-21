<!-- pdac-scope: cited -->

# Android native foundation design

## Context

The native target is a separate implementation in the existing repository. The owner selects Kotlin/Compose over MAUI for Android and asks for a bounded architecture that can be enforced before features are added. The accepted model still has web/private-service and anonymous-import constraints; [proposal drift](proposal.md#product-definition-drift) and AND-00 address the product transition.

<!-- pdac:cite id="CON-PLATFORM" digest="sha256:635e50e18ab13a558ff7fb34323fb9c54c651858935b841272e22ce860067fbb" -->
<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:a2cd6293106ac4e7a464b7ded96b8670d1de7480624260ba8c49a1400dbc824d" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:5f901e669e39923921cd1d28302b3f308460a72bda3bce53d83ffa7255934cd4" -->
<!-- pdac:cite id="FR-BACKUP" digest="sha256:26a789dde39b92764b10fe30b3840c614626a63d96a933bae0a87322cac9f066" -->

## Decisions

[ADR-0010](../../../docs/architecture/09-architecture-decisions/ADR-0010-build-a-separate-native-android-application.md) owns technology/layout rationale. [Arc42 section 05](../../../docs/architecture/05-building-block-view/android-target.md) owns module/slice dependencies, persistence and state boundaries. [Section 10](../../../docs/architecture/10-quality-requirements/android-enforcement.md) owns tooling, gate task names, rule IDs and required refusal evidence. This document owns implementation ordering and integration risks.

Establish an independent Gradle build and quality convention plugins before feature code. A pure Kotlin musical domain and application operations make musical tests runnable without Android. Real Room/device tests remain necessary for actual transactions and migrations. Kotlin visibility, evaluated project references, compiled architecture tests and source-declaration rules cover different failure modes; none alone is called complete enforcement.

## Delivery strategy

1. Align product intent and the affected citations through the Product Change apply route.
2. Deliver the minimal build, test runners and reproducible toolchain; define source inventories without moving the current app.
3. Deliver rule fixtures and enforce the complete target graph, including a new-module opt-out attempt.
4. Wire aggregate CI and prove an injected violation fails the result actually required for integration.
5. Deliver one synthetic create/save/reopen slice using red/green/refactor before expanding the native editor.
6. Deliver song/set transfer only with an approved identity/compatibility policy, then verify independent-installation use and later native feature parity.

Keep all new Android verification additive to root product/citation/spec/architecture checks. Do not weaken existing private-application qualification to make an unrelated native scaffold pass. Native source scanning must account for Kotlin/Gradle/resources without treating every file under `src` as TypeScript or C#.

## Test and migration design

Map selected SB/LC transitions to tests with independently expected musical values, including preserved identity/content during reorder and prior revision after failed save. Capture expected red failures before implementation. Cross-language fixtures share inputs and expected semantics; existing provider output is not the only oracle. Distinguish format version, database schema version, content revision and app version in compatibility tests.

<!-- pdac:cite id="SB-SECTION-REORDER" digest="sha256:610413c7eae977e5760aa413f58ec499375fdafe0952dca8cbc7591cbda639e5" -->
<!-- pdac:cite id="LC-STRUCTURE" digest="sha256:31caaa7320486ab3a837e8b0f3ac2b14f6e5623b664f131cb85af1ce030a24ef" -->
<!-- pdac:cite id="SB-PERSIST-FAILURE" digest="sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->

For legacy transfer, inspect actual supported exports and backend validators. No direct access to existing private databases or browser origins is assumed. Keep old exports intact; unknown or unsupported content refuses before any activation. A new local Room library is populated only through an approved import workflow, using synthetic fixtures for qualification. A device-local commit is the new target acknowledgement only after product alignment; existing service acknowledgements retain their meaning.

<!-- pdac:cite id="BR-BACKUP" digest="sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:5f901e669e39923921cd1d28302b3f308460a72bda3bce53d83ffa7255934cd4" -->

## Risks and qualification

Toolchain compatibility, Kotlin bytecode/visibility interpretation, attachment filesystem durability, storage exhaustion, incoming-file compatibility and real tablet readability require implementation evidence. No performance claim follows from selecting Kotlin. Measure release startup, song switching, scrolling and keyboard interaction on the declared target; agree budgets from those measurements. Hardware MIDI/audio and acoustic chord recognition require separately scoped trials.

## Out of scope

Implementation in this proposal, product approval/apply, removal of the existing web/backend, changes to active issue #74 execution, native signing credentials, store submission and user-data migration. No toolkit-derived global skills or parallel ADR directory are used.
