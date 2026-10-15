# Independent Beta correction verification — not pipeline GO

Exact source0269b2796b127df03a38748e1e208473490dfabc, tree50b4253773e5d8ca5f9b6996e0a746e999432715, parent64f5e278b2e04e6d10d3a77e2ac98dbf0ffeb0e8. Independently detached `/tmp/roster-pr86-beta-review-0269b27`; neither source checkout was modified. Read exact three-file35+/2− diff and root historical correction report at `/home/mathias/dev/tezos_observatory/briefs/roster-pr86-beta-correction.md`.

The original independent finding is reproducibly corrected: actual evaluate consumer against the unchanged original synthetic negative-label fixture now returns Brier0.25, eligible_for_human_review:false, reason `Brier score is absent or above threshold`, promotion still not-automated. Original fixture/config remain at `/tmp/roster-pr86-linear/briefs/roster-pr86-beta-fixture` and `roster-pr86-beta-config.json`; no hidden test data or implementation copy substituted.

New independent actual commands under Node22.23.3:

| Command | Result |
| --- | --- |
| `rtk npm ci` | exit0;8 packages,0 vulnerabilities; optional esbuild postinstall blocked, subsequent real build passes. |
| `rtk proxy node --test scripts/chamallaw-shadow-report.test.js scripts/chamallaw-shadow-gate.test.js` | exit0;6/6, no skipped/cancelled. |
| Direct actual-module assert probe using original evaluate fixture/config | exit0; original mean/Brier/gate repro GREEN. Additional symmetric values from MIN_VALUE through MAX_VALUE yield0.5, asymmetric probabilities remain finite/in-range and sum with swapped complement to1 within1e−15, invalid zero/negative/NaN/Infinity remain null. |
| `rtk npm run build:ts` | exit0. |
| `rtk proxy npm test` captured to `/tmp/roster-pr86-review-beta-0269-full.log` | exit0;42 Node runner summaries,636 tests/pass,0 fail/cancelled/skipped, final harness-sync pass. Eight existing unused-schema-value warnings and absent advisory cost log remain qualified. |
| `rtk git diff --check 64f5e278 0269b279` | exit0. |
| Final HEAD/tree/status | exact source/tree above; clean after removing only generated untracked Python bytecode. |

The correction scales before addition, so finite-positive symmetric inputs no longer overflow. It preserves the accepted domain without inventing an upper bound. Finding closure is supported for the exact correction, subject to remaining full canonical review requirements. No new exact-candidate QA verdict is claimed; QA64 does not cover this source change.

Canonical review is still pending reviewer/architect/spec-compliance/code-quality specialist invocations, normalizer, convergence and gate-before-verdict persistence. No GO review.json or review state event emitted here. The real prior OpenCode attempt against64 remains degraded due API unavailability, not PASS; retain its exact journal and source/prompt attribution if carried across this same review cycle, never invent a new runtime execution on0269.
