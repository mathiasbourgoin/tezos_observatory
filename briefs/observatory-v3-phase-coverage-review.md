# Independent phase coverage correction review

**GO — bounded phase correction only** at immutable `49c74935ae82f5ff0f48dc50b9ace6c76caf4dd0` (integrated parent `ce3bd5c4e99e0bb28aacc510608d67a852e9f543`; domain `83b8f72fa628bc2f7bf48f3ba62d9ce08a0eecd7`, equivalent cherry `37e3940`; base `a97efb3f56c8b76d2ce1e88d1c05719a3e37992d`). No unresolved finding remains in the assigned domain/monitor/LIVE/pin/committee phase scope. Fresh independent QA must follow. This is not entire V3 acceptance or publication/deployment approval.

## Findings and resolution

- **Resolved high:** globally incomplete but independently valid phase snapshots previously flowed through monitor error handling and became globally stale. Reviewer-owned actual NetworkMonitor probe was RED at83b8f72 and is GREEN at49c7493. Classified partial failure now uses private `PartialPhaseCoverageError`; the error handler records retry eligibility through the existing reconciler failed-key ledger while `ObservationStore.fail(..., "preserve-received-phase")` retains already received phase authority. Actual transport/snapshotError and shared invalidity retain default invalidation.
- **Resolved medium:** ce3bd5c hid explicit retry for the malformed phase because neither error nor stale was recorded. Same independent production browser probe was RED in both engines and is now GREEN. It verifies partial pre3/5 with independently justified att0/5, missing malformed-phase absence authority, explicit retry, early click rejection, no delayed or automatic read after20 seconds, then exactly one reread from a fresh click.
- **Resolved medium:** original malformed-phase test was retained and adapted to justified opposite-phase zero, preserving positive partial/provenance checks, complete opposite-phase missing delegates, and strengthened early-click/no-automatic-read assertions. It passes both engines on production dist and intended dev server.
- **Resolved low:** helper generic return no longer incorrectly preserves literal `complete:true`. Reviewer expected-failure fixture rejects at exact49c7493 with TS2322, exit2. Ordinary strict checking passes with that negative fixture outside inputs.

No other domain runtime or phase consumer finding was established. Review covered correctness, source/context safety, abuse/bounds, receipt ordering, lifecycle, history immutability, tests, TypeScript API maintainability and assigned scope.

## Independent probes and source qualification

Own isolated detached checkout `/var/tmp/phase-coverage-review`; tracked production source and author test are unchanged from exact49c7493 (`git diff --exit-code -- src tests/e2e/dashboard.spec.ts` →0). Reviewer-only tests and browser-generated artifacts remain local. Root and mutable author worktree were untouched. Read RTK, reviewer skill, authority, TypeScript rules, correction brief and exact foundations FR-015–021/093 plus V3 AC-10. No new infrastructure or dependency was introduced.

13 independently authored unit cases cover mixed-envelope discard classification, legacy callback compatibility, unknown kinds, immutable shared invalidation, legacy fail-closed fallback, receipt ordering, context rejection, interruption/replay, retained-fact eviction/as-of, actual pending RPC malformed/mixed/empty/unclassifiable/unrelated/10001-operation-cap bodies, actual monitor independent authority, shared invalidity and explicit transport error. The tests additionally prove `preserve-received-phase` cannot clear preexisting staleness, replay/re-admission cannot restore authority, and a genuinely newer coherent reread can restore live coverage while the captured older receipt remains immutable. Positive observed power remains available under partial coverage. Full unit suite includes producer regressions.

Reviewer-only production browser tests exercise reciprocal pre/att incomplete phases: justified zero versus unavailable, pin retention of historical zero through source interruption, Follow live withdrawal of stale zero, and bounded manual retry. Six actual browser tests pass, Chromium and Firefox. Author's original production AC-10 reciprocal LIVE/pin tests independently rerun and pass; committee rows distinguish snapshot absence from partial/unavailable.

## Exact commands and results

Node22 v22.23.3 via `/tmp/context-review-node22-bin` PATH throughout final checks.

| Command | Exit | Evidence |
|---|---:|---|
| `rtk npm ci` | 0 | `/var/tmp/phase-final-review-ci.log` |
| `rtk npm run check` | 0 | `/var/tmp/phase-final-review-check.log` |
| `rtk npm test` | 0 | `/var/tmp/phase-final-review-unit.log`:301 passed (288 original+13 reviewer) |
| `rtk npm run build` | 0 | `/var/tmp/phase-final-review-build.log` |
| `rtk npm test -- --run tests/unit/reviewerPhaseCoverage.test.ts` | 0 | `/var/tmp/phase-final-review-adversarial.log`:13 passed after final reread/as-of assertions |
| Strict check with negative literal helper fixture temporarily included | 2 expected | `/var/tmp/phase-final-review-type-negative.log`:TS2322; fixture then removed |
| `rtk npm exec playwright test -- --config playwright.v3.config.ts tests/e2e/reviewerPhaseCoverage.spec.ts` | 0 | `/var/tmp/phase-final-review-browser.log`:6 passed, production dist, both engines |
| `rtk npm exec playwright test -- --config playwright.v3.config.ts tests/e2e/dashboard.spec.ts --grep "malformed source coverage stays partial|V3 AC-10 independently|S9 missing baking rights"` | 0 | `/var/tmp/phase-final-review-production-regression.log`:8 passed, both engines |
| `OBSERVATORY_TEST_PORT=5191 rtk npm exec playwright test -- tests/e2e/dashboard.spec.ts --grep "pinned phases preserve their independently captured quorum|malformed source coverage stays partial"` | 0 | `/var/tmp/phase-final-review-dev-regression.log`:4 passed, both engines |

One exploratory production selection also included dev-module-instrumented pinned-quorum tests: `/var/tmp/phase-final-review-regression.log` exit1,8 passed/2 infrastructure failures importing `/monitor/networkMonitor.ts` (404 on dist). This was a reviewer mode-selection error, corrected by the intended dev-server run above; those two tests pass there. It is not counted as production phase success.

Earlier exact-domain83b8f72 clean Node22 full browser gate passed158. Integrated ce3bd5c full dashboard gate had160 passed/4 failed, honestly retained in `/var/tmp/phase-integrated-review-dashboard.log`:two stale malformed expectations now corrected, a Chromium S9 timer failure now passes intended isolated and production runs, and a Firefox AC-13 failure. Prior reports are preserved at `/var/tmp/phase-domain-review-83b8f72.md` and `/var/tmp/phase-integrated-review-ce3bd5c.md`.

## Wider unresolved gate

Firefox V3 AC-13 failed the ce3bd5c full dashboard run (scroll displacement627px) and isolated rerun (expected RIGHT transition unavailable), evidence `/var/tmp/phase-integrated-review-failure-rerun.log`. This is outside assigned phase correction and remains unresolved for wider V3 delivery; this report neither dismisses it as preexisting nor certifies it. Full V3 matrix/native suite, all38 interface delivery and entire V3 acceptance are not established by this scoped GO. No separate lint command exists.

Overall recommendation: **approve the exact bounded phase correction for independent QA**. No additional phase-scoped correction is requested.
