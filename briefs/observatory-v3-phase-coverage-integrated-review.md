# Independent phase coverage integrated review — correction still required

**NO-GO** at immutable `ce3bd5c4e99e0bb28aacc510608d67a852e9f543`, bounded to domain phase parsing/coverage/store plus `src/monitor/networkMonitor.ts` and phase LIVE/pin/committee consumption in `src/main.ts`. No entire V3 or unrelated matrix/layout acceptance. Prior review source `83b8f72fa628bc2f7bf48f3ba62d9ce08a0eecd7`, base `a97efb3f56c8b76d2ce1e88d1c05719a3e37992d`; prior NO-GO retained at `/var/tmp/phase-domain-review-83b8f72.md`.

## Open findings

1. **Medium — src/main.ts:186 and :376.** Avoiding global stale state for a classified incomplete phase correctly preserves the complete phase, but the explicit retry control requires `live.error || live.coverageStale` (or sourceTarget equivalent). Neither is set now. A malformed preattestation snapshot with existing observed pre power 3/5 and justified attestation zero therefore has no “Retry selected observer context” action, so the malformed phase cannot obtain a fresh same-context snapshot. This regresses the existing bounded manual retry workflow (foundations C-10/FR-035). Expose the action when either phase proof is incomplete without making the valid phase stale; keep >=15-second cooldown and no automatic reads. Reviewer production probe fails identically in Chromium and Firefox after adapting the old test’s obsolete attestation-unavailable expectation to correct attestation zero. Evidence: `/var/tmp/phase-integrated-review-refresh-red.log`; reviewer test `tests/e2e/reviewerPhaseCoverage.spec.ts:16`.

2. **Medium — tests/e2e/dashboard.spec.ts:437.** The preexisting malformed-pre scenario still expects attestation unavailable. With independently complete attestation proof, zero is required. Both engines fail this stale assertion; update the expected opposite-phase zero and retain positive partial, unavailable malformed-phase absence, and bounded manual refresh assertions. Do not delete the regression test to obtain green.

**Other observed gate failure, outside phase scope:** Firefox V3 AC-13 fails full dashboard regression (scroll shifts 627px) and isolated rerun (expected right transition unavailable). Reported to owner; not dismissed as preexisting or certified by this scoped review. Chromium S9 missing baking-rights timer failed full run but passed isolated. Full evidence remains retained; root must resolve/qualify the wider gate before V3 acceptance.

## Resolved prior findings

- Previous high monitor error: same independent real-monitor probe is now GREEN. A classified malformed phase no longer marks the complete phase stale. Added shared-invalidity and explicit snapshotError cases still mark coverage stale and retain positive observed power.
- Previous low generic helper type unsoundness: literal `complete:true` cannot survive invalidation as a `true` type anymore. Strict check rejects reviewer fixture with TS2322 (`boolean` not assignable to `true`), exit2 as expected. Fixture preserved at `/var/tmp/reviewerPhaseTypeProbe.expected-fail.ts` and removed from normal check inputs.

## Independent evidence

Own detached checkout `/var/tmp/phase-coverage-review`; source tracked files are exactly immutable ce3bd5c, no src diff. Only independent tests, this report and browser-generated PNGs are local additions. Root and author mutable checkouts untouched. Read RTK, reviewer skill, authority, TypeScript rules, correction brief and exact foundations/V3 phase contracts; examined full domain diff and phase consumer/monitor changes. Author source report/logs actually showed 288 unit and 158 browser passes before integration.

13 independently authored unit cases now pass: parser mixed-envelope discard classification, legacy callback, unknown kinds, immutable shared invalidation, legacy fail-closed fallback, receipt ordering, context rejection, interruption/replay, eviction/as-of retention, actual RPC pending malformed/mixed/empty/unclassifiable/unrelated/cap bodies, actual monitor independent phase authority, shared invalidity and transport error. No test infers a phase from success of the other. Two independently authored production browser scenarios each run both engines: historical pin retains original independent zero after source interruption while Follow live withdraws zero, malformed phase stays unavailable throughout. These four pass. A third browser scenario independently exposes missing manual refresh and fails both engines.

All gates use Node22 v22.23.3 via `/tmp/context-review-node22-bin`:

| Command | Exit | Result / log |
|---|---:|---|
| `rtk npm ci` | 0 | `/var/tmp/phase-integrated-review-ci.log` |
| `rtk npm run check` | 0 | `/var/tmp/phase-integrated-review-check.log`, final repeat `/var/tmp/phase-integrated-review-final-check.log` |
| `rtk npm test` | 0 | final 301 tests (288 original +13 independent), `/var/tmp/phase-integrated-review-final-unit.log` |
| `rtk npm run build` | 0 | `/var/tmp/phase-integrated-review-build.log` |
| `rtk npm test -- --run tests/unit/reviewerPhaseCoverage.test.ts` | 0 | 13 passed, `/var/tmp/phase-integrated-review-adversarial.log` |
| Strict check with literal type-error fixture | 2 expected | `/var/tmp/phase-review-type-fixed.log` TS2322 |
| `rtk npm exec playwright test -- --config playwright.v3.config.ts --grep "V3 AC-10 independently"` | 0 | production dist, 4 passed, both engines, `/var/tmp/phase-integrated-review-ac10.log` |
| `rtk npm exec playwright test -- --config playwright.v3.config.ts tests/e2e/reviewerPhaseCoverage.spec.ts` before retry probe added | 0 | independent production as-of/interruption 4 passed, `/var/tmp/phase-integrated-review-asof-browser.log` |
| `OBSERVATORY_TEST_PORT=5191 rtk npm exec playwright test -- tests/e2e/dashboard.spec.ts` | 1 | 160 passed/4 failed, `/var/tmp/phase-integrated-review-dashboard.log` |
| Isolated S9 missing-rights and V3 AC-13 dashboard rerun | 1 | 3 passed/1 failed, `/var/tmp/phase-integrated-review-failure-rerun.log` |
| Production reviewer browser `--grep "review malformed phase"` | 1 | both engines fail missing retry control, `/var/tmp/phase-integrated-review-refresh-red.log` |

Earlier exact-domain Node22 clean ci/check/unit/build and full `rtk npm run test:e2e` passed 158 browsers; details are in prior report. No separate lint command exists. The integrated full matrix/native broader V3 suite is outside this bounded review and has not been accepted. Tests were added only as reviewer probes; no infrastructure/library dependency was introduced.

Correctness, source/context qualification, lifecycle, bounds, historical immutability, test quality, TypeScript API safety and phase scope were reviewed. Overall recommendation: **changes required**. Supply a new immutable correction after fixing manual refresh and the stale original test; repeat the reviewer browser failure, relevant gates and separate fresh QA. No publication/deployment approval is implied.
