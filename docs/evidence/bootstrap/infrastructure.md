# Native execution prerequisites

Repository: juangcarmona/scoremap, numeric ID 1458674261. Created private under the initial request, then changed to public following explicit owner authorization.

Installed: Lighthouse 0.13.11 / SDLC 0.24.0, ProductShape 0.26.1 with explicit PDaC v1alpha2, ArcShape 0.4.0, OpenSpec 1.15.0. Registry latest OpenSpec is 2.0.0; Lighthouse's current native contract explicitly invokes 1.15.0. gh-aw 0.93.2 compiled the selected workers. Node 24 is the application and worker build target.

A repository-scoped lighthouse-workflow runner is online. Its mounted engine-scoremap.json selects the existing provider credentials volume and model profiles: fast openai/gpt-6-luna medium; build openai/gpt-6.1-terra medium; plan openai/gpt-6.1-sol high. The operator configuration maps implementation to fast and review to plan. No repository override changes those selectors. Provider-confirmed identity and cost remain unavailable until actual execution receipts establish them.

## Current readiness and remaining boundaries

- The owner authorized public visibility. The installed Lighthouse GitHub profile was subsequently applied: main requires pull requests and the strict Verify ScoreMap check; no deletion or force-push is permitted. The lighthouse-evidence branch also rejects deletion and force-push. The adoption receipt is github-profile-adoption.json. No completion/epic/unattended merge may bypass enforced checks.
- The authenticated OAuth token cannot list GitHub App installations (HTTP 403). Required: repository-scoped App installation with Contents read/write, LIGHTHOUSE_CI_APP_CLIENT_ID variable and LIGHTHOUSE_CI_APP_PRIVATE_KEY secret. Repository secrets/variables were initially empty; the App client ID and private-key secret subsequently became available and require native access verification. The readiness workflow uses create-github-app-token v3, whose published inputs support client-id; v2 does not support that input. Source-repository setup does not apply automatically.
- The owner configures and publishes Cloudflare Pages at https://scoremap.jgcarmona.com. Agent deployment is outside the revised scope; Wrangler is removed.
- Physical Android tablet installation has no device target available here. Chromium mobile emulation is separate evidence.

Workers are installed separately from activation. Bounded unattended policy retains enabled=false and merge=false; epic/completion stay disabled until their live prerequisites can be verified. Refinement may be enabled independently after its runner and default-branch workflow are verified. Never copy CI private keys into source or chat.

Required CI is Verify ScoreMap from GitHub Actions App ID 15368 on push/PR, including lighthouse/verification-* pushes. Evidence targets lighthouse-evidence, which also needs no-delete/no-force-push protection before completion can publish trusted records.


## Android epic activation — 2026-11-21

The owner enabled native epic execution for `juangcarmona/scoremap` (repository
ID `1458674261`). Readback confirmed `LIGHTHOUSE_AUTOMATION_ENABLED=true`,
`LIGHTHOUSE_EPIC_ENABLED=true` and `LIGHTHOUSE_EPIC_CAPACITY=1`. The installed
adopter now uses Lighthouse 0.13.19 / SDLC 0.25.2 and already contains the optional
`lighthouse-sdlc-epic.yml` controller. This activation supersedes the earlier
statement that epic execution remains disabled; unattended merge policy remains
`enabled=false`, `merge=false`.

[Epic #79](https://github.com/juangcarmona/scoremap/issues/79) defines the Android
MVP. Its first documentation PR precedes the source revision bound by parent
refinement. The controller must create and authenticate its eight child issues,
then retain each refinement, implementation, readiness and owner acceptance
receipt. Activation and a responding runner do not prove native delivery. The
Android compiler/emulator and physical tablet qualification remain explicit
AND-01/AND-03/AND-07 work; no APK, device test or epic acceptance is claimed here.

## Android build environment qualification — 2026-11-21

A temporary Compose/Room application passed all 47 `assembleDebug` and
`lintDebug` tasks from a cold project with seeded public dependencies in 194
seconds using the generated wrapper. Its distribution checksum and URL
validation were enabled. The candidate extension of the existing .NET worker
image ran with a read-only root, 4 GiB memory, two CPUs
and a 2 GiB writable `/tmp`, with networking disabled and no KVM, Docker socket
or USB access. Peak cgroup memory was 4,132,765,696 bytes, close to the 4 GiB
limit. This qualifies that temporary build under the worker limits; the complete
ScoreMap module graph, architecture rejection fixtures and required pipeline
still need measurement.

The tested versions are JDK 21.0.13.1+2, Gradle 9.7.0, AGP 9.3.1, Kotlin and
Compose compiler 2.4.21, Compose BOM 2026.11.01, Activity Compose 1.13.0, Room
2.8.5, KSP 2.3.14 and Build Tools 36.0.0. Compose dependency metadata requires
compile SDK 37.1; the attempted compile SDK 37.0 build was refused. Target SDK
37 is separate. The temporary application's minimum SDK 26 does not establish
ScoreMap's supported device floor. Existing Node 24, Git, Chromium, OpenCode,
.NET 10 and Aspire prerequisites remained usable in the extended image.

For AND-01, commit the standard generated Gradle wrapper, including its JAR and
executable shell script. Pin the distribution URL and SHA-256:

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-9.7.0-bin.zip
distributionSha256Sum=84fbba45c7f4c64abc77460e1c00f541e9f960e3c7ed2538f1ede19eacd873ae
```

The candidate worker provides ordinary `JAVA_HOME`, `ANDROID_HOME` and
`ANDROID_SDK_ROOT` variables and the tools on `PATH`. Its `scoremap-android`
helper invokes the project wrapper, seeds public dependency artifacts and
keeps writable caches under the already ignored `.runtime/android` directory.
From `src/android`, the worker invocation is
`scoremap-android ./gradlew --console=plain verifyHost`. The project must also
support the standard wrapper on an independently provisioned developer or CI
host. Keep persistent Gradle caches out of the per-command `/tmp`.

The bounded invocation uses a maximum Gradle heap of 2 GiB, two workers and
in-process Kotlin compilation. Bound nested fixture builds as well. AGP 9 uses
built-in Kotlin: do not also apply `org.jetbrains.kotlin.android`. The tested
build selects Kotlin 2.4.21 explicitly and applies its matching Compose plugin.
The installed JDK is 21; Android bytecode was targeted to 17. Pure JVM modules
can use toolchain 21 with an explicit bytecode target instead of requesting an
unprovisioned JDK 17. Add Android output/cache ignore rules before the first
project build; retain the wrapper JAR and dependency verification metadata.

A separate Android 17/API 37 tablet emulator booted and installed the temporary
APK. Its Compose screen appeared only after a synthetic Room insert/read
assertion succeeded. Neither this experiment nor the host build proves ScoreMap
feature coverage, durability, migration, file exchange or physical tablet
acceptance. The operator selected the qualified immutable worker image outside
Git and verified that the ScoreMap runner observes it. Only the existing
`dotnet` environment image changed; other execution settings were preserved.
Repository policy continues to use the supported `dotnet` environment profile.
Signing keys and operator runtime configuration remain outside the repository.

### Shared host admission

The gh-aw gateway admits one host job at a time. A job waiting in runner setup
has not necessarily started its agent. Product Change run `44910018775` failed
after 1,800 seconds waiting for that slot; it published no validated result or
candidate. The concurrently observed engine belonged to a different repository
and was preserved. Execution evidence must match the repository and workflow
run, rather than relying on the presence of a process or busy runner.

The operator added ScoreMap to the existing 7,200-second host-wait policy and
verified its shell syntax and all affected selection branches. Other
repositories and the default wait remain unchanged. ScoreMap's compiled agent
jobs allow 180 minutes for product preparation, refinement and review, and 360
minutes for implementation. This admission change leaves the actual agent
execution deadlines and repository integration checks intact. A fresh owner
Product Change request follows the confirmed failed attempt; it does not replay
an unconfirmed dispatch or imply that an earlier agent ran.

## Native composition transport upgrade — 2026-11-21

The consumer now selects Lighthouse 0.13.27 and SDLC 0.30.1 through exact npm
pins, the Lighthouse manifest and generated projections. The owning
`lighthouse upgrade --scope all` preview reported complete adoption and no
ownership conflicts before apply. The SDLC package-mode installer regenerated
the selected completion, Product Change, unattended, epic and maintenance
workflows; gh-aw 0.93.2 regenerated all nine agent workflow locks.

This prerequisite addresses Product Change run
[44913149709](https://github.com/juangcarmona/scoremap/actions/runs/44913149709),
which completed with a blocked result at `productcomposition_inspect` and
published no candidate. The older SDLC transport rejected the bounded MCP
`_meta` fields sent by OpenCode 2.1.0. The released transport accepts its bounded
progress/session metadata while retaining rejection of unsupported fields.
The package and workflow update must be integrated before a fresh Product
Change request; local protocol execution does not prove a native catalog,
approval, apply or parent continuation.

The existing CI checks, 150-minute implementation deadline, 360-minute
implementation job, 180-minute shared agent admission, policies, canonical
ProductShape/ArcShape ownership and eight-stage Android plan remain intact.
Unattended policy remains `enabled=false`, `merge=false`. The newer refinement
publisher can retain visual evidence with `contents: write`; its agent and
preparation jobs retain `contents: read`. This upgrade changes no operator
configuration, worker image, production application or Android implementation.
