# ScoreMap delivery evidence

- [Bootstrap and dependency receipts](bootstrap/backlog.json).
- [Initial independent plan review](reviews/plan-round-1.json): request changes.
- [Second plan review](reviews/plan-round-2.json): one remaining correction.
- [Accepted third plan review](reviews/plan-round-3.json): no findings.
- [Initial candidate review](reviews/candidate-round-1.json) found possible note loss during queued saves. The input now preserves its live draft independently of storage acknowledgements; a browser regression delays real IndexedDB completion events while typing one character at a time into both note fields. The same regression fails against the original source (notes-before-regression.log) and passes against the correction. The second review found a remount boundary: switching songs while saves were queued could restore an older draft. [Its receipt](reviews/candidate-round-2.json) and notes-switch-before-regression.log retain that finding and its reproduced failure. Drafts now live in an identity-keyed interaction map above the sketch, clear on successful replacement import, and remain separate from persisted domain state. Both delayed-save regressions are required; final candidate review remains pending.
- MVP machine-readable execution and behaviour coverage are recorded under `mvp/`.
- Real browser captures are under `screenshots/` and use synthetic test content.

Native refinement #4 ran at
https://github.com/juangcarmona/scoremap/actions/runs/43704693254 and returned
**blocked**, requesting prerequisite owner/interface evidence. Its success in
Actions is a successfully published blocked result, not successful delivery.
The prerequisite evidence was supplied on the issue.

The local independent reviewers used the installed Lighthouse SDLC 0.24.0 adapter,
its `verdict-v1` binding and the operator's existing plan profile. These runs are
not GitHub Actions runs. Requested/resolved model configuration is retained
separately from provider-confirmed identity and cost, which remain unverified.

Initial local plan-review attempts failed before useful review: one failed the
numeric execution ownership contract and one failed the read-only harness ACL.
The same published adapter was then installed in an isolated readable prefix;
provider/model configuration was preserved. The substantive plan needed two
correction rounds before acceptance.

The two-build service-worker browser test first failed because the generated
client's rapid/external update path did not reload the page after activation.
The application now owns explicit native registration and reloads this tab only
after its own update action. The same unchanged two-build test then passed.

PDF behaviours are explicitly unimplemented in this first core delivery and
remain inconclusive. Emulator/Chromium results do not prove physical Android
installation or tablet-distance readability. The owner operates Cloudflare Pages
publication; deployment must be observed separately from a source merge.

## Connected journey summary

After `npm run verify:connected`, run `npm run report:connected` and open
`test-results/connected/summary.html`. CI also includes it in the verification
artifact, including when qualification fails. It identifies the committed
selection and reports each outcome only when the source and result receipt
match. A missing, changed or incomplete receipt is shown as unverified. Each
connected run creates a unique subdirectory under `test-results/connected`, or
under the configured `SCOREMAP_TEST_REPORT_DIRECTORY`, preserving prior reports.

The HTML deliberately excludes raw errors, screenshots, video and traces; these
can contain private session or musical data. It does not establish which target
was reached, a real operator deployment, independent review, physical-device
use or human acceptance. Synthetic test names describe expected outcomes;
status alone is not a per-step visual record.
