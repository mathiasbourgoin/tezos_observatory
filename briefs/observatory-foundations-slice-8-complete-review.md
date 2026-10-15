# S8 independent complete review

**Recommendation: APPROVE — INTERIM S8 only.** Exact reviewed source: `cc00a78de385d226fd804ec232ff64cd6c534da6`, parent `34544c5b94ab02982d98bac64bb148fea28ffed1`; complete S8 diff from `4a310c7249fe792b8b6b38f3a2c8f51bda1b13f1`. No unresolved actionable finding remains in this reviewed scope. This is not whole-programme GO, QA completion, ASTRA acceptance, publication or deployment approval. AC15/33/34 remain incomplete.

The reviewer used detached `/tmp/observatory-s8-review-cc00a78`, never the owner's mutable implementation checkout or S9 work. Final HEAD matches the full SHA above; tracked status is clean after restoring temporary regressions, local port configuration and generated screenshots. The only root write is this report; no implementation edit, commit, integration, push or deployment was made.

## Authority and scope

Reviewed against the accepted [specification](../specs/observatory-foundations.md), [plan](observatory-foundations-plan.md), [comparison preparation and authority/resource addendum](observatory-foundations-slices-7-8-review-preparation.md), project authority and TypeScript conventions, and reviewer/architect skills. Owner evidence read: [initial S8 artifact](observatory-foundations-slice-8-impl.md) and [four-fix artifact](observatory-foundations-slice-8-review-fixes.md). Owner pass claims were independently rerun.

The review covers FR064–076/090/094 and full currently implemented AC7/19/21/28/29/30/35/36/37/38, with all previous implemented commands rerun. Inspection includes the complete nine-file S8 diff: comparison service, comparison-only arithmetic authorization, main lifecycle/selection wiring, actual production reader, semantic runner and regressions. Previous candidate, phase, history, pin, committee and lifecycle scenarios remain part of the final full browser suite.

## Findings reproduced and closed

All four initial failures were actual completed assertions on frozen `34544c5`, reported to owner/root before correction. They were not inferred from an owner pass claim or confused with execution errors.

| Finding | Initial impact and real reproduction | Final independent disposition |
| --- | --- | --- |
| R1 — high, wrong selected target authority | Exported comparison API accepted selected level120 with coherent cached successor target121 and counted B pre2. Own test `REVIEW cannot substitute a successor cached target for selected current-level evidence` expected retained raw but no powers and failed. | **Closed.** `sourceComparison.ts:144` requires selected level equal to cached context level before numerical compatibility checks. Same own assertion passes; legitimate selected121 successor/activation positives continue to pass. Raw evidence stays inspectable, without a fourth read. |
| R2 — medium, asynchronous API capture | Mutable caller rights/constants changed after workflow start while identity was held: powers3/2,total5,threshold4 became100/200,total300,threshold201; own assertion observed pre200 instead of captured2. Ordinary NetworkData factories already freeze these values: this is the exported request-capture invariant, not a demonstrated normal-page wrong-power incident. | **Closed.** Typed capture at `sourceComparison.ts:49–60`, invoked before reads at line90, copies/freezes nested source, headers/fitness, observer/anchor contexts, original receipts, rights and constants. Own original numerical repro passes. Additional independent mutation of observer URL/header and rights/constants receipt facts after start also passes: original A provenance and captured H120/H119 remain intact, counted2 remains, fetched receipt stays B. |
| R3 — high, production selection cancellation race | Real candidate-B click changed selection but deferred comparison invalidation to a render. Old A identity body could complete before the frame and retain `ReviewObsoletePoison` under selected B as stale. Natural timing failed Firefox; deferring the scheduled frame made the same actual-page assertion fail both engines deterministically. A previously completed A result is allowed to remain stale; this newly completed obsolete body is not. | **Closed.** Synchronous selection fence at `main.ts:107`, called by candidate/history selection, Pin, Latest, Follow and incoming updates. Own exact delayed-frame repro passes both engines. An additional independent variant clicks B, checks selection itself starts no read, explicitly compares before rendering, then releases old body: B binds the new result, old poison never commits, obsolete workflow makes only its original identity read, new explicit workflow makes exactly3 reads. Owner prior-completed-result/unchanged-receipt and immediate-Compare positives independently rerun4/4. |
| R4 — medium, missing explicit proven head agreement | With same proven B chain/hash/level/round/time but optional pending HTTP503, the actual reader showed only overall `partial`; identical side-by-side fields did not explicitly label agreement as FR066 requires. Own both-engine assertion failed. A known hash conflict plus the same503 already displayed divergence and passed. | **Closed.** Independently proven `headOutcome` at `sourceComparison.ts:155–156`, rendered separately at `dashboardView.ts:290`. Own page test now passes in both engines: overall partial/error remains with explicit head agreement; known conflict retains divergence; neither claims vote agreement or finality. Earlier unknown identity/head/context remains partial/unavailable. |

These fixes preserve missing-proof rejection, execution-protocol/activation checks, original receipt identity and strict LIVE authorization. None increases the request or retention budget.

## Contract and architecture assessment

- **Requests and real browser ledger:** identity → head → version2 pending remains the default. No rights-first workflow, fourth read, automatic retry, cascade or refresh. In-flight clicks coalesce. AC29 checks held full bodies separately at identity/head/pending, exact8000ms abort, late release rejection, three7900ms bodies within24000ms, malformed JSON, and actual browser302 rejection with an empty redirect-target ledger. A wrapped fetch count alone was not treated as redirect proof.
- **Authority and provenance:** comparison-only proof checks actual B chain/head, cached observer/anchor facts, producing versus execution protocol, target level, original helper receipts and configured sources. Valid configured helper C stays C; incompatible or missing proof leaves raw unknown-power. Activation positives and missing/wrong successor execution proof negatives pass. `comparisonGroupsFor` does not weaken ordinary `groupsFor`; no comparison operation is admitted into LIVE stores, history, reconciliation or events. Selected historical A remains distinct from fetched current B.
- **Shared retention:** `main.ts:525/535` allocates comparison capacity from the same network's10000 raw limit, and trims after later LIVE growth. AC19 and unit tests cover partial/zero remaining capacity, growth to zero comparison raw, unchanged original receipts and separately captured positive scalars. Truncation is visibly partial/as-of; absent evidence never fabricates phase zero or completeness. The current result is the retained comparison owner; the reader uses its getter rather than holding an obsolete raw result, and the request ledger holds URLs, not duplicate operation bodies.
- **Lifecycle and age:** cancellation is generation fenced at every comparison read stage, including abort-ignoring bodies and selection return. Pause/hidden/pagehide and prior lifecycle regressions pass. Shared AC21 holds aliases, rights and comparison bodies across pause/resume, checks aborted signals, cached local search/sort with no requests, and rejects late poisoned results. AC30 includes eligibility as well as comparison: exact59999/60000ms, wall-clock jump, immutable receipt and sticky same-context-return invalidation.
- **Shared complete criteria:** AC35 includes actual primary fallback attribution and failed same-observer reconciliation/manual retry without cascade; AC36 preserves unavailable global/finality evidence and source qualifications; AC37 covers reset/nonarchival session loss and sole-provider unavailability. These were read and executed, not replaced by only comparison-specific fragments.
- **Structure:** the new service is a narrow160-line domain module using existing transport boundaries, guards and accountant. Typed nested capture is local and bounded, with a per-request context map preserving shared context references. No framework, new dependency, generic clone layer or unbounded failure/history map was introduced. Architecture risk is low within this interim scope; dense existing presentation style is not an acceptance blocker.

## Independent execution

Node **v22.23.3**, RTK **0.42.1**. PATH used the supplied Node22 binary first. Clean install and baseline gates ran before adding reviewer tests. Browser baseURL/dev port was changed only to isolated5204; application source and assertions were unchanged for the full suite and semantic batch.

| Command / operation | Actual result |
| --- | --- |
| `rtk npm ci` | exit0;48 packages;0 vulnerabilities. npm reported the esbuild install script blocked; subsequent actual build succeeded. |
| `rtk npm run check` | exit0. |
| `rtk npm test` | exit0; **207 tests,18 files** on frozen committed tests. |
| `rtk npm run build` | exit0;17 modules, JS132.03kB / gzip38.31kB. |
| `rtk npm run test:e2e` | exit0; **110/110 Chromium + Firefox**,1.2m. Includes prior S6/S7 controls and the correction positives. |
| Targeted `rtk npm test -- --run tests/unit/sourceComparison.test.ts` with two original independent repros | exit0;50 tests. |
| Same targeted command with additional nested provenance mutation adversary | exit0;51 tests. Includes legitimate activation and cached helper-context negatives/positives. These temporary additions are not included in the committed207 count. |
| `rtk npm run test:e2e -- --grep 'REVIEW\|selection actions synchronously'` before inserting restored own browser repros | exit0;4 existing correction-positive browser cases (prior completed result and immediate explicit Compare). |
| `rtk npm run test:e2e -- --grep REVIEW` after inserting both original own page repros | exit0;4/4 both-engine own assertions. |
| `rtk npm run test:e2e -- --grep 'REVIEW selection action'` with independent no-auto-read/immediate-new-Compare variants | exit0;4/4 both-engine assertions; one canceled old read, exactly3 new explicit reads. |
| All38 original semantic commands, sequentially | **35 exit0; AC15/33/34 exit2 incomplete**, detailed counts below. No behavioral failure or unexpected status. |
| Direct real classifier probes | exit0 harness: completed matcher failure classified1; runtime, empty report, missing completion annotation and missing engine classified2. The seven existing classifier tests also passed in the full unit suite. |
| `rtk git diff --check 4a310c7 cc00a78` | exit0. |
| Final `rtk git rev-parse HEAD` / `rtk git status --short` | exit0; exact full reviewed SHA / clean. |

Semantic invocation: `rtk proxy node scripts/check-observatory-foundations.mjs AC-N`; browser cases4/5/6/7/8/13/20/21/22/24/25/26/27/28/29/30/31/32/35/36/37/38 also receive `--browsers chromium,firefox`. Contractual no-flags16/17/19/23 internally require both engines and were run without flags. Counts are assertion groups, not a replacement for complete criteria:

| AC | Groups / result | AC | Groups / result |
| --- | --- | --- | --- |
| 1 |12 PASS|20|2 PASS|
| 2 |11 PASS|21|7 PASS|
| 3 |23 PASS|22|14 PASS|
| 4 |7 PASS|23|9 PASS|
| 5 |2 PASS|24|10 PASS|
| 6 |2 PASS|25|15 PASS|
| 7 |13 PASS|26|2 PASS|
| 8 |2 PASS|27|2 PASS|
| 9 |12 PASS|28|13 PASS|
| 10 |7 PASS|29|13 PASS|
| 11 |9 PASS|30|20 PASS|
| 12 |29 PASS|31|33 PASS|
| 13 |2 PASS|32|12 PASS|
| 14 |32 PASS|33|ERROR2 incomplete|
| 15 |ERROR2 incomplete|34|ERROR2 incomplete|
| 16 |13 PASS|35|13 PASS|
| 17 |25 PASS|36|13 PASS|
| 18 |21 PASS|37|13 PASS|
| 19 |19 PASS|38|13 PASS|

Initial frozen34544c5 independently passed203unit/check/build/104browser before adversarial findings. R1/R2 then produced real unit assertion reds; R3/R4 produced real actual-page assertion reds, including deterministic both-engine qualification. Those initial failures remain evidence of why the changes were required, not failures of cc00a78.

Temporary test patches are preserved outside the repository at `/tmp/observatory-s8-independent-regressions-34544c5.patch` and `/tmp/observatory-s8-independent-regressions-cc00a78.patch`; semantic outputs at `/tmp/observatory-s8-cc00a78-checks.jsonl`. Reapplying the old browser patch initially returned exit1 because correction tests changed its context; its added independent test bodies were then inserted without changing assertions and executed successfully. A read of a guessed classifier test filename returned1; the actual `checkRunner.test.ts` was located and reviewed. Neither tooling failure was counted as a behavioral red or gate pass. Other read-only inspections and temporary-save/restore operations completed successfully.

## Limits and remaining work

Evidence is deterministic local actual-production-page and domain-consumer coverage. It does not certify public provider availability, real-network coverage, throughput or origin interoperability. Earlier screenshot files regenerated by browser runs were restored to their exact committed state; this report makes no new screenshot, visual-composition or whole-phase-zero/history certification claim.

S9 opportunities/timing (AC15/33/34), S10 complete independent numeric/origin work, whole38 acceptance, separate QA and ASTRA remain open. No subset has been relabelled full programme completion. No additional open question blocks **interim S8 approval of cc00a78 only**.
