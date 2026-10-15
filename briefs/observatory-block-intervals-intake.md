# Intake Brief — observatory-block-intervals

**Date:** 2026-10-15
**Status: VALIDATED**
**Type:** feature
**Trust boundary:** yes

## Goal

Add three readable average completed-block interval metrics to Tezos Observatory for Mainnet and Shadownet: **1 week, 24 hours and 1 hour**, obtained through bounded TzKT historical block lookups. The latest user clarification replaces the initially suggested browser-accessible window with the week window; a fourth session metric is not required. The result helps a reader compare recent block production, with actual coverage, source and freshness visible for each value.

Use actual indexed block timestamps and level differences. The arithmetic convention below is the coordinator-selected and validated product decision, not an established Tezos explorer convention: research Q9 did not establish one. Keep source/indexer availability and the age of the most recent indexed block separate from existing chain-health authority and from any current open-ended wait for a new block.

## Scope Boundary

What is explicitly OUT of scope:

- A fourth mandatory session-history metric; full-week block downloads, pagination, a retained canonical chain database, backend collectors, persistent metric history, charts and new protocol estimates.
- New health scores/thresholds, changing consensus selection, votes, committee/quorum accounting, navigator/camera behavior, opportunity timers, events, pins, comparison/reconciliation behavior or their accepted budgets.
- Independent verification of every intervening block, cryptographic ancestry/finality, global network completeness, automatic provider fallback, authentication and telemetry.
- Replacing the active V3 implementation or accepting mutable concurrent source as reviewed. Publication/deployment remains a separate maintainer gate after concrete review and QA.

## Relevant Files

Application snippets below were read from immutable V3 work-in-progress checkpoint `a97efb3f56c8b76d2ce1e88d1c05719a3e37992d` (producer-focused review APPROVE; not whole-V3 acceptance), not assumed from concurrent author changes. Planning/implementation must reread the actual integrated V3 interfaces before editing.

| File | Role | Key snippet |
|---|---|---|
| `roster/observatory-block-intervals/task.md` | Actual two-message goal | `1semaine/24h/1h c'est bien` |
| `roster/observatory-block-intervals/research.md` | Fully read nine-question research and evidence limits | Q8 supports timestamp filters, `sort.asc=level`, bounded `limit`, projected `level,timestamp,hash`; Q9 leaves mean convention unresolved |
| `src/main.ts` | Own lifecycle and independent network runtime integration | `collectionAllowed = () => pageActive && !userPaused && !document.hidden`; `stopCollection(runtime)` aborts auxiliaries |
| `src/dashboardView.ts` | Native metric presentation, typed view model and source evidence | `NetworkViewModel`; `createDashboard(...): {update(...); tick(...)}`; `set(node,value)` preserves unchanged text |
| `src/dashboard.css` | Existing responsive layout/theme tokens | `--paper`, `--surface`, `--ink`, `--muted`; native controls and focus styles; mobile queries |
| `src/rpc/networkData.ts` | Existing TzKT network bases and lifecycle patterns | `pause():void` advances generation/aborts; `loadAliases()` chooses `https://api.tzkt.io` or `https://api.shadownet.tzkt.io` |
| `src/rpc/guards.ts` | Reusable date and integer validation | `validTimestamp(value:unknown)` rejects rollover dates; `nonnegativeInteger` uses `Number.isSafeInteger` |
| `src/rpc/models.ts` | Existing network and immutable source/receipt vocabulary | `NetworkName = "mainnet" | "shadownet"`; `ObservationEvidence` contains source and wall/monotonic receipts |
| `tests/unit/networkData.test.ts` | Deterministic browser fetch/cancellation patterns | `vi.stubGlobal("fetch",...)`; late ignored-cancellation result cannot poison resumed generation |
| `tests/e2e/productionFixture.ts` | Production-page synthetic streams/requests | `prepare(page,...)`; `window.mockRequests`; `window.mockHidden` |
| `tests/e2e/dashboard.spec.ts` | Existing production integration and reader-state regression tests | page clock, injected heads, `executionErrors` capture, `foundation-verified` / `v3-verified` annotations |
| `playwright.config.ts` | Existing real-engine configuration | Chromium + Firefox; isolated `OBSERVATORY_TEST_PORT` |
| `README.md`, `package.json` | User interpretation, browser-only deployment and documented gates | `check`, `test`, `test:e2e`, `build`; no background service |
| `briefs/project-intake.md`, `briefs/observatory-v3-foundation-interface-handoff.md` | Coordinator authority and integration constraints | root validates intermediate artifacts; final publication separately approved; preserve foundation domain boundaries |
| `kb/spec.md`, `kb/properties.md`, `kb/risks.md` | Mandatory managed claims and historical risk qualifications | generated active claims are obligations, not implementation proof |

## Architecture Notes

### Evidence and integration authority

Claims reconciliation `node .harness/bin/claims-reconcile.js check --root .` returned fresh. Exact `context --root .` JSON is saved at `roster/observatory-block-intervals/context.manifest.json`: model digest `5c03c7a62d889f67edfaa3ade81eca950351071ecd7a1ac2da7ecb0f2ebca532`, freshness digest `ceb740eb6e894bacaa792db0bb79070c521775172cb2391a01c5f3bb1bed51fc`. All mandatory claims remain required; the manifest includes both foundation and V3 contracts. No app tests were run in intake and no claim is marked implemented here.

No repository `AGENTS.md` exists; the supplied AGENTS instructions, `/home/mathias/.codex/RTK.md`, README and project intake apply. Shell commands use RTK. Reuse native fetch, AbortController, existing guards, monotonic ages and lifecycle ownership; this phase builds no infrastructure or dependency and selects no indexed library. If a later phase introduces infrastructure, first consult the canonical Mathias library index and follow its upstream/consumer policy. No new generic transport framework is requested.

The V3 task is independently active. Preserve its full 78 FR / 37 AC and foundation 94 FR / 38 AC / 38 original check interfaces. Coordinate additive view/runtime integration only against an exact supplied V3 handoff; independent review/QA evidence must name the actual integrated revision. This brief does not certify this V3 work-in-progress checkpoint or the full V3 as currently release-ready.

### Arithmetic and window contract

1. At batch start capture finite wall-clock `T` once and a monotonic generation/start receipt. Nominal durations are exactly `604800`, `86400`, `3600` seconds, independent of timezone/daylight saving. Each cutoff is `C=T-duration`; do not round cutoffs to minutes or block boundaries.
2. Capture the latest TzKT indexed block `E` at or before T (level, hash, timestamp), for example via one projected descending-level `timestamp.le=T&limit=1` lookup, and indexed/known-level/synchronization response metadata when available within the same read. Require calendar-valid timestamp, safe nonnegative integer level, nonempty hash and `E.timestamp <= T`. A returned future endpoint is a source/clock inconsistency, never silently clamped or converted into an average. No extra metadata read may exceed the batch budget.
3. For each cutoff select the latest TzKT-reported indexed block `S` with timestamp **at or before C**, level `<=E.level`, using `timestamp.le=C`, explicit descending level order and `limit=1`. Equality chooses that exact boundary block. This includes the full interval crossing the lower boundary: the completed intervals have end timestamps in `(C,E.timestamp]`; there is no fractional weighting. A long interval starting before C must not disappear from the average and falsely imply healthy production. The actual measured extent may exceed the nominal duration and must be shown honestly. Empty array is missing lower-bound history; malformed/unexpected rows are invalid source data.
4. If one or more floor queries return empty, permit exactly **one shared earliest-available lookup** for the network batch (ascending level, limit1, bounded to E). A valid earliest block newer than C can serve as S for the affected window with an explicit **partial available history** label and its actual start/span; no assertion of genesis or full-period coverage follows from being the earliest row returned. It must never substitute for an invalid nonempty floor response, an unrelated provider, a future block or missing E. If unavailable or not a usable pair, the affected window remains unavailable. Reuse this one result for all affected windows.
5. Let `n=E.level-S.level` and `d=E.timestamp-S.timestamp` in seconds. If both are positive and safe/finite, report `d/n` seconds per completed interval. Thus two endpoint blocks one level apart give one interval, not two. The telescoping mean includes all indexed canonical level transitions between endpoints as asserted by TzKT, without requiring download of intermediate blocks. Skipped browser observations, rounds, proposal counts and protocol changes do not change the denominator.
6. Endpoint level/time order must agree; identical endpoint (`n=0`), zero/negative duration, unsafe arithmetic or fewer than two distinct valid endpoints gives **insufficient data**, never zero, infinity or a guessed mean. If E is at or before C, the current window has no completed-block sample; never shift the window backward to hide this. Missing/contradictory endpoint data gives unavailable; only the explicitly allowed earliest-available fallback can yield a partial-span mean.
7. Keep the numerical calculation unrounded. Display seconds with two decimal places; positive values below 0.005 seconds display `<0.01 s` instead of zero. Show actual UTC endpoint timestamps/levels, elapsed covered duration and interval count per window, plus requested duration and as-of T. A reader must be able to see short coverage, including young-network/history-limited windows. Do not call the requested wall-clock duration the measured span or divide it by n. Example: endpoints 100 at 12:00:04 and 104 at 12:00:28 give 4 intervals, 24 seconds coverage and 6.00 s mean, regardless of receipt spacing.
8. Endpoint-only results are explicitly TzKT-reported indexed spans, not independently proven complete chain history. Do not claim verified ancestry or continuous node observations. If TzKT exposes missing/partial history or inconsistent ordering, mark affected window unavailable/partial with a specific reason; do not manufacture intermediate evidence. Each window can fail independently after a valid shared head.

### Bounded acquisition and consistency contract

For each network use its existing documented TzKT REST base; these are separate from RPC stream/helper sources. Anonymous browser GET only: `credentials:omit`, no custom authorization, `cache:no-store`, `redirect:error`, no cookies sent intentionally, secrets, RPC fallback or provider cascade. Use projected minimal block fields when supported.

One batch uses at most **6 endpoint reads per network**: one initial indexed-head-at-or-before-T lookup, three single-row floor lookups, one optional earliest-available lookup shared by affected windows, and one re-read captured E by fixed level to compare its exact hash/level/timestamp. If fallback is unnecessary, no sixth request is made. Metadata is taken only from these bounded responses; there is no additional head read. No pagination, automatic retry or full-week transfer. At most 2 reads in flight per network; one active batch and at most one newest queued eligible trigger. Each read must finish including body within 8 seconds, the entire network batch within 24 seconds, and each body must be capped at 16 KiB while reading (not only after unbounded `json()`). Include failures in the read budget and remove all timers/listeners when work ends. Timeouts must settle even when a fetch/body test double ignores abort.

Normal indexed-head advance while the batch runs is allowed: E remains the exact as-of endpoint; no equality with a later global head is required. The fixed-level E re-read is the consistency check, not another mutable-head equality requirement. An E re-read hash/level/timestamp mismatch or missing E after rollback, explicit network identity contradiction or malformed shared head invalidates the batch. Do not mix generations/providers or silently restart. Retain an older committed result only as attributed stale/historical, with its original T, endpoint and receipt facts. Provider assertions do not establish independent ancestry; consistency checks bound ordinary indexer/reorganization races, not malicious-provider proof. No successful batch overwrites another network’s result.

### Refresh, freshness and lifecycle contract

Initial permitted collection and permitted resume can request one batch for each supported network. Subsequently an actually accepted material applied-head change may request a refresh only after at least **60 seconds between batch starts** for that network. Coalesce overlapping eligible triggers to one newest pending trigger; no cooldown timer schedules a later acquisition by itself. UI ticks, elapsed time, consensus votes, protocol-round estimates, theme, network-tab navigation, disclosures, pin/history selection and visual effects start no reads. An explicit named native Refresh block intervals action uses the same generation, read limits and cooldown; repeated clicks coalesce and the disabled/cooldown state is visible. Initial/resume does not bypass an outstanding cooldown.

No timer-only metric polling, scheduled retry or separate stream is introduced. In a long quiet period the prior result remains as-of and becomes stale; its arithmetic does not grow with the ongoing wait for a block. Existing open-ended head age/wait stays separately labelled. A failed unchanged trigger is not automatically retried; a new eligible material applied-head change, allowed resume or explicit refresh may start a bounded new attempt.

Age/freshness use monotonic elapsed receipt time, preserving captured wall T and wall receipt. At age **>=120 seconds**, or immediately on collection interruption or explicit metric-context invalidation, retained results are labelled stale. Sticky invalidation cannot be cleared by a local navigation/selection round trip. A successful fresh batch alone replaces them. Indexer lag is `knownLevel-indexedLevel` only when both safe, coherent TzKT metadata values are supplied by the same response (for example TzKT-Known-Level and TzKT-Level). E.level is the temporally filtered endpoint and MUST NOT substitute for indexedLevel: a past selected E must not create false indexer lag. Missing, invalid or contradictory metadata makes lag unknown, never zero. Synchronization/lag metadata is labelled as-of its actual response receipt, separately from calculation T. Show last indexed-block timestamp/age separately from fetch freshness, so a freshly fetched old head does not imply fresh chain progress or chain failure. No new healthy/stalled status comes from this metric or TzKT failure.

Manual pause, document hidden, pagehide and stop abort metric requests, clear queued acquisition, invalidate generations and prevent late commits even after same-network/context resume. Initially hidden/paused starts no work. BFCache/pageshow retains manual pause, starting fresh-generation work only if collection is enabled/visible and cooldown permits it. Both network runtimes remain independently qualified; tab selection is pure presentation. Keep only the latest committed three-window batch and current bounded pending state per network in memory; no persistent block dataset.

### Presentation and verification coverage

Use one compact coherent interval region in the integrated V3 network workspace, with three labelled values, real coverage and TzKT linked attribution visible without a specialist interaction. Expandable native details may contain full endpoint hashes, exact UTC timestamps, formula, receipt and reasons; unavailable/loading/insufficient-data/stale/provider-lag states must be understandable in ordinary text and by assistive technology. Preserve selection, focus, scroll, disclosure and search while data updates. Do not make automatic numeric ticks a repeated live announcement or observed navigator motion.

Reuse light/dark/system theme and existing original visual vocabulary. Preserve the accepted responsive/zoom matrix and non-color state cues, 14px critical values/12px metadata minimum, composed-surface contrast and native keyboard/touch controls. Check the added region in both real browser engines and themes at phone (360/390 including short390x568), tablet, desktop and accepted wide widths; no horizontal document scrolling or overlap, and no degradation of the mandatory current/two-future overview.

Future implementation requires meaningful deterministic tests at the calculation/acquisition and production reader boundaries: exact lower equality, boundary-crossing inclusion (including a long stall spanning the cutoff), shared earliest-available partial fallback, two-endpoint n=1, irregular intervals, protocol transition, large skipped level differences, young network/short span, no rows/one row/no recent E, malformed/future/offset timestamps, unsafe/zero/reversed arithmetic, independent failed window/network, absent/lagging indexer metadata, normal indexed advance versus fixed-E hash/time mismatch, removal or rollback, body/deadline/read/concurrency limits, cooldown/coalescing/no decorative/navigation reads, initially hidden, pause/hidden/pagehide/resume/BFCache and late ignored-abort response, stale120s boundary, wall-clock jump with monotonic age, and preserved consensus/reader behavior. Live-provider smoke is bounded evidence of availability only; deterministic tests own the contract.

Document formula, boundary choice, coverage, source limitation, lifecycle and failure interpretation in README alongside the feature. Update authoritative specs/claims through the installed pipeline, never hand-edit generated KB projections. New acceptance runner/interfaces are later spec/plan deliverables and must not be claimed already executed.

## Quality Gates

Documented Node.js requirement: 22 or newer. Existing dependencies/browser installations may be reused; clean install remains a downstream release verification obligation, not an instruction to allocate new dependencies during intake.

```bash
# Clean dependency install (documented project release gate)
rtk npm ci

# Typecheck
rtk npm run check

# Unit tests
rtk npm test

# Production browser tests: configured Chromium and Firefox
rtk npm run test:e2e

# Build
rtk npm run build

# Managed claims freshness
rtk proxy node .harness/bin/claims-reconcile.js check --root .

# Lint/Format
# Not documented as a standalone gate.
```

Preserve all documented foundation/V3 criterion check interfaces and require their applicable regression gates against the exact integrated source, plus focused deterministic block-interval acceptance checks defined by the next specification phase. Build/typecheck success alone cannot prove external-provider availability, lifecycle behavior, rendered accessibility or formula correctness. Intake ran only the claims freshness/context and task keyword checks; application tests/build were not run.

## Open Questions

None. Root coordinator read the complete draft and explicitly validated Type feature, Trust boundary yes and the complete contract on 2026-10-15, under the maintainer's delegated intermediate-decision authority. The task-text keyword heuristic returned NO HIT; the coordinator deliberately confirmed yes because a new untrusted indexer supplies displayed values. The final authorized documentary delta corrects checkpoint attribution, separates temporally selected E.level from same-response indexedLevel/knownLevel lag metadata, and fixes documented gate order. See `roster/observatory-block-intervals/intake-validation.md` for the actual gate record. No questionnaires beyond the actual clarification/validation exchange were invented.
