# Existing calculation, presentation, and test patterns

Source inspected: repository `HEAD` `82196fd2ce94d13bc86a9332161ce69bac172b6a`. File references below are from that source revision. This is limited to questions 5, 6, and 7 in `questions.manifest.json`.

## Calculations and timing tests (question 5)

The schedule implementation converts elapsed wall-clock milliseconds from a reference timestamp into protocol rounds. `roundSchedule` clamps negative elapsed time to zero, uses a constant-duration division when the increment is zero, and otherwise solves the cumulative round-duration equation; it then corrects exact boundary rounding and returns `startedAt`/`endsAt` only when the result is safe. The core calculation is visible at [roundSchedule.ts](/home/mathias/dev/tezos_observatory/src/consensus/roundSchedule.ts:22):

```ts
const elapsed = Math.max(0, (now - anchor) / 1000);
const before = (r: number): number => secondsBeforeRound(r,minimum,increment);
...
const startedAt=anchor+before(round)*1000,endsAt=anchor+before(round+1)*1000;
```

`secondsBeforeRound` uses cumulative arithmetic duration `round*minimum + increment*round*(round-1)/2` ([roundSchedule.ts](/home/mathias/dev/tezos_observatory/src/consensus/roundSchedule.ts:5)). Conditional same-level and successor boundaries use the selected reference round and execution timing constants, with successor timing parameters governing the predecessor-round term too ([roundSchedule.ts](/home/mathias/dev/tezos_observatory/src/consensus/roundSchedule.ts:70)). `protocolRoundStart` adds the cumulative target-round durations to that boundary ([roundSchedule.ts](/home/mathias/dev/tezos_observatory/src/consensus/roundSchedule.ts:100)). These are protocol schedule estimates, distinct from an observed block-to-block duration calculation.

Unit cases cover exact boundaries, cumulative durations through round 121, zero increment, future round-zero anchors, large increments, unsupported inputs, and safe-calendar overflow ([roundSchedule.test.ts](/home/mathias/dev/tezos_observatory/tests/unit/roundSchedule.test.ts:5), [roundSchedule.test.ts](/home/mathias/dev/tezos_observatory/tests/unit/roundSchedule.test.ts:16), [roundSchedule.test.ts](/home/mathias/dev/tezos_observatory/tests/unit/roundSchedule.test.ts:47)). For example, an elapsed instant at 6,999 ms remains round zero, while the 7,000 ms boundary is round one; cumulative duration produces round 121's next interval as 369,000 ms ([roundSchedule.test.ts](/home/mathias/dev/tezos_observatory/tests/unit/roundSchedule.test.ts:16)).

The timestamp guard accepts calendar-valid offset timestamps and rejects invalid dates, absent timezone markers, and invalid months ([guards.test.ts](/home/mathias/dev/tezos_observatory/tests/unit/guards.test.ts:141)).

## UI display patterns (question 6)

The network panel separates applied block context, proposal context, stream freshness, and an independent timing estimate. Its initial presentation uses explicit unavailable/loading text, including “Last applied block unavailable,” “No observation yet,” and “Independent clock estimate unavailable” ([dashboardView.ts](/home/mathias/dev/tezos_observatory/src/dashboardView.ts:220)). It also provides a disclosure named “Sources & observation evidence,” with fields for primary source, applied head, block hash, last successful head, last operation, block age, and snapshot age ([dashboardView.ts](/home/mathias/dev/tezos_observatory/src/dashboardView.ts:244)).

Each UI tick calculates observation age from a monotonic receipt time, snapshot age from a separate monotonic time, and block age from wall-clock observation time plus elapsed monotonic age. Missing inputs display “Unavailable”; ages are clamped to nonnegative values ([dashboardView.ts](/home/mathias/dev/tezos_observatory/src/dashboardView.ts:260)). The independent clock estimate renders the level, estimated current/next rounds, next boundary timestamp, and evidence attribution, while explicitly labeling it separate from selected branch deadlines ([dashboardView.ts](/home/mathias/dev/tezos_observatory/src/dashboardView.ts:267)).

Status labels distinguish “Observed advance,” “Progress unknown,” “Prediction elapsed,” and “RPC coverage degraded” ([dashboardView.ts](/home/mathias/dev/tezos_observatory/src/dashboardView.ts:273)). Timing absence renders “Timing unavailable” and “Independent clock estimate unavailable” ([dashboardView.ts](/home/mathias/dev/tezos_observatory/src/dashboardView.ts:267)).

Responsive UI coverage checks 1440 px and 390 px widths for horizontal clipping and gauge visibility. A mobile scenario checks network selection and disclosure persistence across reload, then verifies pause state in the connection line ([dashboard.spec.ts](/home/mathias/dev/tezos_observatory/tests/e2e/dashboard.spec.ts:227)).

## Fixture and deterministic test patterns (question 7)

`roundSchedule.test.ts` uses fixed numeric anchors and expected timestamps, including exact-boundary and high-round cases, rather than depending on live provider values ([roundSchedule.test.ts](/home/mathias/dev/tezos_observatory/tests/unit/roundSchedule.test.ts:9)). The end-to-end dashboard tests use a page clock and synthetic headers with explicit levels, rounds, hashes, predecessors, and timestamps. They exercise conditional deadlines, elapsed prediction, observed same-level and next-level advances, same-height reorganization, skipped levels, and a timing-constants HTTP 503 ([dashboard.spec.ts](/home/mathias/dev/tezos_observatory/tests/e2e/dashboard.spec.ts:914), [dashboard.spec.ts](/home/mathias/dev/tezos_observatory/tests/e2e/dashboard.spec.ts:976)).

The timing-failure case retains the applied level while showing unavailable timing and “Progress unknown”; a later delivered head can still advance the applied level, and a stream interruption produces the degraded-coverage status ([dashboard.spec.ts](/home/mathias/dev/tezos_observatory/tests/e2e/dashboard.spec.ts:919)). Other deterministic UI cases inject large protocol timing values and check that the clock estimate does not render `NaN` or `Invalid Date`, while unsupported computed boundaries remain unavailable ([dashboard.spec.ts](/home/mathias/dev/tezos_observatory/tests/e2e/dashboard.spec.ts:989), [dashboard.spec.ts](/home/mathias/dev/tezos_observatory/tests/e2e/dashboard.spec.ts:1000)).
