# S9 independent review corrections — finite clocks and calendar dates

Status: INTERIM implementation correction verified; parent S10 and independent final review/QA remain open. Baseline/pre-fix source is `acef9685edddf231c952f0119e97e49d58db7227`. No deployment or parent completion event is emitted.

## R1 — finite legitimate pre-boundary clock estimates

The independent reviewer reproduced three genuine assertion failures: `roundSchedule(10000,1,2|3|20,9000|10000)` returned NaN round/start/end. The existing rationalized quadratic divided0/0 at zero elapsed with a nonpositive linear coefficient. A real production-page fixture with minimum1/increment3 and client clock60s behind its observed header independently showed “estimated round NaN” and “Invalid Date” in both Chromium and Firefox. This qualifies a supported numerical/input boundary, not an incident on the ordinary public6/3 configuration.

The estimator now handles zero elapsed directly and uses the subtraction-free positive-root form when the linear coefficient is negative, retaining the rationalized form for nonnegative coefficients. No arbitrary constraint on increment versus minimum was introduced. Tests cover time before/at the anchor, tiny positive elapsed, immediately before/at/after the first boundary, and the existing cumulative long-round cases. Selected observed identities and conditional branch facts are unchanged by clock estimation.

Owner RED: `npx vitest run tests/unit/roundSchedule.test.ts --reporter=json --outputFile=/tmp/observatory-s9-clock-zero-red.json` produced3 completed AssertionError cases against the baseline. The independent production RED preceded the owner correction; the adapted real-page regression now verifies finite round0 with both engines.

## R2 — renderable capture and original receipt dates

A numerically safe integer is not necessarily a renderable calendar date. Independent review and owner reproduction showed that MAX_SAFE_INTEGER capture dates entered the actual store and then reached `toISOString()`; proposer and timing-parameter original receipt dates exposed the same exported API boundary. This is caller-poison scope; ordinary Date.now factories usually produce valid dates, which does not waive admission invariants.

The existing protocol timing calendar boundary is now shared by conditional timing and capture validation. Capture wall time and displayed known proposer/timing receipt dates must be safe milliseconds inside the inclusive JavaScript renderable calendar range±8,640,000,000,000,000. Both endpoints remain accepted, the next millisecond outside either endpoint is rejected, and original dates/sources are never repaired or relabelled. Failed actual store capture publishes no opportunity history.

Owner RED: actual store/API/calendar-boundary suite produced4 completed assertion failures (`/tmp/observatory-s9-calendar-red.json`); both displayed nested receipt fields also failed before guards (`/tmp/observatory-s9-receipt-calendar-red.json`). Type/import/fixture failures were not classified as behavioral RED. The corrected real-store/domain/math suite passed103 tests before final whole gates.

## Exact corrected-state verification

Under Node22.23.3:

- `npm run check`: exit0.
- `npm test`: exit0,257 tests /19 files.
- `npm run test:e2e`: exit0,132 scenarios in Chromium + Firefox,1.4m. The new supported timing/client-clock case and existing history/source/lifecycle/progression/comparison regressions ran on an immutable application.
- `npm run build`: exit0.
- Original CHECK12: exit0,29 assertion groups.
- Original CHECK15 with both required engines: exit0,2 completed scenario groups.
- Original CHECK33 with both required engines: exit0,2 completed scenario groups.
- Original CHECK34 with both required engines: exit0,31 assertion groups, including new finite-clock and exact calendar-boundary native assertions.
- `git diff --check` and exact manifest scope check: exit0.

The S9 base’s all38-command inventory and source hashes remain historical evidence for that source. The changed numerical paths were rerun above; S10/final QA must execute all38 originals against the final accepted tree. Old screenshot files were restored because these corrections change supported temporal boundary handling, not the approved presentation artifacts. S10 parity/glossary draft files are excluded from this correction commit. No library/dependency/framework was added; the correction reuses the existing domain arithmetic and calendar bound.
