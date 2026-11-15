# ScoreMap execution report — November 15, 2026

## Delivered scope

Repository: https://github.com/juangcarmona/scoremap (numeric ID 1458674261). Public following the owner's explicit correction to the original private-repository requirement. No public project license selected. Third-party notices retained.

ScoreMap is a React/TypeScript/Vite local-first PWA. It provides repertoire and song CRUD, independent repertoire membership, stable identified sections with ordering and repetitions, major/minor chords with sharps/flats, accurate two-octave piano references, song/section notes, HTTP(S) references, protected performance consultation, atomic IndexedDB persistence and validated JSON backup replacement. No real song arrangements are bundled.

No backend, authentication, cloud database, synchronization, MIDI infrastructure or mandatory external API was introduced. External references need connectivity. PDF import/rendering/navigation remains unimplemented in #13; backups containing PDFs are explicitly refused until that capability is available.

## Integration and publication

[PR #16](https://github.com/juangcarmona/scoremap/pull/16) integrated the core into the delivery branch. [PR #15](https://github.com/juangcarmona/scoremap/pull/15) merged into main as **517c4b14ae3b97522c08c0a0b9246fe00117adda** at 2026-11-15 11:57:12 UTC. Its tree b5be111797eacd64c18e42f652925883f7c775b3 exactly matches the independently accepted candidate 843b091de7055d1e4444b1831f44fce5c45c07d8. Native main CI completed successfully. The local checkout is on main.

The repository owner configured Cloudflare Pages. The agent supplied source through GitHub and observed publication; it did not configure Cloudflare or deploy with Wrangler. Main requires pull requests and the strict Verify ScoreMap check. Deletion and force-push are prohibited on main and the evidence branch. No required check was weakened or bypassed.

**Live verified application: https://scoremap.pages.dev.** Cloudflare deployment 9471e6f7-3b85-45d3-a479-12f74de94b22 reports success for main 517c4b1. A real Playwright Chromium session on that production URL returned HTTPS 200, created a song/section/chord/notes, downloaded and restored a backup, checked displayed draft replacement, confirmed installability without CDP errors, disabled networking, reloaded, edited/saved/reloaded and entered protected performance consultation. No page errors were observed. The custom domain https://scoremap.jgcarmona.com did not resolve from this host at the final check; DNS/custom-domain publication remains owner-managed. Data belongs to its browser origin: export before moving from pages.dev to the custom domain.

## Product and architecture authority

Installed published Lighthouse 0.13.11 / SDLC 0.24.0, ProductShape CLI 0.26.1, ArcShape 0.4.0 and OpenSpec 1.15.0. OpenSpec 2.0.0 was inspected, but the installed Lighthouse integration explicitly invokes 1.15.0. Node 24 is the application/CI target. Applicable React, PWA and visual-theme profiles were resolved through the installed catalog.

The accepted ProductShape baseline explicitly uses PDaC v1alpha2, with 99 canonical artifacts and 44 normative Structured Behaviours. Its initial Product Change was validated, approved under the owner's accepted intent and applied through ProductShape. LC-LIBRARY models empty/populated library transitions; LC-STRUCTURE models empty/arranged sections. Rules define stable ownership, independent membership, exact reorder permutations, repetitions, musical relationships, read-only performance, storage integrity and backup validation. Edit/performance mode and note drafts are interaction state, not invented song lifecycles.

ProductShape model validation passes with zero errors/warnings and warnings-as-errors enabled. ArcShape validation, architecture/product citations, Lighthouse baseline and strict OpenSpec validation pass. Product citations are current. Architecture lives in twelve ArcShape sections with explicit browser-only constraints and persistence decisions. Eleven OpenSpec delivery changes cite accepted product artifacts rather than replacing product/architecture authority.

Traceability: requirement → normative SB → applicable lifecycle transition/rule → cited OpenSpec delivery plan → pure domain/application implementation → executed Vitest/Playwright evidence → independent review. Machine-readable external evidence uses the provider-supported pdac-verification-evidence/v1alpha1 envelope; the canonical product serialization remains v1alpha2.

## Executed verification

- 73 Vitest tests pass: guarded commands, valid/refused transitions, stable section identity/order/notes, musical pitch classes and actual SVG keys, malformed input, atomic persistence, stale tabs, quota failure, corrupt/unknown stored data and backup integrity.
- 15 Playwright E2E tests pass: complete editing/consultation journeys, actual backup download/cancel/import/reload, network-disabled reload/edit/save/reload, manifest/icons/active service worker and Chromium installability, two-production-build explicit service-worker activation, external references, tablet/narrow layouts, 200% text, axe and Android-phone touch emulation.
- Two note-loss regressions were demonstrated failing against their previous reviewed sources and passing after correction. They cover incremental typing during delayed IndexedDB acknowledgements and switching songs while those acknowledgements are held, then continuing to type and reloading.
- 41 of 44 Structured Behaviours have executed passing evidence with provider-generated fresh citations. Three PDF behaviours are explicitly inconclusive, not passed. ProductShape validates the retained external evidence without diagnostics.
- Real HTTPS preview browser checks also verified backup replacement resets displayed song/section drafts, and offline recovery/editing/performance with no page errors.

Physical Android installation, a musician's distance/readability assessment on the actual tablet and Google Play distribution are not proven by browser emulation. The first two remain in #14; Play distribution remains deferred.

## Independent review and correction

The installed Lighthouse adapter ran independent reviews using its verdict-v1 binding and the operator's existing plan profile. These local trusted-host executions are not GitHub Actions runs and grant no merge authority.

Plan review required two correction rounds: ownership/shared mutation paths, explicit offline dependency on notes, backup browser proof and two-build update verification. The third plan review accepted with no findings.

Candidate reviews found two real note-loss boundaries: controlled inputs overwritten during queued saves, followed by drafts lost on rapid song remounts. Identity-keyed interaction drafts now survive remounts and clear after successful replacement import. Actual RED/GREEN browser evidence is retained.

The third substantive candidate review **accepted with no findings** for 843b091de7055d1e4444b1831f44fce5c45c07d8, binding 7505b30d4730e28f550972fd8dd35d49f5cf73fc81c0773d743f41074861a330. Its host-observed execution through cleanup took 196 seconds; this is not provider billing time. Two implementation correction rounds were required. The preflight failure described below produced no candidate verdict and is not counted as a passed review.

## Native automation and operational limits

Lighthouse native workflows, issue labels, repository profiles, runner/model contracts and bounded policy are installed. The repository-scoped lighthouse-workflow runner is online. Existing provider/model selection was preserved. Finite unattended policy uses a one-hour bound, two corrections and independent review; autonomous merge remains disabled pending native delivery qualification.

Native refinement #4 ran at https://github.com/juangcarmona/scoremap/actions/runs/43704693254 and successfully published a **blocked** outcome requesting dependency-owner/interface and behavioural evidence. Supporting evidence was supplied. That green Actions run is not counted as a completed implementation. This MVP's implementation was performed in the Codex session with independent Lighthouse-adapter reviews and native GitHub CI. A complete native issue-to-implementation-to-PR-to-merge delivery has not been demonstrated.

The additional repository App readiness workflow failed: https://github.com/juangcarmona/scoremap/actions/runs/43711387082. GitHub returned HTTP 401, “A JSON web token could not be decoded”, before installation access could be verified. This does not establish whether the App is installed. The existing client-ID/private-key pair requires secure operator verification; tracked in #17. No key was read back or exposed, and unattended integration remains disabled.

Two Dependabot development-tool security updates also failed with security_update_not_possible: [KaTeX](https://github.com/juangcarmona/scoremap/actions/runs/43711392230) still resolves 0.16.47, while [minimatch](https://github.com/juangcarmona/scoremap/actions/runs/43711392242) proposes an incompatible toolchain downgrade. Follow-up #18 retains the failure without suppressing alerts or changing published tool contracts. `npm audit --omit=dev --json` on delivered main reports zero production dependency vulnerabilities; this does not dismiss development dependency alerts.

Earlier local review startup failures exposed execution-identity and harness-readability constraints. A later review failed before model execution because /tmp had 100% inode usage despite free bytes. Recovery removed only twelve validated dependency/cache directories owned by this ScoreMap task, preserving sources, locks, active workers and other repositories. Docker destruction events and immutable-ID absence reconciled two interrupted resource acknowledgements; the installed recovery then confirmed both runtime and workspace clean. The retry used disk-backed scratch. Recovery evidence is retained separately.

Telemetry reported RETENTION_CAPACITY degradation. Requested/resolved review configuration is openai/gpt-6.1-sol with high reasoning through the existing plan profile; authenticated provider identity, token consumption and provider-reported cost remain unavailable. No cost estimate is presented as measured cost. CI command durations and execution timestamps are retained in exact-source receipts. Full human-intervention/agent-token accounting was not available; known owner actions include visibility correction, Pages configuration and integration authorization.

## Backlog and remaining acceptance

MVP epic: https://github.com/juangcarmona/scoremap/issues/1. Native child issues and dependencies cover #2–#14. PDF is a separate future slice #13. Final physical-device acceptance and any custom-domain setup remain #14. The epic stays open while those accepted intended-product/acceptance items remain.

Closed delivered issues #2–#12 after main verification and independent acceptance. Epic #1, PDF #13 and physical-device/custom-domain acceptance #14 remain open. Engineering follow-ups #17 (App JWT authentication) and #18 (development-tool security update resolution) are labelled future to prevent unintended unattended implementation.

## Evidence

- [Canonical product](https://github.com/juangcarmona/scoremap/tree/main/docs/product/model)
- [Architecture](https://github.com/juangcarmona/scoremap/tree/main/docs/architecture)
- [OpenSpec changes](https://github.com/juangcarmona/scoremap/tree/main/openspec/changes)
- [Retained local verification and reviews](https://github.com/juangcarmona/scoremap/tree/main/docs/evidence)
- [Permanent process receipts](https://github.com/juangcarmona/scoremap/tree/lighthouse-evidence/docs/process/20261115-scoremap-mvp)

- [Main CI](https://github.com/juangcarmona/scoremap/actions/runs/43711383356) and its permanent main-ci-receipt.json, main-behaviour-coverage.json and main-verification-evidence.json.
- [Accepted independent candidate review](candidate-accepted.json), including requested/resolved model configuration, unavailable provider identity/cost and cleanup receipts.
- [Production browser observations](production-browser.json).
- [Exact integration tree binding](revision-binding.json).
- [Infrastructure and update failures](infrastructure-result.json).
- [Issue closeout](issue-closeout.json).
- [Recovery evidence](operator-reconciliation.json) and the bounded [temporary dependency/cache cleanup](inode-recovery.json).
