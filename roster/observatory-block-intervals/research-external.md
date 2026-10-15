# External ecosystem research

Research date: 2026-10-15 UTC. Starting input: `questions.manifest.json` only. Scope: exactly ecosystem questions 8 and 9. No project implementation or other research reports were inspected. Official documentation and upstream source are distinguished below from direct observations. Source branches are mutable; source observations establish what the inspected upstream branch contains, not the version deployed by a public provider.

## Question 8

> [ecosystem] What historical block lookup, timestamp filtering, ordering, pagination, historical retention and browser-access capabilities do current official TzKT and Tezos node interfaces document for Mainnet and Shadownet?

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

## Question 9

> [ecosystem] How do documented Tezos explorers or monitoring tools define and calculate average block time and fixed-time observation windows, including boundary intervals, arithmetic denominators, partial history and the distinction between chain health and data-source availability?

The official consensus reference defines inter-block time as the difference of block timestamps. A timestamp marks the beginning of the agreed round. Round duration is `minimal_block_delay + round * delay_increment_per_round`; predecessor/current decision rounds determine actual delay. Normal round-zero production gives the minimum delay. This defines individual chain intervals and protocol timing, **not** an explorer's historical average or fixed-time sampling policy. [The consensus algorithm — Time between blocks, Octez documentation contributors, 2018–2026](https://octez.tezos.com/docs/active/consensus.html#time-between-blocks).

TzIndex's upstream block-series implementation counts each added block and sums supported fields, filtering by requested time range; its listed series fields contain `count` but no average block-time field. Empty buckets, null buckets and interpolation are distinct supported representations. These source facts do not establish an average-block-time denominator or which cross-boundary predecessor interval a frontend includes. [server/series/block.go, Alex / Blockwatch Data Inc., copyright 2020–2024, lines 20–114, 141–230, 428–460](https://raw.githubusercontent.com/blockwatch-cc/tzindex/master/server/series/block.go).

TzIndex's tip source separately returns `health` and crawler `status`. Health uses recent round/endorsement penalties and recency weights, and applies overdue-head penalties only when the crawler is synchronized. The call comment says 128 blocks but passes `history=127`, and the query selects `height > height-history` with that limit: another source-level boundary discrepancy. This is an implemented health score, not an arithmetic interval average; database access failure can return health zero. [server/explorer/tip.go, Alex / Blockwatch Data Inc., copyright 2020–2024, lines 46–49, 151–152, 171–252](https://raw.githubusercontent.com/blockwatch-cc/tzindex/master/server/explorer/tip.go).

Octez describes synchronization as a peer/timestamp heuristic and continues exposing node synchronization after bootstrap through `/chains/<chain>/is_bootstrapped`. Thus this documented status concerns the node's relationship to peers; it is separate evidence from timestamp differences in the chain. [Synchronisation heuristic, Octez documentation contributors, 2018–2026](https://octez.tezos.com/docs/shell/sync.html).

Octez monitoring documentation distinguishes instantaneous scraped metrics from retained time series and states retention is configurable. It also warns that some metrics can be absent from the external RPC process and require aggregation with node metrics. The page does not specify an average chain-block interval formula, fixed-window boundary assignment or partial-history denominator. [Monitoring an Octez Node, Octez documentation contributors, 2018–2026](https://octez.tezos.com/docs/user/node-monitoring.html).

### Unresolved evidence limits

No inspected official TzKT or Tezos explorer documentation specified a fixed-time average's exact denominator, interval inclusion at start/end, wall-clock versus head anchor, weighting of a boundary-spanning interval, or partial-history normalization. No universal Tezos explorer convention is established here. The native TzKT explorer pages yielded effectively empty text through document fetch, and `https://docs.tzstats.com/api/explorer#blockchain-status` could not be fetched. Upstream TzIndex source supplies concrete behavior only for the files described above; it does not prove any current public frontend's formula or deployment. API-provider failure, node synchronization, and chain interval observations remain distinct evidence categories in the sources inspected.
