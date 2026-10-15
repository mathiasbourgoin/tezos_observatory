# Research — observatory-block-intervals

_Generated: 2026-10-15T06:15:37.378930+00:00_
_Mode: full_
_Online research: enabled (Q8–9 only)_

Neutral manifest validation passed with question digest `950a22e529577327d8f98cec72edc519cdbc04367b123d6a498d45799821430a`; technical identifiers empty. Source baseline: `9cdd07f29c2268d015dbc56dcc041583ff663473`. Pattern Finder inspected `82196fd2ce94d13bc86a9332161ce69bac172b6a`; `git diff` confirms identical `src` and `tests` between those revisions. This report covers that accepted application baseline; concurrent implementation branches were not examined.

All four roles actually ran: Locator, Analyzer, Pattern Finder, External Researcher. Four runtime slots required sequential specialists while the root coordinated other work. Requested haiku/sonnet tiers were unavailable: Locator/Pattern Finder used gpt-6-luna, External Researcher gpt-6.1-sol, Analyzer the inherited workhorse. No role was skipped. Role artifacts: `research-locator.md`, `research-analyzer.md`, `research-patterns.md`, `research-external.md` in this directory. Locator paths were candidates only; behavioral citations were opened and confirmed. Graph orientation resolver absent; no research-specific pre/post hook installed. This research changed no application code or dependency and ran no build/test suite.

## Question 1: Which network data sources, TzKT integrations and transport interfaces currently expose applied block headers, predecessor hashes, levels, timestamps and protocol identity, and what history, pagination, browser CORS and failure constraints are documented or enforced for each?

**Finding and references:**

- `src/rpc/networkData.ts:14` lists Mainnet SmartPy, Octez public and Octez archive, and Shadownet Teztnets, Octez public and SmartPy. `src/rpc/networkData.ts:53` prepends TzKT RPC Mainnet for streaming; Shadownet stream sources reuse the three RPC sources. The comment at line 51 records browser-monitor support and restricted helper routes, but is not current provider verification.
- `src/monitor/networkMonitor.ts:138`, `:174`, `:216` use `/monitor/heads/main`, validated mempool monitor, and `/monitor/validated_blocks?chain=main`, respectively. `src/main.ts:509` restricts Mainnet proposals to first stream source (TzKT); Shadownet proposals use its RPC pool.
- `src/rpc/guards.ts:35` validates headers (hash, predecessor, nonnegative level, timestamp, fitness, optional protocol counter); `:64` unwraps validated-block envelopes and chain ID. Protocol counter differs from protocol hash: `src/rpc/networkData.ts:197` loads exact hash header and `/protocols`, requiring chain and protocol identities before context caching (`:202`).
- `src/rpc/networkData.ts:312` fetches current head; exact historical hash fetch is private context lookup (`:186`). The proven predecessor is loaded at `:216`, with level/chain/protocol transition checks (`:217`). Derived state exposes one predecessor (`:361`), not a historical range query.
- `src/rpc/networkData.ts:395` uses TzKT REST only for delegates aliases, one `limit=10000` address/alias request (`:401`); failures do not determine consensus health (`:418`). No block-history TzKT REST integration was found in this module.

---

## Question 2: How does the application distinguish applied chain heads, predecessor chains, competing proposals, rounds and reorganizations, and which existing data structures retain or discard these observations?

**Finding and references:**

- Applied heads enter `acceptHead` (`src/monitor/networkMonitor.ts:317`); validated proposals enter separate `acceptProposal` (`:399`). Candidate identity includes network, source URL, chain ID and block hash (`:400`). Proposal observations do not directly replace the applied-head snapshot.
- `src/monitor/headGeneration.ts:17` keys immutable head facts including timestamp, fitness, parent and protocol counter. A changed fact or source increments generation, aborts old work, clears derived authority and retains only current/next-level operations (`:28`).
- `src/monitor/networkMonitor.ts:373` retains one prior proven head and one latest progression. Classification requires same source and chain: next-level requires direct predecessor and protocol transition; same-level-round requires shared parent/protocol and increased round; other same-height is reorganization, jumps exceeding one level are skipped-levels, remaining changes are head-change (`:380`). These labels describe observed transitions, not a retained canonical chain database.
- `src/monitor/observationStore.ts:144` stores latest head per source, increments observer generation when facts change, removes incompatible authority contexts (`:150`) and rechecks targets. Candidate insertion de-duplicates against current or historical identity (`:161`). Context proof rejects different chain/parent/protocol or contradictory predecessor round (`src/rpc/networkData.ts:217`, `:371`).

---

## Question 3: What historical block or consensus observations are retained in memory or storage, for how long and with what bounds, and how are coverage, gaps, duplicate observations and timestamp validity represented?

**Finding and references:**

- Runtime state uses Maps and stores: `src/monitor/observationStore.ts:99` raw operations capped at 10,000 with infinite TTL; `:100` unresolved targets; `:101` accepted candidates; `:102` accepted consensus instances; `:106` latest per-source heads; `:115` session snapshots. No persistence of block or consensus history was found. Browser localStorage persists disclosure and selected-network preferences (`src/dashboardView.ts:40`, `:217`, `:219`); sessionStorage/indexedDB matches were not found in `src`.
- Unresolved/accepted candidates cap at 100 (`src/monitor/observationStore.ts:167`); instances cap at 150 (`:213`). Trimming sorts receipt monotonic time, removes oldest and marks crossing history uncertain when admitted facts are lost (`:327`). These are count bounds, not a fixed historical time range.
- Session history caps at 150 (`src/monitor/observationStore.ts:417`), candidates within snapshot at 100 (`:394`), signer/conflict unions at 10,000 (`:402`), phase facts at 500 (`:462`), accepted events at 12 (`:457`). Evicted selected snapshot may become frozen pin (`:417`). Partial capture carries an explicit historical-retention reason (`:412`).
- `src/rpc/operationStore.ts:8` de-duplicates using source, chain, requested/observed head and operation hash. Generic TTL defaults to 120 seconds (`:18`), but both observation raw and HeadGeneration explicitly use Infinity (`src/monitor/headGeneration.ts:25`). Oldest insertion is removed at count bound (`src/rpc/operationStore.ts:30`).
- Source pending coverage brackets the snapshot with before/after heads and contexts; marks missing/malformed content, >10,000 raw category, or context change partial (`src/rpc/networkData.ts:320`). Retention truncation downgrades complete coverage (`src/monitor/observationStore.ts:261`). Interrupt/pause marks retained coverage stale (`:140`).
- `src/rpc/guards.ts:13` validates ISO timestamps, real local calendar days including leap years, offsets and finite Date.parse. This is per-timestamp validity, not a proof that successive blocks are chronologically increasing.

---

## Question 4: Where are request concurrency, pagination, caching, retry, timeouts and total acquisition limits defined, and how do network switching, visibility, pause/resume and stale asynchronous work affect their lifecycle?

**Finding and references:**

- `src/rpc/networkData.ts:277` tries exact source or current source followed by other configured providers sequentially, counts requests, disables HTTP cache, combines cancellation with 8-second timeout including response body, and checks generation after parsing. There is no overall acquisition-count ceiling or history pagination loop in this facade.
- Exact hash context reads header/protocol concurrently (`src/rpc/networkData.ts:197`), with shared pending promises and 12-entry cache (`:193`, `:206`). Committees and constants also cap at 12 (`:252`, `:269`); baking rights cap at 32 (`:446`). Derivation runs current/next level in parallel, and rights/constants per level in parallel (`:353`).
- `src/monitor/observerReconciliation.ts:24` has one active and one newest queued workflow per source, 15-second spacing (`:79`), suppresses repeats of successful/failed keys (`:58`), permits manual failed retry after spacing (`:60`), retains at most 100 failed keys (`:90`), and aborts/invalidates on stop (`:46`).
- `src/rpc/streamTransport.ts:70` makes streaming no-store fetch with abort signal, no finite quiet-stream timeout. Failures rotate providers and reconnect with exponential delay capped at 30 seconds before 0.8–1.2 jitter (`:131`). Normal mempool close reconnects after 50ms if connection lasted >=1s, otherwise 1s (`:101`). Stale controller results are discarded before parsing/dispatch (`:77`, `:87`).
- `src/monitor/networkMonitor.ts:247` starts all three streams; bootstrap timeout defaults 8 seconds (`:268`), fallback mempool defaults 30 seconds (`:514`), head fallback 15 seconds (`:551`). Fallback timers schedule after completion; lifecycle guards reject stale results (`:480`, `:527`). Stop aborts lifecycle/head/reconciliation/stream work and clears timers (`:278`).
- `src/main.ts:78` pauses comparison, monitor, data and opportunity work together; resume creates opportunity controller and restarts collection (`:82`). Both networks have independent runtimes (`:502`); visibility/pagehide/pageshow drive collection (`:547`). The 1-second UI tick schedules rendering (`:556`).
- `src/rpc/networkData.ts:170` pause advances collection generation, aborts auxiliary requests and clears pending lookup maps; resume gets new controller (`:176`). `src/monitor/headGeneration.ts:105` refuses obsolete derived commits. `src/rpc/sourceComparison.ts:109` limits comparison to three sequential reads (chain ID, head, pending; `:126`–`:135`), eight seconds per read including body and 24 seconds total (`:116`, `:120`), no-store and redirect rejection (`:118`). Distinct configured same-network providers are required (`:96`); the active promise is shared rather than duplicated (`:88`). Comparison results are discarded on generation change (`:98`).

---

## Question 5: Which existing calculations and tests derive durations, elapsed time, rates, averages or network health from block data, and what timestamp ordering, weighting, sample counts and observation boundaries do they use?

**Finding and references:**

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

The application's health state prioritizes coverage degradation, then elapsed coherent prediction, then an actual proven observed transition. It labels next-level, same-level-round and skipped-level observations healthy only when they match the applied head/source (`src/main.ts:317`–`319`). Head age uses a nonnegative timestamp difference (`src/main.ts:192`); receipt age and snapshot age use monotonic elapsed time (`src/dashboardView.ts:262`). The inspected code does not calculate a multi-block arithmetic mean or a fixed-time interval sample count; its cumulative sum is over protocol round durations (`src/consensus/roundSchedule.ts:5`), and its percentage denominator is committee power (`src/dashboardView.ts:63`). No average-window endpoint or weighting policy was found in the searched source.

---

## Question 6: How do existing UI components and tests present network metrics, source attribution, freshness, observation ranges, partial coverage, unavailable values and failures across desktop and mobile layouts?

**Finding and references:**

The network panel separates applied block context, proposal context, stream freshness, and an independent timing estimate. Its initial presentation uses explicit unavailable/loading text, including “Last applied block unavailable,” “No observation yet,” and “Independent clock estimate unavailable” ([dashboardView.ts](/home/mathias/dev/tezos_observatory/src/dashboardView.ts:220)). It also provides a disclosure named “Sources & observation evidence,” with fields for primary source, applied head, block hash, last successful head, last operation, block age, and snapshot age ([dashboardView.ts](/home/mathias/dev/tezos_observatory/src/dashboardView.ts:244)).

Each UI tick calculates observation age from a monotonic receipt time, snapshot age from a separate monotonic time, and block age from wall-clock observation time plus elapsed monotonic age. Missing inputs display “Unavailable”; ages are clamped to nonnegative values ([dashboardView.ts](/home/mathias/dev/tezos_observatory/src/dashboardView.ts:260)). The independent clock estimate renders the level, estimated current/next rounds, next boundary timestamp, and evidence attribution, while explicitly labeling it separate from selected branch deadlines ([dashboardView.ts](/home/mathias/dev/tezos_observatory/src/dashboardView.ts:267)).

Status labels distinguish “Observed advance,” “Progress unknown,” “Prediction elapsed,” and “RPC coverage degraded” ([dashboardView.ts](/home/mathias/dev/tezos_observatory/src/dashboardView.ts:273)). Timing absence renders “Timing unavailable” and “Independent clock estimate unavailable” ([dashboardView.ts](/home/mathias/dev/tezos_observatory/src/dashboardView.ts:267)).

Responsive UI coverage checks 1440 px and 390 px widths for horizontal clipping and gauge visibility. A mobile scenario checks network selection and disclosure persistence across reload, then verifies pause state in the connection line ([dashboard.spec.ts](/home/mathias/dev/tezos_observatory/tests/e2e/dashboard.spec.ts:227)).

Retained pinned UI explicitly records first receipt, fact receipt, original source/context and partial history, and distinguishes captured source snapshot coverage from global completeness (`src/main.ts:133`). Pause text describes retained observations and the original snapshot receipt (`src/main.ts:359`). Unknown voting power displays an em dash/unavailable rather than a measured zero (`src/dashboardView.ts:63`–`70`). At mobile widths the CSS wraps gauge headers and adjusts network tabs (`src/dashboard.css:735`); the same evidence components are used.

The persisted values found in this UI are view preferences (network selection/disclosures), not block-history storage: `src/dashboardView.ts:40`–`49` reads/writes disclosure preferences; `:217`–`219` reads/writes network preference; `:244` names the evidence disclosure storage key, while `tests/e2e/dashboard.spec.ts:238` checks those preferences across reload. This qualifies the Analyzer's storage search: no block/consensus-history persistence was found; it is not a claim that the UI uses no browser storage.

---

## Question 7: Which existing fixtures, deterministic tests and documented provider checks cover long historical ranges, changing protocol timing, missing predecessors, reorganizations, malformed timestamps and interrupted browser requests?

**Finding and references:**

`roundSchedule.test.ts` uses fixed numeric anchors and expected timestamps, including exact-boundary and high-round cases, rather than depending on live provider values ([roundSchedule.test.ts](/home/mathias/dev/tezos_observatory/tests/unit/roundSchedule.test.ts:9)). The end-to-end dashboard tests use a page clock and synthetic headers with explicit levels, rounds, hashes, predecessors, and timestamps. They exercise conditional deadlines, elapsed prediction, observed same-level and next-level advances, same-height reorganization, skipped levels, and a timing-constants HTTP 503 ([dashboard.spec.ts](/home/mathias/dev/tezos_observatory/tests/e2e/dashboard.spec.ts:914), [dashboard.spec.ts](/home/mathias/dev/tezos_observatory/tests/e2e/dashboard.spec.ts:976)).

The timing-failure case retains the applied level while showing unavailable timing and “Progress unknown”; a later delivered head can still advance the applied level, and a stream interruption produces the degraded-coverage status ([dashboard.spec.ts](/home/mathias/dev/tezos_observatory/tests/e2e/dashboard.spec.ts:919)). Other deterministic UI cases inject large protocol timing values and check that the clock estimate does not render `NaN` or `Invalid Date`, while unsupported computed boundaries remain unavailable ([dashboard.spec.ts](/home/mathias/dev/tezos_observatory/tests/e2e/dashboard.spec.ts:989), [dashboard.spec.ts](/home/mathias/dev/tezos_observatory/tests/e2e/dashboard.spec.ts:1000)).

Additional deterministic evidence: `tests/unit/networkData.test.ts:92` supplies current/successor timing [6,3] and [10,4] under different protocol hashes and verifies original anchor/source receipts; `:199` tests activation protocol identity separately; `:247` rejects contradictory predecessor-round authority. `tests/unit/guards.test.ts:141` rejects calendar rollover, missing timezone and invalid month. `tests/unit/networkData.test.ts:67` tests alias abort and late-body rejection; `:74` tests ignored cancellation during eligibility. `tests/unit/networkMonitor.test.ts:100` checks old derivation and hidden-page lifecycle; `tests/unit/streamTransport.test.ts:56` checks late fetch after restart. These cases were read, not executed during research.

The inspected deterministic sources establish local context/retention and protocol-timing cases, not a long historical block-range acquisition test. No existing test demonstrating multi-page long block history, a full missing-predecessor history range, or fixed-time average boundary/denominator was located. The only new provider checks in this phase are the two small TzKT requests in Q8; neither proves complete historical coverage or hosted-node archival retention. No prior task-intent reports were used as provider proof.

---

## Question 8: [ecosystem] What historical block lookup, timestamp filtering, ordering, pagination, historical retention and browser-access capabilities do current official TzKT and Tezos node interfaces document for Mainnet and Shadownet?

**Finding and references:**

### TzKT documented interfaces

TzKT documents anonymous free API access, REST historical data and WebSocket real-time subscriptions. Mainnet bases are `https://api.tzkt.io/` and `https://api.mainnet.tzkt.io/`; Shadownet is `https://api.shadownet.tzkt.io/`. It says all historical data can be fetched; this is a capability statement, not evidence that every historical row is continuously available. The free tier requires linked TzKT attribution. Its head response includes indexed `level`, `knownLevel`, block `timestamp` and indexer `lastSync`, separating block time from indexer synchronization. [TzKT API 1.17.3, Baking Bad Team, publication year unspecified](https://api.tzkt.io/).

Upstream `BlocksController.cs` exposes blocks by hash, integer level, timestamp, level-to-timestamp and timestamp-to-level. Lists accept level/timestamp filters, projections, sort, offset and limit (default 100, range 0–10000). Allowed sort fields include `id` (default), `level`, round/power/reward/fee fields; timestamp sorting is not on that list. Documentation calls timestamp lookup “closest,” while both timestamp handlers actually call `SearchMode.ExactOrLower`: a material ambiguity if “closest” is read as absolute nearest. The controller alone does not establish behavior before genesis or after the indexed head. [BlocksController.cs, Baking Bad upstream, year unspecified, lines 34–207](https://raw.githubusercontent.com/baking-bad/tzkt/master/Tzkt.Api/Controllers/BlocksController.cs).

The upstream server enables any header/method and accepts every origin with credentials, exposing TzKT version, indexed level, known level and synchronized-at response headers. This establishes the upstream CORS policy; deployed response evidence is recorded separately below. [Program.cs, Baking Bad upstream, year unspecified, lines 245–254](https://raw.githubusercontent.com/baking-bad/tzkt/master/Tzkt.Api/Program.cs).

### Octez/Tezos node documentation

The shell block-list RPC accepts `length`, repeated `head` hashes and `min_date`; it returns hash fragments sorted by decreasing fitness and is described as going back to the checkpoint. `min_date` excludes earlier timestamps, but an explicitly supplied `length` can return that many predecessors regardless of date. This is not a TzKT-style offset/limit timestamp-sorted block table. Shell endpoints also expose caboose, savepoint and checkpoint levels and `/config/history_mode`. [Shell RPCs — Reference, Contributors to Octez & Tezos protocol documentation, 2018–2026](https://octez.tezos.com/docs/shell/rpc.html).

The official getting-started guide demonstrates `/chains/main/blocks/head/header/shell` for the block timestamp. It also shows block operations, metadata and protocol constants under block paths; constants can differ between Mainnet and test networks. [Getting started with Octez, Octez documentation contributors, 2018–2026](https://octez.tezos.com/docs/introduction/howtouse.html).

History depends on the operator's mode. Archive retains full history; full retains block/operation data from genesis while pruning old context/metadata; rolling removes old blocks. Rolling is documented as the default. Caboose identifies the lowest known block, savepoint the oldest full-context/metadata boundary. Complete recent history is governed by preservation cycles plus configured additional cycles. **Documentation inconsistency:** the current history page explains Mainnet `rolling:5` as six cycles (one required plus five additional), but a later example calls the same configuration ten cycles. No fixed public-provider retention duration follows from that page. [History modes, Octez documentation contributors, 2018–2026](https://octez.tezos.com/docs/user/history_modes.html).

RPC access is not enabled by default and depends on operator exposure/ACL. Runtime configuration has `cors-origin` and `cors-headers`; therefore generic node functionality alone does not establish browser access to any particular hosted RPC. [JSON/RPC interface, Octez documentation contributors, 2018–2026](https://octez.tezos.com/docs/developer/rpc.html), [Octez RPC OpenAPI, Octez documentation contributors, year unspecified](https://octez.tezos.com/docs/_static/rpc-openapi.html).

Teztnets documents Shadownet as a long-term network shadowing Mainnet, activated 2025-08-07T20:00:00Z, and lists `https://rpc.shadownet.teztnets.com`. Its page links a rolling snapshot, which does not establish that hosted RPC's retention mode or CORS policy. [Shadownet, Teztnets, year unspecified](https://teztnets.com/shadownet-about).

### Bounded direct observations

Exactly **2 GET probes** were made, no retries. Each used an eight-second network timeout and an 8192-byte response cap, `Origin: https://example.com`, and anonymous access. Both bodies fit the cap. No node RPC was probed.

| UTC request start | Endpoint | Status / shape / result |
| --- | --- | --- |
| 2026-10-15T06:12:25.498664Z | `https://api.tzkt.io/v1/blocks?timestamp.ge=2025-01-01T00%3A00%3A00Z&sort.asc=level&limit=2&select=level,timestamp,hash` | 200; array of two projected objects; levels 7522116 and 7522117, timestamps 2025-01-01T00:00:00Z and 00:00:10Z |
| 2026-10-15T06:12:27.597166Z | `https://api.shadownet.tzkt.io/v1/blocks?timestamp.ge=2025-01-01T00%3A00%3A00Z&sort.asc=level&limit=2&select=level,timestamp,hash` | 200; array of two projected objects; levels 0 and 1, timestamps 2025-08-07T20:00:00Z and 2025-08-08T09:47:05Z |

Both responses included `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Credentials: true`, and exposed `Tzkt-Version,Tzkt-Level,Tzkt-Known-Level,Tzkt-Synced-At`. These observations establish successful timestamp lower-bound filtering, ascending level order, small limit/projection and anonymous cross-origin response headers at that instant. They do not test a browser, credentialed fetch, preflight, other filters, paging continuity, full history completeness, provider quotas or ongoing availability. The Mainnet exact-boundary row demonstrates inclusive `.ge` for that example; Shadownet's result establishes a returned genesis row, not uninterrupted later history.

---

## Question 9: [ecosystem] How do documented Tezos explorers or monitoring tools define and calculate average block time and fixed-time observation windows, including boundary intervals, arithmetic denominators, partial history and the distinction between chain health and data-source availability?

**Finding and references:**

The official consensus reference defines inter-block time as the difference of block timestamps. A timestamp marks the beginning of the agreed round. Round duration is `minimal_block_delay + round * delay_increment_per_round`; predecessor/current decision rounds determine actual delay. Normal round-zero production gives the minimum delay. This defines individual chain intervals and protocol timing, **not** an explorer's historical average or fixed-time sampling policy. [The consensus algorithm — Time between blocks, Octez documentation contributors, 2018–2026](https://octez.tezos.com/docs/active/consensus.html#time-between-blocks).

TzIndex's upstream block-series implementation counts each added block and sums supported fields, filtering by requested time range; its listed series fields contain `count` but no average block-time field. Empty buckets, null buckets and interpolation are distinct supported representations. These source facts do not establish an average-block-time denominator or which cross-boundary predecessor interval a frontend includes. [server/series/block.go, Alex / Blockwatch Data Inc., copyright 2020–2024, lines 20–114, 141–230, 428–460](https://raw.githubusercontent.com/blockwatch-cc/tzindex/master/server/series/block.go).

TzIndex's tip source separately returns `health` and crawler `status`. Health uses recent round/endorsement penalties and recency weights, and applies overdue-head penalties only when the crawler is synchronized. The call comment says 128 blocks but passes `history=127`, and the query selects `height > height-history` with that limit: another source-level boundary discrepancy. This is an implemented health score, not an arithmetic interval average; database access failure can return health zero. [server/explorer/tip.go, Alex / Blockwatch Data Inc., copyright 2020–2024, lines 46–49, 151–152, 171–252](https://raw.githubusercontent.com/blockwatch-cc/tzindex/master/server/explorer/tip.go).

Octez describes synchronization as a peer/timestamp heuristic and continues exposing node synchronization after bootstrap through `/chains/<chain>/is_bootstrapped`. Thus this documented status concerns the node's relationship to peers; it is separate evidence from timestamp differences in the chain. [Synchronisation heuristic, Octez documentation contributors, 2018–2026](https://octez.tezos.com/docs/shell/sync.html).

Octez monitoring documentation distinguishes instantaneous scraped metrics from retained time series and states retention is configurable. It also warns that some metrics can be absent from the external RPC process and require aggregation with node metrics. The page does not specify an average chain-block interval formula, fixed-window boundary assignment or partial-history denominator. [Monitoring an Octez Node, Octez documentation contributors, 2018–2026](https://octez.tezos.com/docs/user/node-monitoring.html).

### Unresolved evidence limits

No inspected official TzKT or Tezos explorer documentation specified a fixed-time average's exact denominator, interval inclusion at start/end, wall-clock versus head anchor, weighting of a boundary-spanning interval, or partial-history normalization. No universal Tezos explorer convention is established here. The native TzKT explorer pages yielded effectively empty text through document fetch, and `https://docs.tzstats.com/api/explorer#blockchain-status` could not be fetched. Upstream TzIndex source supplies concrete behavior only for the files described above; it does not prove any current public frontend's formula or deployment. API-provider failure, node synchronization, and chain interval observations remain distinct evidence categories in the sources inspected.

## Patterns found

| Pattern | File | Lines | Notes |
|---|---|---|---|
| Hash-pinned header/protocol proof | `src/rpc/networkData.ts` | 186–220 | Exact context and predecessor identity, 12-entry context cache |
| Generation-gated async commit | `src/monitor/headGeneration.ts` | 28–41, 105–122 | Abort old derivation and reject obsolete results |
| Source-local transition classification | `src/monitor/networkMonitor.ts` | 373–383 | One retained previous proven head; reorg/skipped/direct progress labels |
| Bounded retained session facts | `src/monitor/observationStore.ts` | 387–417 | Count caps, partial marker, frozen selected pin |
| Cumulative protocol schedule | `src/consensus/roundSchedule.ts` | 5–34 | `r*m + i*r*(r-1)/2`; exact-boundary correction |
| Known/unavailable metric rendering | `src/dashboardView.ts` | 63–71, 260–275 | Power denominator versus unknown state; monotonic freshness |
| One-shot source comparison | `src/rpc/sourceComparison.ts` | 108–135 | Three reads; 8s body deadline / 24s total |

## External prior art

| Tool / approach | Primary source | Existing behavior |
|---|---|---|
| TzKT blocks REST | [Blocks controller](https://raw.githubusercontent.com/baking-bad/tzkt/master/Tzkt.Api/Controllers/BlocksController.cs) | Timestamp/level filters, level sorting and bounded list pagination; exact-or-lower time lookup |
| Octez historical RPC | [Shell RPC reference](https://octez.tezos.com/docs/shell/rpc.html), [history modes](https://octez.tezos.com/docs/user/history_modes.html) | Hash fragments and operator-dependent retention/context availability |
| Tenderbake timing | [Consensus reference](https://octez.tezos.com/docs/active/consensus.html#time-between-blocks) | Individual inter-block timestamp difference and round-dependent duration |
| TzIndex explorer health | [Tip implementation](https://raw.githubusercontent.com/blockwatch-cc/tzindex/master/server/explorer/tip.go) | Weighted recent consensus penalties with crawler synchronization gating |
| Node monitoring | [Octez monitoring](https://octez.tezos.com/docs/user/node-monitoring.html) | Scraped metrics and configurable retained time series |

## Coverage gaps

- Q1/Q8: Actual CORS, history boundaries, quotas and current availability of the configured node RPC pools remain unproven. An archive URL name and generic node capability do not establish deployed retention. Two anonymous TzKT small-result responses establish only the enumerated instant observations; browser execution, preflight and paging continuity were not tested.
- Q3/Q7: No retained long canonical block series, complete historical gap model, or long-range pagination test was located in the inspected application/test files. Existing session retention is bounded by counts and source-local consensus observations. No test run was part of research.
- Q7: Missing/contradictory context and predecessor-round cases exist, but a complete missing-predecessor historical-range fixture was not located. Prior task-intent documents were intentionally excluded.
- Q8: TzKT timestamp lookup wording and controller exact-or-lower implementation differ; behavior outside available history was not established. Octez rolling-cycle examples conflict internally. Fixed public-provider retention duration cannot be inferred.
- Q9: Exact fixed-time average denominator, boundary-spanning interval inclusion, head versus wall-clock anchor, partial-history normalization and any universal explorer convention remain unresolved. No formula is invented from unrelated series counts or protocol round schedules. Mutable upstream source is evidence about inspected source only, not deployed frontend versions.
