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

## Explicit conflict-copy extension

The next candidate adds a direct **Save as a new song** action for each changed pending song. The original protected ciphertext remains intact. Before dispatch it atomically retains opaque new owned identities and a command ID; names, notes and decryption material are absent from that journal. A fresh authorized full comparison recognizes the same destination after an ambiguous response. A changed destination refuses rather than allocating another copy.

Both new actual-service cases passed: a complete two-arrangement stale draft keeps the newer original/history and copies every performed event/binding with disjoint owned identities, and a legacy draft migrates atomically while retaining source history at revision 0 without invented performed notes. In each case the service really commits before the response is aborted; reload/retry creates no second copy or history revision. The complete connected suite passed all 17 journeys, the application verifier passed all 137 tests/build/lint/format/type checks, and current citations/architecture/OpenSpec/frontend-direction checks passed. The security, source-bound delivery, independent-review and deployment limits above remain unchanged.

## Latest protected interaction and multiple contexts

The next extension separates complete local protection from serialized service acknowledgement. New valid interactions are admitted against the latest candidate immediately. A generation check prevents an older response from replacing it or removing its newer protected record. Each tab writes one latest encrypted snapshot under an independent opaque editing-context key in the existing version-1 database. Older principal-keyed records remain explicitly recoverable without a schema upgrade. Unknown record versions remain unchanged and require an explicit deletion decision.

The final application verifier passed all 143 unit/component tests and type/lint/format/build checks. The final complete real Keycloak/PostgreSQL suite passed all 23 journeys; all 27 anonymous browser journeys also passed. Six new real connected cases cover rapid typing behind a genuinely committed but withheld response, independent drafts in two tabs, real provider logout without waiting for that response, original legacy record recovery, injected device-quota refusal with zero save requests followed by explicit retry, and an unconfirmed import immediately reviewed/retried without selecting its file again. The import case injects one explicit pre-commit HTTP refusal, then uses the real original command against the actual service. The application tests separately cover stale acknowledgement ordering and protection failure; atomic record tests cover principal isolation and preservation of unsupported records.

The initial complete 22-case run failed one import at a generic HTTP refusal; no status evidence established its cause. This failed run is retained. The fixture now reports rate refusals and spaces real logins to stay within the unchanged application limits. The subsequent final 23-case run passed without a rate-refusal diagnostic. No production rate limit was increased. An earlier test-authoring attempt did not build the latest source; it is excluded from the final qualification above.

Logout waits for local protection rather than network idle, warns when protection fails, aborts the application context and submits actual provider termination. Successful local protection is labelled separately from a confirmed service save. Protection failures preserve acknowledged service data and never claim device durability. Reopened records require fresh same-principal resource authorization before review, export or replay.

Import selection/source provenance, complete personal-resource pending protection and the separately scoped private offline lease remain open. This checkpoint does not change the failed mandatory aggregate security gate, source-bound delivery, independent-review or production-deployment boundaries above.
