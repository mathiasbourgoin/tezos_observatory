# QA Brief — observation-label-hotfix

**Date:** 2026-10-14T19:07:00.589467+00:00
**Status:** GO ✅
**Round:** 1 (qualifying 0/5)

## Round state

Fresh cycle 1, round 1; canonical upstream check-qa-convergence exit0, no warnings or violations. Maintained canonical CLI reused because consumer bundle currently omits this helper; no local implementation workaround.

## Quality Gates

Actual Node22.23.3, isolated clone /tmp/observatory-hotfix-qa-zf5y2r92/repo, npm10.9.9 direct CLI. Final subprocess PATH uses Node22 then /usr/bin; Vite child npm12 executes Node22.

| Gate | Command | Result | Duration | Raw evidence |
|---|---|---|---|---|
| install | `npm ci` | PASS exit 0 | 0.63s | [install log](/tmp/observatory-hotfix-qa-zf5y2r92/install.log) |
| build | `npm run build` | PASS exit 0 | 0.395s | [build log](/tmp/observatory-hotfix-qa-zf5y2r92/build.log) |
| typecheck | `npm run check` | PASS exit 0 | 2.36s | [typecheck log](/tmp/observatory-hotfix-qa-zf5y2r92/typecheck.log) |
| unit | `npm test` | PASS exit 0 | 0.484s | [unit log](/tmp/observatory-hotfix-qa-zf5y2r92/unit.log) |
| browser | `npm run test:e2e (PATH repaired)` | PASS exit 0 | 7.453s | [browser log](/tmp/observatory-hotfix-qa-zf5y2r92/browser-retry.log) |

Whitespace: `git diff --check -- src/main.ts src/dashboardView.ts tests/e2e/dashboard.spec.ts package.json package-lock.json vite.config.ts` exit0. No standalone formatter/linter documented; typechecking remains strict.

Initial browser gate failed before tests due isolated npm launcher environment; stopped then repaired QA PATH without application changes. Full raw failure: [/tmp/observatory-hotfix-qa-zf5y2r92/browser.log](/tmp/observatory-hotfix-qa-zf5y2r92/browser.log). Retry ran all26 tests successfully. This was environment repair, not a passing first attempt.

## Tests: detail

38 unit tests across13 files and26 Chromium/Firefox tests passed; 4 new browser cases. Production stalled fixture asserts primary applied5489251/round101, secondary scheduled successor5489252/estimated37, block timestamp separate from fresh RPC message, both gauges unavailable. Screenshots inspected for both browsers confirm1m44s and20:56:15 boundary. Malformed payload vote cannot establish unknown group; proposalA plus votesB labels observed votes, not proposalB. Genuine preattestation group still produces600/30000 measured power and phase-specific attestation zero. Existing transitions, historical peaks, pause/mobile selection and clipping assertions pass.

Screenshots: `/tmp/observatory-hotfix-qa-zf5y2r92/repo/test-results/dashboard-production-stall-9ffdb-d-101-with-no-measured-zero-{chromium,firefox}/stalled-successor-hotfix.png`.

## Provenance

HEAD `d9a58f2e072d640677782afb0427157183c99f80`, dirty exact six-file patch SHA256 `0dbc6bc0067c18e36bfe218b81aabe0a3d55546e6d81e0210615ed136cdcabea`. Whole tested file hashes in sibling qa.json; rechecked against root after gates and match independent review scope. Build version string is HEAD only, not a claim of published patch.

## Conditional gates and limitations

Claims reconciler: legacy/no-managed-claims, fresh:true. Spec runnable checks skipped: no task spec (FAST). Code-intel: `SKIP: no code-intel block`, `RESULT: skip`. TUI skipped: browser app. Cross-runtime actual availability probe returned available; extra rerun explicitly waived by delegated root for urgent narrow hotfix; not PASS. No task context manifest present. No custom skill hooks present.

Mocks exercise production app and stream paths, not live RPC coverage. Known mobile header text overlap remains out of hotfix scope. Published revision8e12e24 remains separately controlled; this QA does not prove remote publication/deployment.

## Verdict

**GO** — root may proceed to reviewed concrete delivery decision under retained maintainer publication authority.
