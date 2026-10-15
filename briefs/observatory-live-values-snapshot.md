# Bounded live numerical snapshot

Observation date: 2026-10-14. RPC interval 20:53:59–20:54:26 UTC; hosted browser interval 2026-10-14T20:54:40.497Z–2026-10-14T20:54:44.704Z.

Read-only snapshot of public deployment `v2 / 631de28`; local revision `1866085` was not deployed by this check. No full contract QA claim.

## Independent RPC facts

| Network | Chain | Applied level | Applied round from fitness | Shell proto | Block timestamp UTC |
| --- | --- | ---: | ---: | ---: | --- |
| Mainnet | `NetXdQprcVkpaWU` | 15374642 | 0 | 25 | 2026-10-14T20:54:25Z |
| Shadownet | `NetXsqzbfFenSTS` | 5489251 | 128 | 4 | 2026-10-14T20:48:45Z |

Mainnet hash: `BLS9PTHtR8xQBAANSBVjFELycfn2AujzJ6P3iv9UfmG2uDZMZLe`. Shadownet hash: `BKzzQvg55qde8fYhmBuMnoLbpZcVur8ohAgKzWo61SqFhvWGzGy`. Both headers report protocol `PsUshuai9QapM5TGj1JpuVGkdxz5GykdnEvS6Rh8SUVrARvZLCY`. Fitness slot 4 contains the applied round (`00000000` / `00000080`); shell `proto` is not the round.

Shadownet hash-pinned constants: committee 7,000, quorum 4,667, minimum delay 6 seconds, per-round increment 3 seconds. Hash-pinned rights at level 5,489,251 contain 25 delegates with total power 7,000. Metadata level/protocol match the header. Head timestamp was approximately 5m14s before the independent request. One snapshot cannot establish whether this is network-wide stalled progression or stale provider state.

## Hosted page observation

Mainnet displayed applied level 15,374,645, applied round 0, timestamp 22:54:43 local (20:54:43 UTC), and “Progressing”. It is three levels newer than the independent 20:54:25 RPC observation, consistent with elapsed time; no discrepancy established. Shadownet displayed the exact independently observed level 5,489,251, applied round 128 and timestamp 22:48:45 local; it honestly labeled “Level stalled”. Observed votes separately concerned successor level 5,489,252 round 0. No inferred current round is treated as an applied round.

Visible participation arithmetic is internally consistent: mainnet 5,381/7,000 = 76.9% and 3,710/7,000 = 53.0%, with 957 additional attestation power needed for quorum. Shadownet 6,689/7,000 = 95.6%, leaving 311 unobserved power; both exceed 4,667. Visible signer counts were 83/141 and 39/141 mainnet, 24/25 shadownet. Only shadownet applied-level committee total was independently verified; successor rights/vote contents and mainnet committee values were not independently validated. These are browser-observed partial votes, not complete network votes.

No concrete numerical discrepancy found in this bounded observation. Scheduled opportunity timers and next baker labels were not independently validated.

## Exact RPC sources and times

- mainnet chain_id: `https://mainnet.smartpy.io/chains/main/chain_id`; start `2026-10-14T20:53:59.064983+00:00`; end `not retained on error`; HTTP Error 403: Forbidden.
- mainnet head_hash: `https://mainnet.smartpy.io/chains/main/blocks/head/hash`; start `2026-10-14T20:53:59.065384+00:00`; end `not retained on error`; HTTP Error 403: Forbidden.
- mainnet head_header: `https://mainnet.smartpy.io/chains/main/blocks/head/header`; start `2026-10-14T20:53:59.065705+00:00`; end `not retained on error`; HTTP Error 403: Forbidden.
- shadownet chain_id: `https://rpc.shadownet.teztnets.com/chains/main/chain_id`; start `2026-10-14T20:53:59.066026+00:00`; end `2026-10-14T20:53:59.408063+00:00`; success.
- shadownet head_hash: `https://rpc.shadownet.teztnets.com/chains/main/blocks/head/hash`; start `2026-10-14T20:53:59.066259+00:00`; end `2026-10-14T20:53:59.740862+00:00`; success.
- shadownet head_header: `https://rpc.shadownet.teztnets.com/chains/main/blocks/head/header`; start `2026-10-14T20:53:59.066735+00:00`; end `2026-10-14T20:53:59.395290+00:00`; success.
- shadownet constants: `https://rpc.shadownet.teztnets.com/chains/main/blocks/BKzzQvg55qde8fYhmBuMnoLbpZcVur8ohAgKzWo61SqFhvWGzGy/context/constants`; start `2026-10-14T20:53:59.741223+00:00`; end `2026-10-14T20:54:00.088872+00:00`; success.
- shadownet metadata: `https://rpc.shadownet.teztnets.com/chains/main/blocks/BKzzQvg55qde8fYhmBuMnoLbpZcVur8ohAgKzWo61SqFhvWGzGy/metadata`; start `2026-10-14T20:53:59.741411+00:00`; end `2026-10-14T20:54:00.089223+00:00`; success.
- shadownet rights: `https://rpc.shadownet.teztnets.com/chains/main/blocks/BKzzQvg55qde8fYhmBuMnoLbpZcVur8ohAgKzWo61SqFhvWGzGy/helpers/attestation_rights?level=5489251`; start `2026-10-14T20:53:59.741589+00:00`; end `2026-10-14T20:54:00.088514+00:00`; success.
- mainnet_fallback chain_id: `https://tezos-mainnet.octez.io/chains/main/chain_id`; start `2026-10-14T20:54:13.876601+00:00`; end `2026-10-14T20:54:13.917780+00:00`; HTTP Error 403: Forbidden.
- mainnet_fallback head_header: `https://tezos-mainnet.octez.io/chains/main/blocks/head/header`; start `2026-10-14T20:54:13.877002+00:00`; end `2026-10-14T20:54:13.915597+00:00`; HTTP Error 403: Forbidden.
- mainnet_tzkt head_header: `https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header`; start `2026-10-14T20:54:25.789050+00:00`; end `2026-10-14T20:54:25.946236+00:00`; success.
- mainnet_tzkt constants: `https://rpc.tzkt.io/mainnet/chains/main/blocks/BLS9PTHtR8xQBAANSBVjFELycfn2AujzJ6P3iv9UfmG2uDZMZLe/context/constants`; start `2026-10-14T20:54:25.947529+00:00`; end `2026-10-14T20:54:26.302631+00:00`; HTTP Error 404: Not Found.
- mainnet_tzkt rights: `https://rpc.tzkt.io/mainnet/chains/main/blocks/BLS9PTHtR8xQBAANSBVjFELycfn2AujzJ6P3iv9UfmG2uDZMZLe/helpers/attestation_rights?level=15374642`; start `2026-10-14T20:54:25.947820+00:00`; end `2026-10-14T20:54:26.011832+00:00`; HTTP Error 403: Forbidden.

## Limits

Eight direct reads on mainnet and six on shadownet; no direct polling. Each direct HTTP read had an eight-second timeout. Mainnet SmartPy and Octez returned HTTP 403 from Python requests, whereas the hosted browser obtained live SmartPy observations; this is an access-context difference, not evidence of global provider failure. TzKT hash-pinned constants returned 404 and rights returned 403. Browser capture used installed Playwright, one page load and a four-second settling interval; no dependency install, screenshot changes, deployment, app mutations or commits. Browser streams can generate their own RPC requests during that capture.

Raw snapshot and hosted visible text were retained only under `/tmp/observatory-live-snapshot.json` and `/tmp/observatory-host-live.txt`.
