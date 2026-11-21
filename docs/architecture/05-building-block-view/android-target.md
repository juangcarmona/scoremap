# Proposed Android building blocks

This is the proposed target of [ADR-0010](../09-architecture-decisions/ADR-0010-build-a-separate-native-android-application.md), not a description of existing Android implementation. The canonical current system remains in the [section document](README.md). The owner supplied the Android/local-file direction on 2026-11-21; product alignment and implementation are pending.

## Repository boundary

Keep `docs/product/model`, root `openspec`, and `docs/architecture` authoritative for both implementations. Preserve existing React and backend paths. Add a self-contained build:

```text
src/android/
  settings.gradle.kts
  build.gradle.kts
  gradlew, gradlew.bat, gradle/wrapper/
  gradle/libs.versions.toml
  build-logic/                 included Gradle convention plugins
  app/                         Activity, navigation, composition and Android intents
  music/                       pure Kotlin musical domain
  library/                     pure Kotlin application slices, API and ports
  data/local/                  Room adapters and owned attachment storage
  exchange/                    versioned portable codecs, no Android framework
  ui/                          reusable Compose theme and controls
  feature/library/             library, sets and import/export presentation
  feature/workspace/           song editor and protected consultation presentation
  quality/                     architecture tests and invalid-build fixtures
```

Only create a module when its corresponding foundation task needs its boundary. Keep feature-specific controls inside their feature; extract shared UI after a real second consumer exists. Add no empty MIDI/audio modules. Gradle's own source roots use the normal `src/main`, `src/test` and `src/androidTest` layout within each module.

The web TypeScript compiler, ESLint/Prettier, frontend boundary scripts, security scanners and .NET discovery must classify `src/android` intentionally. Excluding Kotlin from a TypeScript compiler is appropriate; excluding the directory from credential scanning is not. Prove the source inventories still cover their own implementations. Root commands continue to select each build explicitly.

## Dependency graph

| Module | Production project dependencies | Responsibility and public surface |
| --- | --- | --- |
| `:music` | None | Immutable musical values, identity, chord spelling, exact pitch, structure and invariants. No Android, serialization, persistence or UI dependency. |
| `:library` | `:music` | Application operations grouped by capability. Exposes immutable inputs/results, a narrow application API, explicit storage/codec ports and adapter composition contracts. |
| `:data:local` | `:library`, `:music` | Implements storage ports; owns Room database, entities, DAOs, migrations, transaction mechanics and durable attachment association. Public adapter factory only. |
| `:exchange` | `:library`, `:music` | Implements pure versioned decoding/encoding ports, with separate transport DTOs and explicit mapping. No filesystem, share-intent or database access. Public codec factory only. |
| `:ui` | None | Android Compose theme, accessibility primitives and proven shared controls. No domain operations or storage access. |
| `:feature:library` | `:library`, `:music`, `:ui` | Library/set/import/export routes and screen state. Only consumes application API/model namespaces, never application port namespaces. |
| `:feature:workspace` | `:library`, `:music`, `:ui` | Song editing, piano/staff presentation and read-only performance routes. Same application boundary. |
| `:app` | `:library`, `:music`, both adapters, both features, `:ui` | Composes implementations, Activity/navigation, document picker, incoming files and Android Sharesheet. Wiring may use port types; screen/Activity behavior cannot call storage ports. |
| `:quality` | Test/build inputs only | Inspects the evaluated project graph and compiled production artifacts. Has no production consumer. |

Every production edge is allowlisted in the build policy. Features never reference siblings or adapter implementations. Platform APIs live in the Android shell or the relevant adapter; rendering depends on application contracts. No generic `shared`, `utils` or universal repository module is introduced.

## Vertical slices and visibility

Organize application behavior by action: `library/song/create`, `library/section/reorder`, `library/set/export` and `library/transfer/import`. Each slice owns its request/result, admission, operation and focused tests; it calls pure musical rules and declared ports. Logical slice boundaries do not imply five projects for every operation.

Kotlin declarations are `internal` or `private` by default under the project rules. Explicit public API/model/port namespaces are reviewed allowlists. Pure musical value types may cross the application boundary. Room entities/DAOs, codec DTOs, mutable collections, framework handles and raw database streams may not. Kotlin `internal` protects module boundaries, not packages within a module: compiled architecture tests enforce internal logical layering, and declaration rules constrain exported symbols.

All mutations enter an application command that checks edit mode and complete domain validity before asking storage to commit. The storage port accepts a validated mutation plus expected revision and stable command identity, rather than arbitrary SQL or a mutable entity. A returned acknowledgement identifies the committed revision; cancellation/failure/conflict cannot construct a success result. UI, file intents, autosave and later hardware inputs use this same application admission path.

<!-- pdac:cite id="BR-EDIT-GUARD" digest="sha256:20e678c4743404c64a51c01e4446026ac95811827d2f5e1c641839291ad32718" -->
<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="BR-IDENTITY" digest="sha256:6b3d38400ae82fdc926ae2b7a9eee5d02e684c50502545f323adc41cea150768" -->
<!-- pdac:cite id="SB-SECTION-REORDER" digest="sha256:610413c7eae977e5760aa413f58ec499375fdafe0952dca8cbc7591cbda639e5" -->

## State and persistence

Compose renders immutable screen state and emits user actions. Screen-scoped ViewModels expose read-only `StateFlow`; reusable composables receive state/callbacks rather than ViewModels. Use lifecycle-aware collection and structured coroutines, injected dispatchers for blocking work, and cancellable operations. ViewModels retain no Activity, Context, database or stream handles. Construct dependencies explicitly in the application composition root; no DI framework is required initially.

Room/SQLite is the authority for acknowledged device-local content. JSON is a portable representation, not an independently writable second master. Content revision, database schema, transfer format and application release are separate versions. A commit atomically validates expected revision, saves complete accepted content and records its receipt. Serialize writes or use conditional updates so stale drafts cannot overwrite newer acknowledged revisions. Preserve unsaved interaction state after failed writes and identify it separately from saved content.

<!-- pdac:cite id="BR-DURABILITY" digest="sha256:6b075527861da086b9571e8d117c7844348a437e363423bca46f60cc83b02e0b" -->
<!-- pdac:cite id="SB-PERSIST-FAILURE" digest="sha256:31db2bb51e3c0495ac05dc1b53938c2de756eef9176e3ba747f6b877ee014357" -->

For attachments, a SQLite transaction does not make filesystem writes atomic. Stage and validate complete bytes, publish immutable content-addressed files before committing database references, and acknowledge only after the files and transaction satisfy the qualified durability contract. A crash may leave unreferenced staged files; cleanup must not remove referenced files. Failed import never activates missing attachments or replaces existing music. Native filesystem durability and low-storage behavior require device tests.

Portable import/export supports the new musician journey only after Product Change alignment. Parse untrusted input into transport DTOs, validate the whole declared graph and supported capabilities, preview destination changes, then commit the selected atomic boundary. Keep schema-version dispatch explicit. Unknown future content is preserved and refused, rather than silently truncated. Do not infer an identity collision policy, history-retention policy or automatic merge from this architecture.

<!-- pdac:cite id="BR-BACKUP" digest="sha256:0ca300361becac0a9858d098ab1e029b5bc1dfe41a06a58ecc40408fee32ed3b" -->
<!-- pdac:cite id="FR-BACKUP" digest="sha256:26a789dde39b92764b10fe30b3840c614626a63d96a933bae0a87322cac9f066" -->

## Reuse and future integrations

Reuse accepted semantics, scenarios, synthetic music fixtures, approved palettes and selected design references. Port implementation logic deliberately and compare independently expected values. Do not copy private musical libraries, credential fixtures, provider tokens or runtime identity requirements into Android. The tests must preserve spelling, exact octave/hand ownership, section identity/order/repeats, lyrics/associations, arrangement/part bindings and explicit/unknown phrase timing where the selected product milestone supports them.

<!-- pdac:cite id="BR-CHORDS" digest="sha256:543566a20181aa25eab6cc446d8ac467b1ca911632744dd957a0ab3388e9d55c" -->
<!-- pdac:cite id="BR-STRUCTURE" digest="sha256:db3410bd8a3fe7f3da94e63ee8804b1c75f03b8f7dd1e7858cfd05aed03a0686" -->
<!-- pdac:cite id="FR-SONG-SHEET" digest="sha256:d1601737decd8d10473cdbbb1a417f4a33fa58c70f272f7378b44a7b78d9139c" -->
<!-- pdac:cite id="FR-PIANO-SCORE" digest="sha256:c7090b853deaf69a52df30a9a1ae62d24b51a0cb620dcb38a272ec1e0856cde5" -->
<!-- pdac:cite id="FR-PHRASE-REFERENCE" digest="sha256:16c20f0819f52467b0ac1ba823db8ac5defc7c6c01fd44ad310bdcf15fb35e5b" -->
<!-- pdac:cite id="CON-CONTENT" digest="sha256:5c08415cc8047dfc3161440d4a427675c191cd7bfecef5d3c7bb139fe0a9752e" -->

Later MIDI/audio features add platform adapters at a demonstrated use-case boundary. Keep time-critical audio processing outside Compose and its UI thread. Hardware support, latency, permissions and recognition quality need their own product scope and device evidence; this foundation does not claim those capabilities exist.

## Guidance and project-specific choices

Follow Android's [UDF and ViewModel guidance](https://developer.android.com/topic/architecture/recommendations) and [module patterns](https://developer.android.com/topic/modularization/patterns). The pure musical domain, inverted storage ports and action-oriented slices are project choices made to enforce ScoreMap invariants. They are not presented as Android-mandated layering. The [enforcement contract](../10-quality-requirements/android-enforcement.md) states how these choices fail a build when violated.
