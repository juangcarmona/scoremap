# Native execution prerequisites

Repository: juangcarmona/scoremap, numeric ID 1458674261, private.

Installed: Lighthouse 0.13.11 / SDLC 0.24.0, ProductShape 0.26.1 with explicit PDaC v1alpha2, ArcShape 0.4.0, OpenSpec 1.15.0. Registry latest OpenSpec is 2.0.0; Lighthouse's current native contract explicitly invokes 1.15.0. gh-aw 0.93.2 compiled the selected workers. Node 24 is the application and worker build target.

A repository-scoped lighthouse-workflow runner is online. Its mounted engine-scoremap.json selects the existing provider credentials volume and model profiles: fast openai/gpt-6-luna medium; build openai/gpt-6.1-terra medium; plan openai/gpt-6.1-sol high. The operator configuration maps implementation to fast and review to plan. No repository override changes those selectors. Provider-confirmed identity and cost remain unavailable until actual execution receipts establish them.

## Blocked prerequisites

- GitHub GET rules/branches/main returns HTTP 403: upgrade to GitHub Pro or make this repository public. The repository must remain private. No completion/epic/unattended merge may bypass enforced checks.
- The authenticated OAuth token cannot list GitHub App installations (HTTP 403). Required: repository-scoped private App installation with Contents read/write, LIGHTHOUSE_CI_APP_CLIENT_ID variable and LIGHTHOUSE_CI_APP_PRIVATE_KEY secret. Repository secrets/variables were initially empty; the App client ID and private-key secret subsequently became available and require native access verification. Source-repository setup does not apply automatically.
- The owner has excluded Cloudflare and Wrangler. No deployment provider is selected; the application remains an HTTPS-ready PWA.
- Physical Android tablet installation has no device target available here. Chromium mobile emulation is separate evidence.

Workers are installed separately from activation. Bounded unattended policy retains enabled=false and merge=false; epic/completion stay disabled until their live prerequisites can be verified. Refinement may be enabled independently after its runner and default-branch workflow are verified. Never copy CI private keys into source or chat.

Required CI is Verify ScoreMap from GitHub Actions App ID 15368 on push/PR, including lighthouse/verification-* pushes. Evidence targets lighthouse-evidence, which also needs no-delete/no-force-push protection before completion can publish trusted records.
