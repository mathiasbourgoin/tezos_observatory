# Bounded browser-origin RPC and numerical observation

Observed **2026-10-15 03:57:55.588–03:58:00.553 UTC**. This is a finite interoperability and arithmetic sample, not a collector, finality assertion, whole-foundation GO or validation of a newly deployed application.

Actual Playwright Chromium and Firefox navigated to `https://mathiasbourgoin.fr/tezos_consensus/`, each receiving document HTTP200 under origin `https://mathiasbourgoin.fr`. Application assets were blocked, so application streams, timers and fallback workflows did not execute. Browser `fetch`, with normal origin/CORS enforcement, directly read only allowlisted configured RPC URLs; no request interception supplied response bodies. Each browser made seven head reads and six hash-pinned helper reads: **26 RPC GETs total**, at most three concurrent, ten seconds per complete body, one MiB body cap, no retries, redirects, credentials or fallback. Both runs finished normally with13 ledger entries each.

## Observed applied heads

| Network | Configured URLs responding HTTP200 in each engine | Level / fitness round | Block timestamp UTC |
| --- | --- | --- | --- |
| Mainnet | TzKT RPC, SmartPy, Octez public, Octez archive | 15,378,860 / 0 | 03:57:52 |
| Shadownet | Teztnets, Octez public, SmartPy | 5,489,251 / 182 | 03:51:18 |

Every responding URL for a network returned the same chain/head/level/round/time tuple during this sample. URL agreement does not establish independently operated backends or network-wide consensus. The heads were:

- Mainnet chain `NetXdQprcVkpaWU`, hash `BLEqQ7RUdivdH1kT7MUzWkFvxGnudoZ8SzLUsgW76YBjxtQPgjd`.
- Shadownet chain `NetXsqzbfFenSTS`, hash `BM9tsMpCrCmMfeak29rMGVGFYYKZuAiPqbzgSpRKPs7YoQ3AVw8`.

Producing and next protocol values from each selected hash-pinned helper context both identify `PsUshuai9QapM5TGj1JpuVGkdxz5GykdnEvS6Rh8SUVrARvZLCY`. Actual production `asBlockHeader` and `proposalRound` consumers at root source revision `5fbdc09` accepted all14 sampled headers, validating fitness-level correspondence and yielding rounds0/182 rather than using an elapsed-clock estimate.

## Available numerical evidence

Each engine read protocols, constants and next-level attestation rights under the selected actual hash, choosing the first configured responding source once per network. TzKT Mainnet protocols/constants returned200; its requested level15,378,861 rights returned **403** in both engines. No retry or helper fallback occurred: Mainnet committee membership, totals reconstructed from rights and votes remain unverified by this sample. Constants alone do not establish a complete committee.

Teztnets Shadownet protocols/constants and level5,489,252 rights returned200. Independent `BigInt` summation and the existing production `committeeAuthority`/`signerPower` consumers agree on:

| Fact | Both-engine result |
| --- | --- |
| Unique delegate addresses / first slots |25 /25 |
| Sum of attesting powers |7,000 |
| RPC committee-size constant |7,000 |
| RPC quorum threshold |4,667 |
| Threshold as committee share |66.6714285714% |
| Delegates with zero power |1; retained as valid committee membership |

The authority boundary accepts zero individual power while requiring a positive safe cumulative total. This sample contains no pending-operation or vote stream reads: it proves no current phase participation, missing-delegate list, measured zero, actual quorum crossing or maximum. The25 delegates are rights membership, not observed signers. The default full-committee `signerPower` calculation is an arithmetic cross-check, not an assertion that all delegates voted.

Both networks' captured constants give minimum delay6 seconds and increment3 seconds. For the supported Shadownet predecessor round182, the conditional earliest following-level round-zero boundary is `03:51:18 + (6 + 182×3)s = 04:00:30 UTC`, exactly matching the captured attestation-rights helper `estimated_time`. This corroborates the conditional reference arithmetic only. It does not establish a selected future proposer, an arriving block, or a live timer rendered by S9; no baking-rights endpoint was read.

## Evidence and limits

Public RPC responses, receipts and the actual request ledger are preserved in [responses.json](../roster/observatory-foundations/live-origin-2026-10-15/responses.json); domain-consumer and arithmetic results are in [adjudication.json](../roster/observatory-foundations/live-origin-2026-10-15/adjudication.json). SHA256 respectively: `17e4be3502f7ba75ad21c5651136801f2ea4db2141d6dbfac58fc692d762c731` and `c6090252b1ef407080d059d9762cb9774a3491679716f389cb341560c5808c41`.

Actual Node22 audit scripts were `/tmp/observatory-origin-audit-20261015.mjs` and `/tmp/observatory-origin-adjudicate-20261015.mjs`, SHA256 `6b625278d0d275a0bc38a38acbda570d01b1051a5f4f1f158fbe095dd0fe6089` and `6500389e248aca1bdcfa00bce774898517b13a1f2176b11874a964c8a055448d`. Both exited0. They use existing Playwright/Vite and actual production domain modules; no dependency or repository test framework was added.

The earlier bounded head snapshot had Mainnet auxiliary503 responses; this later actual-origin sample succeeded. Neither proves ongoing availability. No signing, provider mutation, wallet interaction, deployment, production-asset change or background polling occurred. Fresh whole-foundation review/QA and subsequent Astra/deployment evidence remain separate requirements.
