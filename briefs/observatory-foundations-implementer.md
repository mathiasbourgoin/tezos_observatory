# Implementer Sub-Brief — observatory-foundations

**Date:** 2026-10-14
**Status: VALIDATED**

Deliver the full contract below as sequential end-to-end production-page slices. Read project-authority and TypeScript patterns; use an isolated worktree on the root-approved integrated baseline. One epic code owner retains responsibility across all 10 slices and38 checks, and controls shared production files; independent review/integration precedes each next slice. This draft does not authorize execution.

## Files and intake snippets

| File | Intake evidence / work purpose |
|---|---|
| src/rpc/models.ts | `MonitoredOperation { hash; contents }`; introduce only current slice's evidence types |
| src/rpc/guards.ts | `nonnegativeInteger`, individual payload optional; atomic safe validation |
| src/rpc/operationStore.ts | `Map<string, StoredOperation>`; identity dedup and independent bounds |
| src/monitor/headGeneration.ts | current/head+1 filter; same-observer admission and generation fence |
| src/monitor/networkMonitor.ts | `latestProposal`, equal-round rejection; distinct candidates/lifecycle |
| src/rpc/networkData.ts | protocol/level cache, timeout-only aliases; exact context/cancellation |
| src/main.ts | current first-group selection, five-entry trimming; independent session/selection/collection |
| src/dashboardView.ts | unguarded power comparison; exact identity events and stable inspection |
| intake unit files, tests/e2e/dashboard.spec.ts | existing deterministic and real production `/` support |
| package.json/playwright.config.ts | exact Node 22 and Chromium/Firefox gates |
| scripts/check-observatory-foundations.mjs | planned absent 38 semantic command interface; actual consumers |
| kb/glossary.md / doctrine docs | close accepted vocabulary risk; managed projections only via reconciler |

## Sequence and completion

1. Selectable source/context candidates, shared payload qualification, atomic input validation, exact unique power/deficits and independent candidate bounds.
2. All-work pause/initial hidden/pagehide/BFCache generations, local inspection and no cancelled commits.
3. Context-safe rights/eligibility/reorg, immutable source,60s stale/max3 workers/no Mainnet fanout.
4. Ahead quarantine/promotion and same-observer reconciliation: one workflow/one queue/15s starts/manual retry, no cascade.
5. Authentic post-identity snapshot zero versus partial, independent health and at-most-once same-identity crossings/max12 events.
6. Full150 history/100 active/100 unresolved/100 facts per snapshot, historical active-eviction inspection, stable pins/frozen history eviction/newer units/follow-live.
7. Validated committee/unknown signers, phase states, trimmed search, explicit stable sort and preserved controls.
8. Explicit different-provider comparison:3 reads/8s each/24s total, raw partial/compatible cached rights, head-only agreement, cancellation/sticky60s stale.
9. Actual applied/hash primary, both conditional proposer/timer branches, unavailable future hash and distinct observed progression.
10. Documentation, complete 38 checks and independent numerical review/Node 22/two-engine QA before ASTRA integration.

Each slice reaches input, logic and production presentation with real assertions and browser evidence. Architect checkpoints: identity, cache authority, reconciliation lifecycle, bounded history. Retired crossing strategy remains investigation requiring conservative observed-only uncertainty and overflow/replay/reorg checks. Root chose identity+head+pending by default; compatible cached rights or raw unknown-power partial, no default rights-first/fourth read. Data-dependent choice only for current-workflow known pending unavailability within 3 reads, no retry/cascade. Exact38 AC/browser mapping comes from accepted spec during execution, never ordinal invention.

## Verification and constraints

Node 22: `rtk npm ci`, `rtk npm run check`, `rtk npm test`, `rtk npm run test:e2e`, `rtk npm run build`; no separate lint. Deliver AC-1..38 `rtk proxy node scripts/check-observatory-foundations.mjs AC-N`, browser-required with `--browsers chromium,firefox`, actual `/`. Exit0 actual assertions/pass;1 specified behavioral failure;>=2 execution error, missing/skipped scenario/browser. No raw runner exit substitution or copied calculations. Independent fixture totals/signers/deficits/threshold audit and separate bounded origin report. Recheck claims/manifest freshness before execution.

Reuse existing project support. Before generic infrastructure consult canonical library index; missing selected capability extended upstream with Roster/PR and dependency rules. No new library selected by planner. Risks: shared identity, false zero/reorg races, auxiliary cancellation, snapshot completeness, memory/dedup, reader stability, comparison budget and prediction labels. Close glossary risk before final review. Full behavior below remains binding; no V3 aesthetics, publishing or deployment.

## Interim evidence and terminal gates

Slice checks, architect checkpoints and staged reviews are INTERIM evidence only. Do not emit parent implement COMPLETED, review GO or QA GO until all 10 slices and38 semantic checks close the entire accepted contract. One epic code owner remains accountable; independent reviewer/architect/QA are separate, scheduled by root within global max4 agents. Exercise huge same-context payload/candidate floods, evicted replay and proven reorg return. Uncertain retired history permits observed quorum/raw evidence, never an invented crossing. No strategy is declared solved without real consumer evidence.

## Root merge and rollback decision

Retain last reviewed baseline. Fix the owned isolated branch or revert only owned unaccepted changes; never reset other agent/root work. Dependent work may investigate separately but cannot integrate before its prerequisite passes focused checks and staged independent review. Support ownership is restricted; merges are sequential root integration. Staged evidence remains INTERIM. Maintainer publication approval does not block authorized reversible local work.

## Full authoritative intake

All acceptance and policy statements below bind this role. Ownership notes do not reduce scope.

# Intake Brief — observatory-foundations

**Date:** 2026-10-14
**Status: VALIDATED**
**Type:** feature
**Trust boundary:** yes

## Goal

Complete the remaining correctness and inspection foundations before ASTRA's separate V3 research/design/implementation. Every observed consensus instance, candidate, phase, committee, history record and event must retain attributable network/level/round/payload/source/context evidence. Count exact integer voting power once per delegate/phase/instance, separate missing observations from measured zero, and present chain progress independently from observer health.

Provide bounded selectable session inspection and explicit independent source comparison. A reader can inspect either of two same-round candidates or a historical instance while collection continues, search phase-specific committee evidence, identify source/context/freshness limitations and return to live selection without losing focus/scroll. This phase establishes these behaviors without preselecting V3 composition, palette or assets.

## Scope Boundary

Out of scope: ASTRA V3 visual redesign or palette/layout choices; publication/deployment; server/background collection; signing/wallet/node mutation; network-wide inactivity or unverified finality claims; automatic undisclosed provider aggregation; archival completeness; optional receipt timelines, watched-delegate filters and recovery confetti unless separately adopted by coordinator. Basic searchable committee and historical provenance are mandatory.

## Observable acceptance

1. Preserve distinct candidate block identities for same level/round, including shared payload; deduplicate replay by identity and enforce declared retention bound. Candidate producer labels require matching candidate evidence; unavailable producer remains unknown. Competing payload power never combines.
2. Every accepted vote/proposal/rights/eligibility/history/event has immutable source and requested/observed context plus receipt/freshness information sufficient to explain attribution. Current provider status cannot relabel historical data. Independent chain-progress and observer states include connected-without-progress, reconnecting-with-progress and unknown.
3. Missing rights, unusable identity, interrupted/insufficient phase coverage and unavailable source observations cannot produce measured zero or complete missing-delegate claims. Apply the accepted phase-zero policy below; empty batches/transport open alone never establish completeness.
4. Reject nonfinite, unsafe, negative or fractional integer consensus values and contradictory committee/threshold data; maintain exact quorum deficit and unique delegate power across individual/aggregate replay. Audit actual values and boundary cases, not rounded percentages alone.
5. Rights/baking/eligibility cache reuse has justified context; same-height reorg, source divergence and delayed obsolete responses cannot contaminate another context. Eligibility exposes context, age and unknown/stale states. Preserve bounded concurrency and avoid Mainnet fanout.
6. Recognizable ahead-of-applied-head mempool evidence is evaluated from identity and available context, never dropped solely because head delivery is late or blindly merged from another source. Unverifiable evidence remains separately attributable/unresolved without a counted quorum. Apply the accepted identity/context reconciliation rule below without arbitrary numeric future windows.
7. Pause/hidden/pagehide abort all external collection and auxiliary work, aliases and comparison included. Initially hidden page starts no external work. Resume does not commit cancelled responses or cause unbounded retries.
8. Quorum/progression events compare the same precise identity/context. Changing payload, candidate, source or historical selection cannot fabricate a threshold crossing. Historical events retain explicit identity/provenance.
9. Retain full bounded session inspection data: candidate identities, phase signer/committee evidence, exact peak powers, source/context/coverage and honest receipt dates. Pin selection independently of collection; show newer-items count/action; follow-live returns coherently; pause collection is separate. Pin, disclosure, sorting, search, focus and scroll survive multiple updates. Frozen eviction behavior is explicit.
10. Search committee by alias/address with phase-specific receipt state, power/share, eligibility and context. Do not reorder underneath the reader or turn source absence into network-wide inactivity.
11. Explicit bounded second-source comparison shows agreement/divergence/unavailable/stale for the requested context and cancels on pause/hidden/context change. Never merge powers into a combined quorum. No periodic or decorative comparison polling.

## Relevant Files

| File | Role | Key snippet |
|---|---|---|
| `src/rpc/models.ts` | identity types | `MonitoredOperation { hash; contents }` |
| `src/rpc/guards.ts` | numeric/payload input boundary | `nonnegativeInteger`; individual payload optional |
| `src/rpc/operationStore.ts` | count/TTL dedup | `Map<string, StoredOperation>` |
| `src/monitor/headGeneration.ts` | generation/context cancellation and admission | `content.level === level || ... level + 1` |
| `src/monitor/networkMonitor.ts` | proposal/transport lifecycle | `latestProposal`; equal-round `<=` rejection |
| `src/rpc/networkData.ts` | contextual caches/auxiliary reads | committee key `${head.proto ?? "unknown"}:${level}`; aliases timeout-only |
| `src/main.ts` | live selection, coverage, history/opportunities | `selected = currentGroups[0]`; `recent.splice(5)` |
| `src/dashboardView.ts` | inspection controls, committee/events | quorum events compare powers without identity guard |
| `tests/unit/{networkMonitor,networkData,headGeneration,guards,operationStore}.test.ts` | adjacent deterministic coverage | prefetch reuse; generation fencing; aggregate slots |
| `tests/e2e/dashboard.spec.ts` | real `/` behavior | unknown/old votes, paused streams, hotfix cases, scroll/focus |
| `package.json`, `playwright.config.ts` | reproducible gates | Chromium + Firefox projects |
| `kb/spec.md`, `kb/properties.md`, `kb/risks.md` | intended contract/current gaps | identity, independent health, bounded history |
| `docs/reviews/2026-10-14-explorus-teztale.md`, `docs/reviews/2026-10-14-v3-anti-generic-design.md` | product/design separation | selected instance and provenance, deferred original V3 |

## Architecture Notes

Actual claims check returned fresh legacy/no-managed-claims, no projections; no model/freshness managed manifest applicable. Existing hotfix prevents pooled missing-payload groups and proposal mislabel but does not create contextual source/phase coverage. Existing tests deliberately encode head+1 filtering and cross-head rights reuse; changing those behaviors requires evidence-driven test updates. No public-provider completeness claim follows from unit/e2e success. No new generic infrastructure/library was selected. Coordinator resolved the canonical replacement index to `/home/mathias/dev/library-index/data/INDEX.md`; existing Roster reuse recorded in index commit `485cafd`. Apply domain changes using existing primitives and recheck index before introducing generic infrastructure.

Delegated authority: root validates Type/trust boundary/specification/plan and records decisions under `.harness/rules/project-authority.md`. Independent review and QA remain mandatory. Final publication/deployment stays with maintainer. Keyword check source task includes “evidence” and “integrity”, yielding proposed trust boundary yes.

## Accepted Coordinator Decisions

The root coordinator explicitly validated Type `feature`, Trust boundary `yes` and the following contract under the maintainer's delegation. These are observable behavior requirements, not promised implementation architecture.

- **Retention:** 150 full session instances per network, 100 active accepted candidates per network and a separate bounded quarantine of 100 unresolved candidates per network. Unresolved observations cannot evict accepted candidates. Deduplicate by identity; evict deterministically by oldest receipt, never by arbitrary enormous claimed level. Preserve one separately frozen pinned snapshot per network if its history entry is evicted; clearly mark it outside retained session history.
- **Phase zero:** measured zero requires a usable full validated-mempool snapshot received after the exact selected proposal/instance has been established, from the same observer with coherent head/parent/rights context. Zero means zero observed in that source snapshot, never global completeness. An open stream, an old empty batch, or votes only in the other phase leave the phase unavailable/partial. Positive received votes may report observed power with explicit partial coverage. Deliberately replace the old opposite-phase-zero expectation with both unavailable/partial and valid full-snapshot-zero scenarios.
- **Ahead evidence:** retain ahead observations unresolved within the bounded quarantine. Count only after that same observer's validated-block/head context establishes target as its contextual current level or context+1 with coherent rights. Global applied head A+1 and clock ceilings alone cannot reject valid observer B context. Context reconciliation is bounded and coalesced: maximum one request workflow in flight per network/source, at most one attempt per 15 seconds for a new material context, with no permanent polling, forced stored-operation duplication or fallback cascade. Failure leaves evidence unresolved with no quorum. No arbitrary numeric future window and no inference of parent identity from level alone.
- **Second source:** explicit comparison permits one in-flight workflow for selected network/context, one different provider, at most three endpoint reads with eight-second timeout each, no retries, cascading or periodic refresh. Compare fetched source B head hash/level/round/time/network identity and optional full validated-pending snapshot with context-pinned rights when the budget permits or coherent rights can be reused. Unproven rights or network/context leaves raw observations unknown-power; never borrow an incompatible committee. Show agreement/divergence/partial/unavailable explicitly and never union source powers.
- **Numerical reasonableness:** validate actual applied level/round/time, committee totals, signer counts, exact threshold and deficit from evidence. Applied values remain primary and separate from selected consensus and calculated opportunities; never label a planned level as the same applied block level. Extreme malformed values must not drive eviction or produce plausible-looking gauges.


## Quality Gates

Under Node 22 (or newer for development; reproducibility Node 22):

```bash
rtk npm ci
rtk npm run check
rtk npm test
rtk npm run test:e2e
rtk npm run build
```

No separate lint command documented. E2e must execute Chromium and Firefox production-page scenarios, including same-round candidates/shared payload, two competing payloads, aggregate replay, unknown vs justified phase zero, slow head/ahead votes, same-height reorg, delayed stale auxiliary responses, all-work pause/hidden, history overflow while pinned, searchable committee/focus/scroll, independent comparison agreement/divergence/failure and exact quorum integer boundaries. Record bounded live-origin checks separately; unreachable providers stay unknown. Independent numerical audit must verify actual totals/signers/deficits against fixture evidence and threshold boundary cases. ASTRA visual acceptance is a later separate phase.

### Accepted deterministic check deliverables

The implementation MUST supply the 38 self-contained semantic checks paired one-to-one with AC-1 through AC-38 in the accepted specification. The invocation interface is `rtk proxy node scripts/check-observatory-foundations.mjs AC-N`; checks requiring the browser consumer additionally accept `--browsers chromium,firefox` and exercise the actual production `/` in both engines with controlled RPC evidence. All checks reach the real observation, admission, accounting or browser consumer, never detached copies of product calculations. These commands are planned implementation deliverables, currently absent and unexecuted.

Exit 0 means the stated behavioral assertions actually ran and passed; exit 1 means a specified behavioral assertion failed; exit 2 or greater means setup, import, runtime, timeout or incomplete execution failed. Missing scenarios, empty runs and skipped required browsers are execution errors. Raw Vitest or Playwright exit 1 cannot substitute for a behavioral red result because it can also mean an execution error. Ordinary Node 22 gates remain independently required. Reuse existing project test support; consult the canonical library index before introducing generic infrastructure and extend a selected capability upstream when necessary.

Root explicitly validates this check-deliverable policy as part of the intake under delegated authority on 2026-10-14. Planning must retain the complete accepted behavioral scope and its assertion/error distinction.

## Open Questions

_(empty; coordinator decisions recorded above)_

## Root-Validated Adversarial Policy Appendix

Decision date:2026-10-14. Root coordinator explicitly accepted one clarification and four sequential challenge-resolution packages under `.harness/rules/project-authority.md`. These clarify the full accepted scope; no scope was removed. Specification review/quiz remains pending and this appendix will be reviewed with it. Fresh planning receives this intake in full.

- Eligibility freshness is60 seconds only for exact coherent context; context invalidation immediately stale. Explicit comparison snapshot age>=60 seconds is stale using monotonic elapsed age; no automatic refresh. Raw receipt time always remains visible. Context invalidation stays stale even after selection switches away/back.

- **C-1**: Root Q1: consensus power belongs to source/context/level/round/payload/phase. Same-payload candidates can display explicitly shared payload evidence, never candidate-specific signature/producer inference or summed duplicate power.
- **C-2**: Root Q1: a conflicting delegate counts once independently per payload; expose conflict; never combine payloads.
- **C-3**: Root Q1: malformed operation/aggregate rejects that whole operation. Contradictory/incomplete committee or invalid threshold invalidates numerical authority; preserve valid raw votes as uncounted evidence.
- **C-4**: Root Q1: totals/threshold positive safe integers, threshold<=total, safely checked cumulative arithmetic and unique signer totals/deficits. Timestamp strict RFC3339/ISO8601 with explicit timezone convertible to UTC, legitimate calendar datetime and finite date; legitimate offsets allowed, rollover malformed dates rejected.
- **C-5**: Root Q1: interrupted coverage makes live zero stale/partial; retain timestamped coherent zero in historical evidence without present completeness claim.
- **C-6**: Root Q1: successful complete validated array/body, relevant consensus entries parseable and coherent unchanged same-source context; snapshot follows identity establishment. Unrelated valid nonconsensus entries do not invalidate. Structural truncation/omitted validated/malformed relevant entry cannot certify completeness.
- **C-7**: Root Q1: progression from observed transitions, stall indication tied coherent protocol prediction and observed evidence; missing/disconnected observer never establishes global chain stall. Unavailable inputs give unknown; observer transport state remains independent.
- **C-8**: Root Q1: receipt/source/context facts immutable; elapsed age and current stale/partial state evolve. Monotonic elapsed age/order avoids wall clock jumps; wall timestamps remain honest receipt labels.
- **C-23**: Root Q1: crossing requires prior observed below threshold for identical phase/identity/context; first observation at threshold gives observed quorum without invented crossing. At most one crossing per phase identity/context; recorded maximum and identity dedup mean transport loss, selection and render cannot reset it.
- **C-9**: Root Q2: contextual facts include proven chain id, observer endpoint, requested head hash/predecessor/protocol and target level/round/payload/candidate as available. Unknown fields remain explicit; power needs necessary proven context. Reorg immediately invalidates live authority without rewriting historical provenance. No parent inference from level.
- **C-10**: Root Q2: per network/source starts separated by >=15 seconds, one in-flight workflow and one coalesced newest material context (change in proven head/parent/protocol/target identity); failed unchanged context may retry only upon explicit fresh manual action after cooldown. No permanent polling or cascading.
- **C-11**: Root Q2: configured provider pool only, one queued material context per source, existing10000 stored-operation cap per network plus separate100 unresolved candidates; bounded/truncated snapshot is explicitly partial and cannot certify zero. Valid raw historical provenance remains inspectable despite unavailable numerical authority. Eligibility max3 concurrent workers and no Mainnet fanout.
- **C-12**: Root Q2: manual pause persists across visibility/pagehide/BFCache; visible pageshow can resume only if collection remains enabled, using fresh generation. Hidden/paused starts no external work.
- **C-13**: Root Q2: pure local rendering and coherent cached inspection are allowed while paused; no external reads or obsolete/cancelled-generation response commits.
- **C-14**: Root Q3: pin locks selected identity and reader controls; later immutable same-identity accepted evidence may update retained view. Evicted pin becomes one static explicitly frozen copy per network; selecting new pin replaces it.
- **C-15**: Root Q3: session instance is source/context/network/level/round/payload with distinct candidate hashes retained inside it. Candidate identities include observer/chain/block hash; unresolved consensus identity never fabricates a block hash. Promotion removes quarantine duplicate. Accepted candidate and full-history products remain separately bounded.
- **C-16**: Root Q3: oldest first monotonic receipt, lexical stable identity tie; replay never refreshes eviction order.
- **C-17**: Root Q3: newer-items uses one clearly defined selectable identity unit (distinct candidate identity, or distinct candidate-free instance if no candidate yet), never doublecounts its instance and candidate. Count first accepted arrivals after pin baseline, exclude replay/late same-identity facts. Action returns newest coherent LIVE-eligible context by receipt; no coherent current candidate yields explicit live unavailable state, never stale historical selection.
- **C-18**: Root Q3: trim query; case-insensitive alias/address substring; empty shows all. Explicit address/alias/power sort with address tie; reader sort order does not change automatically on receipt/alias arrival. New matches append without reordering existing rows; explicit user resort is allowed.
- **C-19**: Root Q3: committee rows are validated-rights delegates. Unknown-rights signer observations remain separately inspectable. Per-phase receipt distinguishes received, absent in a usable source snapshot, partial/unavailable; no fabricated rights or network-wide inactivity.
- **C-24**: Root Q3: max12 immutable compact events per network independent of session-history eviction, retaining identity/provenance; accepted observation replay/render/resume cannot duplicate event.
- **C-29**: Root Q3: Teztale archived multi-observer/timelines excluded by explicit bounded browser-session contract; session reset/reload is disclosed as nonarchival loss. Provenance and explicit independent comparison retained, no archival receipt-timeline adoption in foundations; maintainer branching navigation remains required for later ASTRA.
- **C-20**: Root Q4: comparison names exact proven fields/context: matching source B network/head hash/level/round/time gives head agreement only; never proves payload-vote agreement or finality. Conflicting proven fields give divergence, shared payload/different candidate hash remains divergence. Insufficient selected historical context gives partial/unavailable, with current B head separately labelled. Unknown comparison never becomes full agreement from head match alone. Within the three-read budget, coherent cached rights may be reused only with proven chain/head/protocol/target compatibility and original rights provenance retained, never relabelled as source B rights. Without compatible rights, raw unknown-power partial comparison is valid and cannot trigger extra reads.
- **C-21**: Root Q4: all RPC endpoint reads (identity/head/rights/pending included) count against3; redirect/body completion inside original read's8-second deadline, no extra follow-up beyond budget. Workflow <=24 seconds, second click disabled/coalesced with no extra reads; no retries/cascade/polling.
- **C-22**: Root Q4 and Step2: age>=60 seconds is stale using monotonic elapsed time; exact context invalidation sticky even after switching away/back; receipt wall time always shown. No auto-refresh.
- **C-25**: Root Q4: same-level R+1 and next-level R0 conditional branches may coexist. Coherent context-pinned RPC baking rights establish expected producer; missing/conflicting rights make it unknown. Observed candidate exposes block hash; no future hash before observation.
- **C-26**: Root Q4: coherent protocol timing/reference head timestamp justify predicted countdown, next-level timer explicitly earliest protocol boundary conditional on hypothetical production, never promised actual timestamp. Missing inputs give unavailable. Expiry says prediction elapsed/awaiting observation. Observed same-level round advance is distinct from observed/applied next-level advance; same-height reorg and skipped delivered levels explicitly labelled, no invented intermediate blocks/events. Later ASTRA can use these facts; movement/layout remain out of scope.
- **C-27**: Root Q4: retain bounded existing primary fallback only with immutable actual response source/context. Explicit comparison and reconciliation have no automatic fallback. Divergence from Explorus cascade justified by independent source-limited comparison and bounded request contract.
- **C-28**: Root Q4/Q1: divergence from Explorus broader labels justified by unavailable global completeness/finality evidence. Labels name selected-source observed/absent/partial/unavailable and exact compared fields; no ambiguous global healthy/missing/finalized claims.

Additional maintainer direction captured without V3 aesthetics: observed blocks expose actual block hashes. Both conditional future branches (same-level next round and next-level round zero) expose expected proposer from coherent context-pinned RPC rights and a protocol-prediction timer or unavailable state. Future hash is unavailable until observed. Actual observed same-level round progression and applied next-level advancement stay distinct, so later ASTRA can move a follow-live viewport along the observed branch without disrupting pins. No movement/layout/palette/asset implementation belongs to foundations.

## Current managed-claims context — 2026-10-14

Root-approved KB migration activated the accepted contract under separate delegated authority; implementation verification remains absent. Default `node .harness/bin/claims-reconcile.js check` returned fresh for all three KB projections. The exact [context manifest](../roster/observatory-foundations/context.manifest.json) carries all 166 mandatory claims. Model digest: `88f0e279b244d15ec62d1384f6a74e3d51e7c69b98121933d9e3516a0d1bf5f2`. Freshness digest: `df956427d1682044239f38a92ca709c4e916d8790b615436699c6e60555549d7`. Earlier legacy/draft freshness observations above are historical phase evidence. Preserved binding V3 intent is [the V3 contract](../kb/context/v3-contract.md), with [required properties](../kb/context/required-properties.md); it is outside foundations visual scope.

## Root-Validated Planning Retention Clarifications

Root explicitly accepted these observable policies on 2026-10-14 under project-authority; they clarify the existing complete contract without locking implementation architecture.

- The 100 active-candidate index is separate from 150 full retained session instances. An identity evicted from the active index remains historically inspectable/selectable inside a retained snapshot and is clearly historical, no longer LIVE-active. A frozen pin is required when its HISTORY entry is evicted, not merely when the active candidate index evicts it. Each full snapshot retains at most 100 candidate facts; reaching that cap discloses partial historical candidate-fact retention and preserves the currently pinned selected candidate snapshot/facts. No truncation certifies completeness or zero.
- Crossing facts remain in retained instance/candidate context. Replay of an identity outside retained/admissible LIVE context cannot recreate live events. A concrete bounded retired-dedup strategy remains implementation investigation for independent review: no unbounded tombstones and no silent weakening of at-most-once. Where retired replay authority is uncertain, show observed quorum/current raw state without inventing a new crossing. Explicit context retirement requires provenance facts, not clock-only rejection. Overflow, replay and reorg behavior remain falsifiable acceptance cases.
- Bound per-record growth through the existing 10000-operation cap and unique delegate/identity facts; preserve mandatory provenance. Explicitly disclose partial retention at the 100-candidate-facts-per-snapshot cap. Truncation never creates a complete-coverage or zero claim.

- Root comparison priority: identity and head reads first, pending as the default third read. Compatible cached rights may authorize only with proven chain/head/protocol/target compatibility and original provenance. Otherwise raw unknown-power partial comparison is valid. No default rights-first and no fourth read. A data-dependent choice is allowed only if pending is known unavailable from the current explicit workflow and the workflow remains within three reads, with no retry/cascade. Verify actual endpoint reachability through implementation fixtures and bounded live checks.


## Current context after root-approved planning clarifications — 2026-10-14

The accepted contract now includes FR-091 through FR-094 with explicit historical candidate bounds, conservative retired-crossing handling and comparison-read priority. It retains 38 acceptance criteria and 38 planned checks, now mapping 94 requirements (170 managed claims). Real validation and default projection/check succeeded. Model digest: `d901111614cdd6f1741986c5ecec939c693c961dbbc88c2a873ff4631efd3507`. Freshness digest: `113f75b401e86d28db76e2179c62d2a2323e83ab3f7d718f327edc60ccca8512`. Earlier phase counts/digests above record their actual historical state; this paragraph and the current context manifest describe the latest contract. Implementation verification remains absent.
