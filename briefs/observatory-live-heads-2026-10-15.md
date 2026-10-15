# Bounded live head observations

At 2026-10-14 22:42:11–12 UTC (15 October 00:42 local time), a manual query of the seven configured header URLs returned the following observations. This is a point-in-time RPC sample, not a browser, committee, prediction or network-wide consensus certification.

| Configured URL queried | Result |
| --- | --- |
| `https://rpc.tzkt.io/mainnet` | Level 15375718; applied round 0; timestamp 22:42:10 UTC; chain `NetXdQprcVkpaWU` |
| `https://mainnet.smartpy.io` | HTTP 503 |
| `https://tezos-mainnet.octez.io` | HTTP 503 |
| `https://octez-mainnet-archive.octez.io` | HTTP 503 |
| `https://rpc.shadownet.teztnets.com` | Level 5489251; applied round 144; timestamp 22:38:45 UTC; chain `NetXsqzbfFenSTS` |
| `https://tezos-shadownet.octez.io` | Same Shadownet header |
| `https://shadownet.smartpy.io` | Same Shadownet header |

Mainnet hash: `BMH7AkxJyYPb9ARWATpbStJKUApGa7sAfNxgSFBZbPiqMpuk4pe`. Shadownet hash: `BMSm2r9yqHcdWYQTztvXPrt4eiQ3XEEsfCo8Uzf4nwAGGexDMa3`. All four successful replies state producing protocol `PsUshuai9QapM5TGj1JpuVGkdxz5GykdnEvS6Rh8SUVrARvZLCY`.

The actual integrated input guard accepted all four headers. The existing production `proposalRound(fitness, level)` decoder returned 0 and 144 respectively under Node22.23.3; its executable probe exited0. The round comes from returned fitness, not elapsed clock. Shadownet's round bytes are `00000090`, with level bytes `0053c263` matching5489251.

The earlier bounded sample observed Shadownet at the same level with a different hash, round128 and timestamp20:48:45 UTC. These two samples do not prove continuous stagnation, intermediate transitions or a specific reorganisation path. Agreement among three configured URLs does not prove independent backends, vote agreement, finality or the state of all nodes. Redirect responder attribution was not separately established; these observations identify configured request URLs and do not authorize application accounting.

The seven initial requests used four workers, ten-second timeouts and one-megabyte body limits, without retries or periodic collection. Raw replies are retained locally at `/tmp/observatory-head-audit-20261015.json`. Initial searches guessed nonexistent configuration paths (exit2); the actual configured URLs were then read from `src/rpc/networkData.ts`.

The HTTP503 results are transient observations, not proof of permanent provider failure. Missing helper proof must remain unavailable in the application. No committee totals, phase zero, current vote round, future proposer, timer, served-page value or browser CORS behavior is verified by this sample. The whole foundations and UI gates remain open.
