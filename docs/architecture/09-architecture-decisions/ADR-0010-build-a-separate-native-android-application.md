---
id: ADR-0010
title: Build a separate native Android application
status: Proposed
date: "2026-11-21"
deciders: [Repository owner]
---

<!-- markdownlint-disable-next-line MD025 -->
# ADR-0010: Build a separate native Android application

## Context

The owner requests an Android application that installs and works without sign-in, stores music locally, and exchanges editable songs and complete sets through files. The owner selects Kotlin and Jetpack Compose and asks to preserve the existing application and accumulated product, architecture and OpenSpec knowledge in this repository. MIDI and microphone integration are future motivations, not requirements to implement the hardware engine now.

The inspected baseline is `813b794d36b41c932bc4b30b1fe73f34c5bce413`. It already contains a React application, an ASP.NET Core service, PostgreSQL integration and acknowledged private recovery. The accepted model still specifies authenticated private access and complete replacement for anonymous backup import. A native personal library with additive song/set import changes that intent. This ADR records a proposed technical realization; it does not apply that Product Change or retire existing services.

<!-- pdac:cite id="CON-PLATFORM" digest="sha256:635e50e18ab13a558ff7fb34323fb9c54c651858935b841272e22ce860067fbb" -->
<!-- pdac:cite id="CON-LOCAL-FIRST" digest="sha256:a2cd6293106ac4e7a464b7ded96b8670d1de7480624260ba8c49a1400dbc824d" -->
<!-- pdac:cite id="FR-BACKUP" digest="sha256:26a789dde39b92764b10fe30b3840c614626a63d96a933bae0a87322cac9f066" -->
<!-- pdac:cite id="FR-PERSIST" digest="sha256:5f901e669e39923921cd1d28302b3f308460a72bda3bce53d83ffa7255934cd4" -->

## Decision

We propose a standalone Gradle build under `src/android`, using Kotlin, Jetpack Compose and Room/SQLite. Keep the current application paths and all canonical product documents in place. Kotlin implements the approved musical semantics using independent synthetic compatibility fixtures; it does not import the TypeScript runtime or make HTTP authentication a dependency of local editing.

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
- **Neutral:** This is a proposed architecture, not an implemented Android client. Existing ADRs retain their history and status; superseding any decision requires acceptance of the replacement and an explicit scope decision.

## References

- [Android foundation delivery proposal](../../../openspec/changes/android-native-foundation/proposal.md)
- [Android architecture recommendations](https://developer.android.com/topic/architecture/recommendations)
- [Android modularization patterns](https://developer.android.com/topic/modularization/patterns)
- [Kotlin-first Android development](https://developer.android.com/kotlin/first)
- [Jetpack Compose](https://developer.android.com/compose/)
- [Room](https://developer.android.com/training/data-storage/room)
- [Existing private-service decision](ADR-0003-self-host-the-private-application-with-aspire.md)
