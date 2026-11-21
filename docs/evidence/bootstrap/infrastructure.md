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
