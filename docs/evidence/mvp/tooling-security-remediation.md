# Tooling matcher remediation

Issue: [#38](https://github.com/juangcarmona/scoremap/issues/38). Candidate: [PR #37](https://github.com/juangcarmona/scoremap/pull/37).

## Cause and replacement

The mandatory high/critical tooling audit refused picomatch 4.0.7 and the nested 2.3.2 used by micromatch. Both installed versions timed out on the single-branch repeated-extglob attack in a bounded Node subprocess. The upstream [GHSA-fc5q-39xc-vjpf advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) still lists no official patched release on 2026-11-18.

Use the exact npm override `picomatch: npm:@ryotsu/picomatch@4.0.7-a` throughout the development tool tree. This is an explicitly named third-party fork, not an upstream release or a version relabel. The lockfile binds its registry tarball with SHA-512 integrity `sha512-JroBFEmaejC7szGSfqOhF1QZHLKvX2wTA1+fWyfkpy3BjzdQKNPLKa2FtgeKVUDy5/UPUNkXEeCHJ5ZRBMLTVA==`. Its published executable files match [source commit 3ab5a7627d480259e3d9ca67fbc14c125d374f0e](https://github.com/ryotsu-kankichi/secured-picomatch/tree/3ab5a7627d480259e3d9ca67fbc14c125d374f0e). MIT authorship and license remain present; the package has no runtime dependencies or install hooks.

Source inspection compared every shipped executable file with upstream 4.0.7. Only `lib/parse.js` and `lib/constants.js` differ. The security change removes redundant outer repetition when a single star-bearing branch can safely absorb concatenated matches. Unsupported complex branches become literals. The fork additionally corrects newline globstars, POSIX bracket negation/punctuation and the `**.extension` fast path. Entry points, scan, matcher and utility files are unchanged. Capture substrings and unsupported complex extglob matching can change. The explicit upstream safeguard opt-out remains unsafe and must not be enabled.

This temporary build dependency substitution preserves application dependencies and all existing tool versions. It replaces both vulnerable major versions; retaining the nested old copy would leave ProductShape/markdown tooling exposed. Prefer the official dependency again when its published fix passes these regression and adopter checks. Blind audit-force downgrades were rejected because they change the selected Vite/PWA, OpenSpec and markdown tooling contracts.

## Executed verification

- Before replacement: both installed matcher versions timed out after 2.5 seconds on the attack; the consumer-identity check refused the old dependency tree.
- After a clean `npm ci --ignore-scripts` with npm 10.9.4: bounded attack/compatibility and complete consumer-resolution/integrity tests passed. The tests exercise micromatch as well as the actual installed matcher and refuse any surviving old copy.
- The exact fork source suite passed all 2,004 tests under Node 24; its executable files match the reviewed npm tarball.
- `npm run verify:security` passed unchanged runtime and high/critical tooling audit thresholds plus complete browser/build SBOM/license validation. The tooling audit reported 7 low, 10 moderate, zero high and zero critical findings; the runtime audit reported zero. No advisory is filtered, ignored or waived.
- `npm run verify` passed the full ProductShape, citation, ArcShape, Lighthouse, OpenSpec, musical catalogue, backend/compiler refusal, deployment, security, frontend boundary and application checks.

The bounded regression and consumer checks run before the existing audit on every `verify:security`. Full adopter verification and native CI remain separate execution results. Source inspection by the implementing agent is not independent implementation review. This change does not update the existing owner trial or its separately qualified deployment packet.
