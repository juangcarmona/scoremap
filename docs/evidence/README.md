# ScoreMap delivery evidence

- [Bootstrap and dependency receipts](bootstrap/backlog.json).
- [Initial independent plan review](reviews/plan-round-1.json): request changes.
- [Second plan review](reviews/plan-round-2.json): one remaining correction.
- [Accepted third plan review](reviews/plan-round-3.json): no findings.
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
