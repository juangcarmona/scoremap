# Connected pending-work checkpoint

The implementation adds deadline-driven private locking and an explicit review of retained pending commands. Session metadata carries no provider token. Each private adapter request checks a cancellable context generation and the current deadline; old responses cannot unlock or acknowledge work in a retired context.

Actual qualification of these source inputs:

- `npm run verify:app`: 137 unit/component tests, strict TypeScript, lint, formatting and application build passed.
- `npm run verify`: product/citations/architecture/baseline/OpenSpec/catalogue/backend checks passed, including 29 backend tests and six deliberate compiler refusals. The command then **failed** its enforced tooling vulnerability audit for the picomatch advisory tracked in [issue #38](https://github.com/juangcarmona/scoremap/issues/38). Runtime dependency audit reported zero vulnerabilities. No exception, downgrade or filtered audit was introduced.
- `npm run verify:frontend-boundaries`: passed.
- `npm run test:e2e`: all 27 anonymous desktop/tablet/mobile browser journeys passed.
- Private build plus `npm run test:connected`: all 15 journeys passed against actual Keycloak and PostgreSQL. Independent controlled-clock unit tests cover the exact known expiration, request latency, clock rollback, elapsed-clock reset and invalid/overlong metadata. The real browser deadline case retains a complete two-arrangement pending edit through lock and account switch, with another principal refused.

The lost-response case actually commits through the selected service before aborting its response. Reloaded recovery retries its original expected revisions/key/command; the receipt returns the existing revision and history remains `[2, 1]`. The revoked-editor case creates an encrypted performed-note draft, ends the prior session, revokes its grant, signs in again with the same stable principal, and observes an actual unlock refusal without exposing/replaying/exporting the draft. Explicit ciphertext removal succeeds and the independent anonymous source remains unchanged.

Raw authentication/storage results stay in private operator evidence. These working-tree execution facts do not constitute independent review, a clean committed-source delivery receipt, native integration, production qualification or physical-device acceptance. Persistent private offline access remains disabled; its resource-scoped lease and key lifecycle still require separate implementation/qualification.
