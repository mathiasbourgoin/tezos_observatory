# Foundations S10 — full-contract parity inventory

Status: closure inventory, pending independent whole-review revalidation/QA/root acceptance. Independent S9 approval applies to b964fed only. The fresh whole reviewer on integrated69dacc8 issued NO-GO for fully retired observed-quorum duplicate events and autonomous B authority hidden by null primary snapshot despite passing its baseline checks. The owner reproduced both with genuine store/page assertions, then corrected them in1d9d4ca and current frozen `a2be763791ca437b5cf3fc0cb0f0ffb7ee283a4b`. Current Node22 check/build260unit/140browser and original native-spelledAC3=25groups including both engines pass; complete original38 rerun passed on this exact source. Historical b964/acef green inventories never override later independent counterexamples. No whole GO is asserted.

## Authority and method

The [validated specification](../specs/observatory-foundations.md), complete intake preserved in [the implementer brief](./observatory-foundations-implementer.md), [accepted plan](./observatory-foundations-plan.md), [reviewer brief](./observatory-foundations-reviewer.md) and [QA scope](./observatory-foundations-qa-scope.md) remain binding. Requirements, acceptance-criterion links and check links below were read from the accepted specification records, not inferred by ordinal. Mechanical reconciliation found **94 active requirements,38 acceptance criteria,38 planned checks, no unmapped requirement and no missing check**. This proves inventory parity; independent review must still judge whether the assertions exercise every clause.

Production consumers live under `src/rpc`, `src/monitor`, `src/consensus`, `src/main.ts` and `src/dashboardView.ts`. Current actual source/check hashes and all exact original command strings/results are recorded in [final machine evidence](../roster/observatory-foundations/final-checks.json); [S9 evidence](../roster/observatory-foundations/slice-9-checks.json) remains historical. Every browser-required original command ran Chromium and Firefox; native-spelled AC3/16/17/19/23 additionally required both engines internally without changing the original interface. Missing, empty, skipped, retried/incomplete or runtime-failed executions are errors, with runtime failure taking priority over another engine’s assertion failure.

## Eleven intake acceptance items

| Intake item | Implemented ownership and actual checks |
|---|---|
| 1 distinct attributable candidates | S1/S6: AC1/9/10/23; selected same-round hashes and shared-payload attribution |
| 2 provenance and independent health | S1/S3/S5/S9: AC15/16/17/34/35/36; original source/receipts versus transport and observed transitions |
| 3 unknown versus usable phase zero | S5/S7: AC2/11/13/14/27; authentic complete post-identity validated category and interrupted/partial cases |
| 4 exact numerical evidence | S1 and independent audit: AC1/10/11/12; actual signers, totals, thresholds, deficits; S9 per-phase historical threshold correction |
| 5 contextual caches and eligibility | S3/S8/S9: AC17/19/30/38; exact compatible contexts, sticky stale state and independent branch contexts |
| 6 ahead source-local evidence | S4/S6: AC3/18/23/24; autonomous B, failed/manual retries, promotion without receipt refresh |
| 7 pause and hidden lifecycle | S2 plus all later workflows: AC4/20/21/30; actual delayed bodies, no hidden/paused starts |
| 8 accepted events | S5/S9: AC8/31/32/34; crossings versus first quorum, bounded retirement/replay, observed progression only |
| 9 full bounded session inspection | S6/S7/S9: AC5/16/17/22/23/24/25; stable pin, frozen history, Latest versus Follow and captured opportunities |
| 10 complete phase committee evidence | S7: AC6/26/27; validated rights, exact shares, raw unknown signers, stable focused rows |
| 11 one explicit independent comparison | S8: AC7/28/29/30/35/36/37/38; immutable selection,3reads/8s/24s, separate source-limited authority |

## Accepted policy clarifications

| Policy | Real consumer checks / preserved boundary |
|---|---|
| C-1 | AC1/9/10 — independent phase/source/payload power, explicitly shared candidates |
| C-2 | AC10 — conflict signer once independently per payload |
| C-3 | AC11 — whole malformed operation/aggregate rejected; invalid committee raw only |
| C-4 | AC12 — safe integers/cumulative arithmetic/calendar offsets and rollover rejection |
| C-5 | AC13 — interrupted live zero stale; timestamped historical scope retained |
| C-6 | AC2/14 — complete post-identity body, malformed/omitted/truncated negative, valid unrelated entries allowed |
| C-7 | AC15 — coherent prediction versus observed progress and transport; missing unknown |
| C-8 | AC16/30 — immutable receipts, monotonic age/order and wall labels |
| C-9 | AC3/17 — source-local chain/head/parent/protocol/target proof; reorg withdrawal |
| C-10 | AC18 — one in-flight/newest queue,15s starts, retained failed state/manual fresh action |
| C-11 | AC19/24 — configured pool,shared10000raw,100unresolved,3eligibility workers/noMainnetfanout |
| C-12 | AC4/20 — manual pause persists hidden/pagehide/pageshow/BFCache; fresh generation |
| C-13 | AC21 — paused cached/local inspection, cancelled alias/rights/comparison bodies cannot commit |
| C-14 | AC5/22 — retained enrichment, stable pin/controls and one frozen copy after history eviction |
| C-15 | AC23/24 — candidate hashes inside attributed instance; separate products and promotion dedup |
| C-16 | AC24 — first monotonic receipt, lexical ties, replay/huge level cannot refresh priority |
| C-17 | AC25 — first accepted selectable unit/baseline, no instance/candidate double count; explicit live unavailable |
| C-18 | AC6/26 — raw alias OR address matching, explicit order, append/no automatic resort, visible pending exclusion |
| C-19 | AC27 — validated-rights rows; independent source-limited phase states; unknown signers raw separately |
| C-20 | AC7/28/38 — exact head agreement only/divergence/partial, historical/current B separated, compatible cached rights |
| C-21 | AC29 — complete reads including body/redirect,3reads,8s each/24s total,no second-click reads |
| C-22 | AC30 —60s monotonic stale and sticky context invalidation, original receipt visible |
| C-23 | AC8/31 — below→threshold versus first quorum, exact immutable maximum/at-most-once after retirement |
| C-24 | AC32 —12 immutable events independent of history eviction; replay/render/resume dedup |
| C-25 | AC33 — observed hash/future unknown and independent coherent conditional proposers |
| C-26 | AC34 — both conditional protocol timers, missing/expiry, same-level/next-level/reorg/skipped transitions |
| C-27 | AC35 — actual bounded primary fallback; no reconciliation/comparison cascade |
| C-28 | AC36 — source-limited observed/absent/partial/unavailable, no global completeness/finality |
| C-29 | AC37 — nonarchival session reset, explicit comparison; later Astra navigation retained |

## All94 requirements

The following links are the specification’s accepted AC ownership. A check’s passing result means its actual assertions ran; this table does not turn a linked scenario into exhaustive proof of every possible RPC or protocol input. Existing independent S1–S8 dispositions and fresh S9/whole review remain part of closure.

| Requirement | Accepted AC linkage | Implemented consumer |
|---|---|---|
| FR-001 | AC-1, AC-9, AC-23 | `observationStore.ts`, `phaseEvidence.ts`, `main.ts`, `dashboardView.ts` |
| FR-002 | AC-1, AC-24 | `observationStore.ts`, `phaseEvidence.ts`, `main.ts`, `dashboardView.ts` |
| FR-003 | AC-1, AC-9 | `observationStore.ts`, `phaseEvidence.ts`, `main.ts`, `dashboardView.ts` |
| FR-004 | AC-1, AC-9, AC-10 | `observationStore.ts`, `phaseEvidence.ts`, `main.ts`, `dashboardView.ts` |
| FR-005 | AC-9 | `observationStore.ts`, `phaseEvidence.ts`, `main.ts`, `dashboardView.ts` |
| FR-006 | AC-10 | `observationStore.ts`, `phaseEvidence.ts`, `main.ts`, `dashboardView.ts` |
| FR-007 | AC-1, AC-7, AC-9, AC-10 | `observationStore.ts`, `phaseEvidence.ts`, `main.ts`, `dashboardView.ts` |
| FR-008 | AC-11 | `guards.ts`, `phaseEvidence.ts`, `roundSchedule.ts` |
| FR-009 | AC-11 | `guards.ts`, `phaseEvidence.ts`, `roundSchedule.ts` |
| FR-010 | AC-12 | `guards.ts`, `phaseEvidence.ts`, `roundSchedule.ts` |
| FR-011 | AC-1, AC-12 | `guards.ts`, `phaseEvidence.ts`, `roundSchedule.ts` |
| FR-012 | AC-12 | `guards.ts`, `phaseEvidence.ts`, `roundSchedule.ts` |
| FR-013 | AC-16, AC-38 | `networkData.ts`, `observationStore.ts`, `networkMonitor.ts`, `main.ts` |
| FR-014 | AC-16, AC-30 | `networkData.ts`, `observationStore.ts`, `networkMonitor.ts`, `main.ts` |
| FR-015 | AC-2, AC-14 | `networkData.ts`, `observationStore.ts`, `networkMonitor.ts`, `main.ts` |
| FR-016 | AC-14, AC-19 | `networkData.ts`, `observationStore.ts`, `networkMonitor.ts`, `main.ts` |
| FR-017 | AC-14 | `networkData.ts`, `observationStore.ts`, `networkMonitor.ts`, `main.ts` |
| FR-018 | AC-2, AC-27 | `networkData.ts`, `observationStore.ts`, `networkMonitor.ts`, `main.ts` |
| FR-019 | AC-2, AC-36 | `networkData.ts`, `observationStore.ts`, `networkMonitor.ts`, `main.ts` |
| FR-020 | AC-13 | `networkData.ts`, `observationStore.ts`, `networkMonitor.ts`, `main.ts` |
| FR-021 | AC-2, AC-36 | `networkData.ts`, `observationStore.ts`, `networkMonitor.ts`, `main.ts` |
| FR-022 | AC-2, AC-15 | `networkData.ts`, `observationStore.ts`, `networkMonitor.ts`, `main.ts` |
| FR-023 | AC-15 | `networkData.ts`, `observationStore.ts`, `networkMonitor.ts`, `main.ts` |
| FR-024 | AC-15 | `networkData.ts`, `observationStore.ts`, `networkMonitor.ts`, `main.ts` |
| FR-025 | AC-3, AC-17 | `networkData.ts`, `observerReconciliation.ts`, `observationStore.ts`, `main.ts` |
| FR-026 | AC-3, AC-18 | `networkData.ts`, `observerReconciliation.ts`, `observationStore.ts`, `main.ts` |
| FR-027 | AC-3 | `networkData.ts`, `observerReconciliation.ts`, `observationStore.ts`, `main.ts` |
| FR-028 | AC-3 | `networkData.ts`, `observerReconciliation.ts`, `observationStore.ts`, `main.ts` |
| FR-029 | AC-3, AC-17 | `networkData.ts`, `observerReconciliation.ts`, `observationStore.ts`, `main.ts` |
| FR-030 | AC-17, AC-30, AC-38 | `networkData.ts`, `observerReconciliation.ts`, `observationStore.ts`, `main.ts` |
| FR-031 | AC-17 | `networkData.ts`, `observerReconciliation.ts`, `observationStore.ts`, `main.ts` |
| FR-032 | AC-30 | `networkData.ts`, `observerReconciliation.ts`, `observationStore.ts`, `main.ts` |
| FR-033 | AC-18 | `networkData.ts`, `observerReconciliation.ts`, `observationStore.ts`, `main.ts` |
| FR-034 | AC-18 | `networkData.ts`, `observerReconciliation.ts`, `observationStore.ts`, `main.ts` |
| FR-035 | AC-18 | `networkData.ts`, `observerReconciliation.ts`, `observationStore.ts`, `main.ts` |
| FR-036 | AC-18, AC-35 | `networkData.ts`, `observerReconciliation.ts`, `observationStore.ts`, `main.ts` |
| FR-037 | AC-19 | `networkData.ts`, `observerReconciliation.ts`, `observationStore.ts`, `main.ts` |
| FR-038 | AC-19 | `networkData.ts`, `observerReconciliation.ts`, `observationStore.ts`, `main.ts` |
| FR-039 | AC-4, AC-20 | `main.ts`, `networkData.ts`, `networkMonitor.ts`, generation guards |
| FR-040 | AC-4, AC-21 | `main.ts`, `networkData.ts`, `networkMonitor.ts`, generation guards |
| FR-041 | AC-4, AC-20 | `main.ts`, `networkData.ts`, `networkMonitor.ts`, generation guards |
| FR-042 | AC-4, AC-20 | `main.ts`, `networkData.ts`, `networkMonitor.ts`, generation guards |
| FR-043 | AC-4, AC-21 | `main.ts`, `networkData.ts`, `networkMonitor.ts`, generation guards |
| FR-044 | AC-21 | `main.ts`, `networkData.ts`, `networkMonitor.ts`, generation guards |
| FR-045 | AC-23 | `observationStore.ts`, `main.ts`, `dashboardView.ts` |
| FR-046 | AC-19, AC-23, AC-24 | `observationStore.ts`, `main.ts`, `dashboardView.ts` |
| FR-047 | AC-24 | `observationStore.ts`, `main.ts`, `dashboardView.ts` |
| FR-048 | AC-23 | `observationStore.ts`, `main.ts`, `dashboardView.ts` |
| FR-049 | AC-24 | `observationStore.ts`, `main.ts`, `dashboardView.ts` |
| FR-050 | AC-5, AC-22 | `observationStore.ts`, `main.ts`, `dashboardView.ts` |
| FR-051 | AC-5, AC-22 | `observationStore.ts`, `main.ts`, `dashboardView.ts` |
| FR-052 | AC-22 | `observationStore.ts`, `main.ts`, `dashboardView.ts` |
| FR-053 | AC-22 | `observationStore.ts`, `main.ts`, `dashboardView.ts` |
| FR-054 | AC-5, AC-25 | `observationStore.ts`, `main.ts`, `dashboardView.ts` |
| FR-055 | AC-5, AC-25 | `observationStore.ts`, `main.ts`, `dashboardView.ts` |
| FR-056 | AC-5 | `observationStore.ts`, `main.ts`, `dashboardView.ts` |
| FR-057 | AC-37 | `observationStore.ts`, `main.ts`, `dashboardView.ts` |
| FR-058 | AC-6, AC-26 | `dashboardView.ts` committee reader, `main.ts`, `networkData.ts` |
| FR-059 | AC-6, AC-27 | `dashboardView.ts` committee reader, `main.ts`, `networkData.ts` |
| FR-060 | AC-27 | `dashboardView.ts` committee reader, `main.ts`, `networkData.ts` |
| FR-061 | AC-26 | `dashboardView.ts` committee reader, `main.ts`, `networkData.ts` |
| FR-062 | AC-26 | `dashboardView.ts` committee reader, `main.ts`, `networkData.ts` |
| FR-063 | AC-27, AC-36 | `dashboardView.ts` committee reader, `main.ts`, `networkData.ts` |
| FR-064 | AC-7, AC-37 | `sourceComparison.ts`, comparison-only `phaseEvidence.ts`, `main.ts` |
| FR-065 | AC-7, AC-28 | `sourceComparison.ts`, comparison-only `phaseEvidence.ts`, `main.ts` |
| FR-066 | AC-7, AC-28, AC-36 | `sourceComparison.ts`, comparison-only `phaseEvidence.ts`, `main.ts` |
| FR-067 | AC-28 | `sourceComparison.ts`, comparison-only `phaseEvidence.ts`, `main.ts` |
| FR-068 | AC-28, AC-38 | `sourceComparison.ts`, comparison-only `phaseEvidence.ts`, `main.ts` |
| FR-069 | AC-7, AC-38 | `sourceComparison.ts`, comparison-only `phaseEvidence.ts`, `main.ts` |
| FR-070 | AC-29, AC-38 | `sourceComparison.ts`, comparison-only `phaseEvidence.ts`, `main.ts` |
| FR-071 | AC-29 | `sourceComparison.ts`, comparison-only `phaseEvidence.ts`, `main.ts` |
| FR-072 | AC-29, AC-35 | `sourceComparison.ts`, comparison-only `phaseEvidence.ts`, `main.ts` |
| FR-073 | AC-30 | `sourceComparison.ts`, comparison-only `phaseEvidence.ts`, `main.ts` |
| FR-074 | AC-30 | `sourceComparison.ts`, comparison-only `phaseEvidence.ts`, `main.ts` |
| FR-075 | AC-30 | `sourceComparison.ts`, comparison-only `phaseEvidence.ts`, `main.ts` |
| FR-076 | AC-35 | `sourceComparison.ts`, comparison-only `phaseEvidence.ts`, `main.ts` |
| FR-077 | AC-8, AC-31 | `observationStore.ts` accepted phase/events, `networkMonitor.ts` |
| FR-078 | AC-31 | `observationStore.ts` accepted phase/events, `networkMonitor.ts` |
| FR-079 | AC-8, AC-31 | `observationStore.ts` accepted phase/events, `networkMonitor.ts` |
| FR-080 | AC-32 | `observationStore.ts` accepted phase/events, `networkMonitor.ts` |
| FR-081 | AC-32 | `observationStore.ts` accepted phase/events, `networkMonitor.ts` |
| FR-082 | AC-34 | `opportunityFacts.ts`, `roundSchedule.ts`, `networkData.ts`, `main.ts`, `dashboardView.ts` |
| FR-083 | AC-33 | `opportunityFacts.ts`, `roundSchedule.ts`, `networkData.ts`, `main.ts`, `dashboardView.ts` |
| FR-084 | AC-33 | `opportunityFacts.ts`, `roundSchedule.ts`, `networkData.ts`, `main.ts`, `dashboardView.ts` |
| FR-085 | AC-33, AC-34 | `opportunityFacts.ts`, `roundSchedule.ts`, `networkData.ts`, `main.ts`, `dashboardView.ts` |
| FR-086 | AC-33 | `opportunityFacts.ts`, `roundSchedule.ts`, `networkData.ts`, `main.ts`, `dashboardView.ts` |
| FR-087 | AC-34 | `opportunityFacts.ts`, `roundSchedule.ts`, `networkData.ts`, `main.ts`, `dashboardView.ts` |
| FR-088 | AC-34 | `opportunityFacts.ts`, `roundSchedule.ts`, `networkData.ts`, `main.ts`, `dashboardView.ts` |
| FR-089 | AC-34 | `opportunityFacts.ts`, `roundSchedule.ts`, `networkData.ts`, `main.ts`, `dashboardView.ts` |
| FR-090 | AC-38 | `sourceComparison.ts`, comparison-only `phaseEvidence.ts`, `main.ts` |
| FR-091 | AC-22, AC-24 | `observationStore.ts` bounded history/raw facts, `sourceComparison.ts` shared raw capacity |
| FR-092 | AC-31 | `observationStore.ts` accepted phase/events, `networkMonitor.ts` |
| FR-093 | AC-24 | `observationStore.ts` bounded history/raw facts, `sourceComparison.ts` shared raw capacity |
| FR-094 | AC-38 | `sourceComparison.ts`, comparison-only `phaseEvidence.ts`, `main.ts` |

## All38 original command results on frozen a2be763

All commands in this inventory exited0 under Node22.23.3, with nonzero completed assertion groups. Exact commands and source hashes are in the linked JSON; the table preserves native command spelling and records stronger internal browser execution separately. Later corrections must rerun affected checks and whole-final verification must use the final source, rather than inheriting these historical results blindly.

| Accepted check → AC | Assertion groups | Actual required engine evidence |
|---|---|---|
| CHECK-1 → AC-1 | 12 | Native actual admission/accounting consumer |
| CHECK-2 → AC-2 | 11 | Native actual admission/accounting consumer |
| CHECK-3 → AC-3 | 25 | Chromium + Firefox (internally required for original no-flags command) |
| CHECK-4 → AC-4 | 7 | Chromium + Firefox |
| CHECK-5 → AC-5 | 2 | Chromium + Firefox |
| CHECK-6 → AC-6 | 2 | Chromium + Firefox |
| CHECK-7 → AC-7 | 13 | Chromium + Firefox |
| CHECK-8 → AC-8 | 2 | Chromium + Firefox |
| CHECK-9 → AC-9 | 12 | Native actual admission/accounting consumer |
| CHECK-10 → AC-10 | 7 | Native actual admission/accounting consumer |
| CHECK-11 → AC-11 | 9 | Native actual admission/accounting consumer |
| CHECK-12 → AC-12 | 29 | Native actual admission/accounting consumer |
| CHECK-13 → AC-13 | 2 | Chromium + Firefox |
| CHECK-14 → AC-14 | 32 | Native actual admission/accounting consumer |
| CHECK-15 → AC-15 | 2 | Chromium + Firefox |
| CHECK-16 → AC-16 | 13 | Chromium + Firefox (internally required for original no-flags command) |
| CHECK-17 → AC-17 | 25 | Chromium + Firefox (internally required for original no-flags command) |
| CHECK-18 → AC-18 | 21 | Native actual admission/accounting consumer |
| CHECK-19 → AC-19 | 19 | Chromium + Firefox (internally required for original no-flags command) |
| CHECK-20 → AC-20 | 2 | Chromium + Firefox |
| CHECK-21 → AC-21 | 7 | Chromium + Firefox |
| CHECK-22 → AC-22 | 14 | Chromium + Firefox |
| CHECK-23 → AC-23 | 9 | Chromium + Firefox (internally required for original no-flags command) |
| CHECK-24 → AC-24 | 10 | Chromium + Firefox |
| CHECK-25 → AC-25 | 15 | Chromium + Firefox |
| CHECK-26 → AC-26 | 2 | Chromium + Firefox |
| CHECK-27 → AC-27 | 2 | Chromium + Firefox |
| CHECK-28 → AC-28 | 13 | Chromium + Firefox |
| CHECK-29 → AC-29 | 13 | Chromium + Firefox |
| CHECK-30 → AC-30 | 20 | Chromium + Firefox |
| CHECK-31 → AC-31 | 40 | Chromium + Firefox |
| CHECK-32 → AC-32 | 15 | Chromium + Firefox |
| CHECK-33 → AC-33 | 2 | Chromium + Firefox |
| CHECK-34 → AC-34 | 33 | Chromium + Firefox |
| CHECK-35 → AC-35 | 13 | Chromium + Firefox |
| CHECK-36 → AC-36 | 13 | Chromium + Firefox |
| CHECK-37 → AC-37 | 13 | Chromium + Firefox |
| CHECK-38 → AC-38 | 13 | Chromium + Firefox |

## Closure that remains distinct

- Independent S9 review closed its finite-clock/calendar/attribution findings atb964fed, INTERIM only. Fresh whole-review NO-GO69dacc8 found two further real cross-interaction defects. The [retired-event](observatory-foundations-whole-retired-event-fix.md) and [autonomous-B](observatory-foundations-whole-autonomous-b-fix.md) corrections need independent revalidation/final whole disposition, not acceptance from this inventory.
- Fresh independent numerical audit recomputes actual totals/signers/thresholds/deficits. The asymmetric historical threshold defect discovered in that audit is corrected in S9 and has real-store/production regressions; it is not hidden by a successful original command.
- Root owns [the bounded browser-origin RPC audit](./observatory-live-origin-2026-10-15.md), committed at `811c7f6`. Actual Chromium/Firefox origin fetches made26boundedGETs with assets blocked, no retries/polling. All14configuredheadreads succeeded in that sample; Mainnet next-level rights403 remains explicitly unavailable. Shadownet rights had25unique delegates/slots, total7000, threshold4667 and one valid zero-power delegate. No vote/pending/baking-right reads occurred, so this sample proves no current signers, participation, measured zero, proposer, crossing or finality and is not S9 live-rendered-timer evidence. Controlled production-page fixtures likewise do not establish public-provider completeness or a promised future timestamp. No duplicate live reads are performed by this implementer. The root-owned report/response files are intentionally not copied into the isolated owner branch; the relative link resolves after controlled root integration.
- [The human glossary addendum](./observatory-foundations-glossary-addendum.md) supplies actual source/context/retention and S9 vocabulary. Root must synchronize the canonical human glossary and combined323-claim context without copying the isolated170-claim projections over root or granting premature passing managed verification.
- Owner final Node22 gates and all38 original commands now pass on a2be763; independent whole-fix revalidation/final exact-root review, QA and delegated root/lead acceptance still precede Astra production integration. No deployment/publication is authorized by this artifact.

## Preserved scope boundaries

Archived multi-observer history/timelines, background collection, signing/node mutation, unverified global finality and Astra layout/movement/palette/assets remain outside foundations. Their exclusion does not waive any94 requirement,38 acceptance criterion,29 clarification or the required bounded session/navigation handoff. Unsupported timing/context and unreachable origins are explicit unavailable/unknown states, not removed scenarios.

The implementer remains the single whole-epic code owner. This inventory does not append a parent COMPLETED/PARTIAL event or substitute for fresh review/QA.
