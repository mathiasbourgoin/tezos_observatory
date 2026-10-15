# S9 independent complete review

**Recommendation: APPROVE — INTERIM S9 only.** Exact reviewed source: `b964fed57cacbc3c33174f4a4e00755a9c6f94bf`, parent `212bbe90b53003353e6c8be4bdb7be3bd7ac4a9a`; complete S9 diff from S8 `cc00a78de385d226fd804ec232ff64cd6c534da6`. No unresolved actionable finding remains in this reviewed scope. This does not close S10, fresh whole-programme review, separate QA, ASTRA acceptance or deployment.

The reviewer used detached `/tmp/observatory-s9-review-b964fed`, never the owner's mutable checkout. Final HEAD matches the SHA above and tracked status is clean after restoring temporary tests, isolated browser configuration and generated screenshots. Earlier detached `acef968` and `212bbe9` review checkouts were also restored. This report is the sole root write; no application edit, commit, integration or remote action was performed.

## Authority and scope

Reviewed against the accepted [specification](../specs/observatory-foundations.md), [formal requirements](../roster/observatory-foundations/spec-formalized.md), [plan](observatory-foundations-plan.md), [S9 preparation and activation trace](observatory-foundations-slice-9-review-preparation.md), [numerical pre-audit](observatory-foundations-numerical-preaudit-s8.md), project authority/TypeScript conventions, and reviewer/architect skills. Technical-document-writing guidance was applied to this report.

The complete 19-file S9 diff includes opportunity arithmetic, typed immutable capture, store/facade admission, RPC branch requests, main selection/lifecycle/clock wiring, the actual reader, semantic checks and regressions. Frozen implementation evidence was read at `briefs/observatory-foundations-slice-9-impl.md`, `briefs/observatory-foundations-slice-9-review-fixes.md` and `briefs/observatory-foundations-slice-9-computed-clock-fixes.md` in the reviewed checkout. Its base `slice-9-checks.json` is historical evidence for acef968, not a substitute for the final independent executions below. S10 documentation checkpoint410a6b was not reviewed or approved by this report.

Scope includes full AC15/33/34, the earlier pinned-phase numerical finding, all newly affected API/store/monitor/reader contracts and all38 existing semantic commands. Passing those commands here does not replace the separately required whole-programme review/QA.

## Reproduced findings and final disposition

All failures below were completed assertions on frozen revisions and were sent promptly to root/owner. Execution failures are distinguished below.

| Finding | Demonstrated failure | Independent final disposition |
| --- | --- | --- |
| N1 — high, pinned phases borrowed one quorum | S8 actual store retained pre600/30000 at threshold20000 beside newer att600 at threshold600. Main/view falsely displayed pre quorum reached at600 instead of deficit19400. This is an admitted correction/historical-consumer case, not a claim that a public chain normally changes an immutable context constant. | **Closed.** Original own production-page repro passes in both engines. Per-phase threshold reaches the reader (`dashboardView.ts:315`); pre retains19400 deficit while att reaches600. Existing independent current/max basis checks did not establish another defect. |
| R1 — medium, finite clock inputs produced NaN | On acef968, `roundSchedule(10000,1,2/3/20,9000/10000)` returned NaN fields. Both real-page engines with minimum1/increment3 and client clock60s behind the observed header displayed estimated roundNaN / Invalid Date. | **Closed.** `roundSchedule.ts:25–30` handles zero elapsed and selects a stable positive-root formula. Same three own unit cases and actual-page case pass. Ordinary boundaries, tiny positive elapsed, zero increment and cumulative long rounds also pass. No arbitrary increment/minimum restriction was introduced. |
| R2 — medium, unrenderable API dates admitted | On acef968, safe-integer MAX_SAFE capture dates entered the actual store; known proposer and timing-parameter receipt dates independently passed capture despite being outside the calendar accepted by `toISOString()`. This is exported API/caller-poison scope, not a demonstrated ordinary Date.now factory incident. | **Closed.** Shared inclusive calendar guard (`roundSchedule.ts:6`, `opportunityFacts.ts:29/37`) rejects invalid capture and displayed original receipt dates without repairing them. Own actual-store/API/receipt cases pass; exact ±8.64e15 endpoints remain accepted and the next millisecond outside either endpoint is rejected. Failed capture publishes no opportunity history. |
| R3 — medium, computed clock endpoint escaped calendar guards | On212bbe9, minimum1/increment8640000000000 with observed100/r0 and client time+5s gave a valid first branch boundary but a scalar clock end beyond the calendar. Both actual readers displayed estimated round1→2 / Invalid Date. | **Closed.** `roundSchedule.ts:34–36` returns unavailable for unsupported round or unsafe/unrenderable endpoints; main handles the optional result at every consumer. Own both-engine repro now passes after waiting for the independently valid branch timer. Valid branch facts remain known; no arbitrary parameter cutoff was added. |
| R4 — medium, independent clock misqualified as an opportunity deadline | On212bbe9, the heading showed18s and “Scheduled opportunity” for an applied-head clock round-end while each selected-relative branch correctly showed12s. It lacked the clock's independent reference/source/context qualification. Both own actual-page qualification assertions failed. Branch arithmetic itself was correct. | **Closed.** `dashboardView.ts:271` visibly identifies “Independent clock estimate”, its next estimated round boundary and separation from selected branch deadlines. `main.ts:435` supplies actual applied reference, observer, parameter responder, target and execution protocol. Own both-engine proof passes; an additional fallback positive shows TzKT observer with Octez parameter responder, preserving their distinct attribution. |

R3's first weak negative assertion completed before the clock model had rendered and passed; it was not used as evidence. Waiting for the rendered estimated round, then independently waiting for a known branch timer, produced the genuine two-engine failures. R4's initial test placed provenance expectations in the caption; equivalent accessible disclosure would have been acceptable. The final implementation exposes these facts visibly in the caption, and no presentation duplication requirement was invented.

## Contract and architecture assessment

- **Arithmetic and protocol applicability:** both selected-relative branches use coherent target execution parameters and an actual timestamp/round basis. Same-level R+1 and next-level round0 coexist; hypothetical selected rounds use a proven parent without fabricating an observed header. Producing and helper-execution protocol are distinguished. Unsupported migration timing remains unavailable while independently proven proposer rights remain usable. No universal activation reset was inferred. The pinned protocol's [round arithmetic](https://raw.githubusercontent.com/tezos/tezos-mirror/5c73fc9ae945fa222307de01c22403526ce197ee/src/proto_025_PsUshuai/lib_protocol/round_repr.ml) independently supports cumulative durations and the predecessor-round term; the [fitness decoder](https://raw.githubusercontent.com/tezos/tezos-mirror/5c73fc9ae945fa222307de01c22403526ce197ee/src/proto_025_PsUshuai/lib_protocol/fitness_repr.ml) supports the full encoded round distinction. This is not certification of every protocol migration.
- **Capture and provenance:** `opportunityFacts.ts` checks concrete observer/anchor/header facts, exact branch target/round, chain, protocol, allowed source, original receipt bindings and timing recomputation, then freezes nested facts. Current and successor contexts need not share the same anchor. API mutation/context negatives and actual-store token/generation tests run against production modules. Rights and timing availability are independent; missing data does not borrow another branch or fabricate zero.
- **Lifecycle and history:** `main.ts:457–501` binds work to selected identity/context, synchronously fences old selection work and rejects late results. Store/facade capture (`observationStore.ts:342`) does not refresh original observation receipt, reorder history or increment newer counts. Historical capture retains as-of deadline/remaining duration/provenance through90s, pause and a wall-clock jump; paused Latest/Follow starts no external reads. Selection-held rights bodies cannot overwrite the new candidate or its subsequent pin.
- **Reader semantics:** applied level/round/block time remains primary. Clock estimation is separate from observed progression and the two conditional branch timers. Expiry says awaiting observation/prediction elapsed without advancing observed values or manufacturing events; missing timing is unavailable. Transport degradation, observed same-level advance, next-level advance, same-height reorg and skipped levels remain distinct. Rights-only, timing-only, same-height candidate and activation cases pass in both engines.
- **Prior contracts and bounds:** full browser and semantic suites preserve source-local B authority, phase-specific current/max bases, immutable receipts, history/pin controls, committee search/stable ordering, manual retry, late cancellation and comparison/LIVE separation. Shared raw10000, active/unresolved100, session150, event12 and bounded retirement semantics remain exercised. S9 adds two compact opportunity facts to already bounded owners; no per-tick map, new framework, dependency or retention budget was introduced. Dense existing presentation style is not itself an acceptance defect.

## Independent execution

Node **v22.23.3**, RTK **0.42.1**; supplied Node binary first in PATH. Baseline gates used committed tests before reviewer additions. Browsers used isolated5206, never5173. Application source remained frozen throughout.

| Operation | Actual result |
| --- | --- |
| Clean `rtk proxy … npm ci` | exit0;48 packages,0 vulnerabilities. esbuild install-script warning recorded; actual build succeeded. |
| `npm run check` / `npm run build` through RTK | both exit0;18 modules, JS145.06kB / gzip41.56kB. |
| `npm test` through RTK | exit0; **258 tests /19 files** on frozen committed tests. |
| `npm run test:e2e` through RTK | exit0; **136/136 Chromium + Firefox**,1.5m. |
| Own targeted unit/API/store cases, `npm test -- --run tests/unit/roundSchedule.test.ts tests/unit/opportunityFacts.test.ts tests/unit/observationStore.test.ts -t REVIEW` | exit0; **11/11**, with104 intentionally filtered existing cases. Temporary additions are excluded from258. |
| Own actual-reader cases, Playwright dashboard `--grep REVIEW --project chromium --project firefox` | exit0; **10/10**: original pinned quorum, NaN clock, computed calendar endpoint, independent clock qualification and actual helper fallback. |
| All38 exact semantic commands, sequentially after restoring reviewer tests | **38/38 exit0**, each explicit completion record;125.43s combined. Details below. |
| Direct real classifier probes | exit0 harness: matcher failure→1; runtime/empty/missing completion/missing engine→2; both completed engines accepted. Existing classifier unit tests also passed. |
| `git diff --check cc00a78 b964fed` / final HEAD/status | exit0 / exact full SHA / clean. |

Invocation was `rtk proxy node scripts/check-observatory-foundations.mjs AC-N`; browser commands received `--browsers chromium,firefox`. Contractual no-flags16/17/19/23 ran without flags and internally required both engines. Native1/2/3/9/10/11/12/14/18 ran without browser flags. Counts below are assertion groups, not a substituted acceptance policy.

| AC | Groups, exit0 | AC | Groups, exit0 |
| --- | --- | --- | --- |
|1|12|20|2|
|2|11|21|7|
|3|23|22|14|
|4|7|23|9|
|5|2|24|10|
|6|2|25|15|
|7|13|26|2|
|8|2|27|2|
|9|12|28|13|
|10|7|29|13|
|11|9|30|20|
|12|29|31|33|
|13|2|32|12|
|14|32|33|2|
|15|2|34|33|
|16|13|35|13|
|17|25|36|13|
|18|21|37|13|
|19|19|38|13|

Initial acef968 independently passed248unit/check/build/130browser before R1/R2;212bbe9 independently passed257unit/check/build/132browser before R3/R4. Those pass claims do not erase the later independent counterexamples. On final b964fed, a temporary test-copy marker initially selected an owner's similarly named block and caused one transform error; only the reviewer test copy was repaired, then all11 cases passed. This was an execution error, not a product assertion failure or gate pass.

Repro patches are preserved at `/tmp/observatory-s9-independent-regressions-acef968.patch`, `/tmp/observatory-s9-independent-regressions-212bbe9.patch` and `/tmp/observatory-s9-independent-regressions-b964fed.patch`. Final exact command outputs, completion records and durations are in `/tmp/observatory-s9-exactb964fed-original-checks/` (`results.json` and AC-N logs). The batch handle56094 completed normally; no retry/restart substituted its results.

## Screenshot provenance and limits

Both exact committed final PNG hashes match the correction artifact: Chromium `27219b02cbafd9279e719292b420d007e7d7c87fc698f71cea2979383584748c`, Firefox `95ed299e944035dcef3a06294a545392032b5a7f3a4ac8d94217774cf4796f1f`. The reviewer extracted immutable Git blobs and viewed Chromium: both12s conditional deadlines coexist with the separately qualified18s clock, actual TzKT observer and SmartPy parameter responder. Generated S1/S4/S9 images were restored after executions. This is provenance/qualification verification, not complete ASTRA or visual-composition certification.

Evidence is deterministic local domain-consumer and actual production-page behavior. It does not certify public-provider availability, live numerical truth, global consensus completeness, finality, throughput or every protocol transition. S10 documentation/parity, fresh whole-programme review, separate QA and ASTRA remain open. **Interim S9 approval applies only to b964fed above.**
