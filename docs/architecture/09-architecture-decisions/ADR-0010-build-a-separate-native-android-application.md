---
id: ADR-0010
title: Build a separate native Android application
status: Accepted
date: "2026-11-21"
deciders: [Repository owner]
---

<!-- markdownlint-disable-next-line MD025 -->
# ADR-0010: Build a separate native Android application

## Context

The owner requests an Android application that installs and works without sign-in, stores music locally, and exchanges editable songs and complete sets through files. The owner selects Kotlin and Jetpack Compose and asks to preserve the existing application and accumulated product, architecture and OpenSpec knowledge in this repository. MIDI and microphone integration are future motivations, not requirements to implement the hardware engine now.

The inspected baseline is `813b794d36b41c932bc4b30b1fe73f34c5bce413`. It already contains a React application, an ASP.NET Core service, PostgreSQL integration and acknowledged private recovery. The accepted model still specifies authenticated private access and complete replacement for anonymous backup import. A native personal library with additive song/set import changes that intent. This ADR accepts the technical realization under the owner's Kotlin/Compose direction and delegated delivery authority. ProductShape application is a separate prerequisite; this decision does not retire existing services.

<!-- pdac:cite id="CON-PLATFORM" digest="sha256:276120bdea8e88293e6843367e84966dacdad452cd568a124f64f73a24b529d5" -->
<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:3dd07ade8d6c189ac4f9b29fcf0e51d7abc3a6fd1a1f6ab7093918f0c4484c0a" -->
<!-- pdac:cite id="FR-BACKUP" digest="sha256:57286bb21b4c895afe8d7831630bec01797580be96efa5fb5a321e9822dca7e1" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:19c3bdee25cf34e4b6c6742a5da9a3c8905ba657d9056227fa0180474ed9b5e3" -->

## Decision

Use a standalone Gradle build under `src/android`, using Kotlin, Jetpack Compose and Room/SQLite. Keep the current application paths and all canonical product documents in place. Kotlin implements the approved musical semantics using independent synthetic compatibility fixtures; it does not import the TypeScript runtime or make HTTP authentication a dependency of local editing.

Use capability-oriented slices within a small set of Gradle modules, with pure musical rules and application operations behind explicit contracts. The composition root selects local storage and transfer adapters. Define module dependencies, public surfaces and package boundaries as executable rules. Prove each rule with allowed and forbidden fixtures, including an actual failing build. The target structure belongs to [section 05](../05-building-block-view/android-target.md); the enforcement contract belongs to [section 10](../10-quality-requirements/android-enforcement.md).

Use the repository's installed ArcShape skills and section 09 for decisions. Keep the ProductShape model and OpenSpec at repository root as their canonical authorities. Accept the product transition through the validated Product Change route before implementing changed musician behavior. Architecture proposal acceptance, product application, implementation, source integration and installation qualification remain distinct.

## Alternatives considered

- **Expo / React Native:** viable for native integrations, but keeping React is not an owner constraint and Android is the only requested target. A second runtime and native bridge would add integration surfaces for the planned MIDI/audio work.
- **.NET MAUI:** useful when sharing a C# application across platforms is a goal. This product requests Android and direct use of its platform APIs; existing backend code is evidence for semantics rather than a reason to require a .NET UI runtime.
- **Java with Views:** platform-compatible, but Google recommends Kotlin and Compose for new Android development.
- **Rust for the entire application:** Android compilation is possible, but UI and platform integration would require another framework or bindings. Consider an isolated native audio-processing library only after a measured need.
- **Move the existing app into a web directory first:** unnecessary churn while another delivery is active. Establish the Android build boundary without moving existing sources.

## Consequences

- **Positive:** Direct Android APIs, platform UI tooling and local transactions match the requested product. The current application and accepted knowledge remain inspectable during delivery.
- **Negative:** Musical rules need a Kotlin implementation and cross-language compatibility evidence. The UI is new work. Supporting iOS later would require another explicit choice.
- **Neutral:** This is an accepted target architecture; Android implementation and executed qualification remain pending. Existing ADRs retain their history and status; superseding any decision requires acceptance of the replacement and an explicit scope decision.

## References

- [Android foundation delivery proposal](../../../openspec/changes/android-native-foundation/proposal.md)
- [Android architecture recommendations](https://developer.android.com/topic/architecture/recommendations)
- [Android modularization patterns](https://developer.android.com/topic/modularization/patterns)
- [Kotlin-first Android development](https://developer.android.com/kotlin/first)
- [Jetpack Compose](https://developer.android.com/compose/)
- [Room](https://developer.android.com/training/data-storage/room)
- [Existing private-service decision](ADR-0003-self-host-the-private-application-with-aspire.md)
