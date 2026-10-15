# Real TzKT history and mean snapshot

Root made ten anonymous browser-origin GETs on 15 October 2026 at **09:09:20–09:09:21 UTC**, from the actual public site origin with its app assets blocked. Each network used one fixed batch start, its configured TzKT origin, one end, three cutoff floors and a final fixed-level end recheck. All ten returned HTTP200; each body was115–116bytes. End hash/level/timestamp matched its final recheck. There were no retries, fallback sources, credentials, background app streams or node mutations. Per-read full-body caps were8s/16KiB, per-network budget24s/six reads, with at most two floor reads in flight.

Root independently recomputed `(end timestamp − start timestamp) / (end level − start level)` from raw JSON using Python's datetime arithmetic, rather than importing application code. These are endpoint spans reported by TzKT; intermediate ancestry and completeness were not independently verified. This is a provider snapshot, **not final UI, deployment or full release acceptance**.

| Network | Requested window | Mean seconds/block | Completed intervals | Actual covered duration |
| --- | --- | ---: | ---: | --- |
| Mainnet | 1 week | 6.04 | 100,075 | 7 days |
| Mainnet | 24 hours | 6.08 | 14,206 | 24h00m03s |
| Mainnet | 1 hour | 6.02 | 599 | 1h00m03s |
| Shadownet | 1 week | 7.11 | 85,018 | 7 days |
| Shadownet | 24 hours | 232.23 | 415 | 26h46m15s |
| Shadownet | 1 hour | 172.24 | 404 | 19h19m45s |

Mainnet's fixed end was level15,381,958 at09:09:19 UTC; Shadownet's was5,489,655 at09:09:18 UTC. Initial `Tzkt-Level` and `Tzkt-Known-Level` headers both equaled those respective ends, supporting zero reported indexer lag in these particular initial responses; no missing metadata was interpreted as zero. Endpoint ages at acquisition start were1.550s and2.705s respectively. These facts do not constitute a general network-health classification.

The large Shadownet short-window means are coherent with the contract's inclusion of the whole interval crossing the cutoff. For the requested hour, the floor was5,489,251 at `2026-10-14T13:49:33Z`, before the earlier long gap; the end was5,489,655 at `2026-10-15T09:09:18Z`. The actual69,585-second span divided by404 intervals is172.240099…s. This is **not a claim that blocks are currently arriving every172s**, or that the actual included history lasts exactly one hour. Root requested that Astra preserve plainly visible actual coverage and crossing qualification alongside requested-window labels; a compact human-readable duration is appropriate without changing the validated query/math. The unknown cause of the earlier stall remains unknown.

Exact URLs, endpoint hashes/timestamps/counts, unrounded means and raw-receipt SHA256 are preserved in `roster/observatory-block-intervals/live-history-snapshot.json`. Raw responses and the bounded one-off browser reader remain private under `/var/tmp/observatory-live-history-20261015/`. Later final-source UI/provider/deployment checks remain mandatory.
