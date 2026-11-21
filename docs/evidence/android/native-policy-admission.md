# Native implementation policy admission

## Reproduced failure

The first native implementation attempt for [#84](https://github.com/juangcarmona/scoremap/issues/84),
[44945716955](https://github.com/juangcarmona/scoremap/actions/runs/44945716955),
failed without creating Android source or publishing a pull request. Its host
guard reported `Required verification input is absent: src/android/settings.gradle.kts`.
The retained attempt also contains separate baseline verification failures;
this policy repair does not convert that attempt into a success.

SDLC 0.30.1 treats `verification.paths` as protected verification inputs.
Literal entries must exist, and creating a file under a protected directory
requires an exact `verification.corrections` reason. The previous defaults
required fifteen future Android files and admitted no test authoring. A plan
does not itself authorize those corrections.

## Operator correction

The revised defaults retain the five existing required literals, all seventeen
protected directory prefixes, every declared check and independent review.
They remove only the fifteen absent future literals. Root and Android script
directories are protected as well. Thirty-nine exact filenames admit the
planned native tests, convention/quality inputs and additive command wiring;
the reasons constrain their purpose. Existing legacy tests, this policy
regression and the package lock have no worker correction exception.

The exact filenames in `.lighthouse/implement.json` are an implementation-plan
input. Create them only when a slice has real consumers and assertions; empty
modules, placeholder suites, generated test oracles and disabled checks do not
satisfy acceptance. Later extensions preserve accepted assertions. Additional
protected filenames require a separately reviewed source admission.

The operator qualification pins the published SDLC package to 0.30.1 and calls
its actual `verificationIntegrity` and policy validator. Since that internal
guard has no public export, the test resolves its sibling source from the
public package entry and asserts the exact version. This deliberate test-only
compatibility coupling must be requalified on an SDK upgrade.

Actual Node 24.22.1 execution before the policy edit produced six failures and
six passes, including the same absent-file diagnostic and refused creation of
the intended tests. After the edit, all twelve cases passed with no skips.
Cases cover creation receipts, immutable legacy and unadmitted new inputs,
required-file deletion, file modes, unchanged commands/review and malformed
policy bounds. These are policy qualification results, not native product
coverage or an APK build.

## Browser check source preservation

A complete clean-baseline rehearsal then passed `npm run verify` and all 48
browser cases, but exposed additional SDK admission problems: five browser
captures overwrote tracked evidence, and the SDK-selected browser cache was
unignored. Its independent host checks use fresh containers and reject any
source digest change, even if a changed screenshot is within ordinary scope.

The browser command now installs the browser selected by the locked Playwright
dependency before running the same tests. Its workspace cache is ignored at
the exact `/.cache/ms-playwright/` path. Existing capture calls now write into
ignored `test-results/browser/`, retaining their assertions and capture content;
historical committed screenshots are preserved. Three added regressions first
failed and then passed, giving fifteen passing policy/runtime-input cases.
The inventory case calls the actual SDK source scanner and digest on a
synthetic filesystem. Qualification of the owning SDK's separate-container
host-check route remains distinct from the earlier persistent-container
baseline rehearsal.

## Fresh native admission

The current #79 parent is bound to its original source revision. Released
SDLC 0.30.1 loads child policy from that frozen default-branch source and permits
only accepted child merges on the epic branch. An operator policy commit there
would neither update authority nor preserve valid aggregate history.

Integrate this operator correction through the ordinary enforced pull-request
gates before creating a fresh native parent/source admission. Preserve #79,
its eight original child issues, branch and actual attempt records as historical
evidence; do not retarget their receipts or claim their acceptance. The fresh
parent retains the accepted product model and eight-stage dependency graph.
The owning controller must create and authenticate its new children. This is
a technical execution recovery; it does not repeat ProductShape apply or
change the accepted MVP.

The replacement worker image is qualified and selected separately outside Git.
Independent review, full declared checks, integration, actual native builds,
device journeys, signing and physical tablet acceptance remain distinct facts.
