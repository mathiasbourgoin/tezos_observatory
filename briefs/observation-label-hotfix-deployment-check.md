# Deployment check — observation-label-hotfix

**Date:** 2026-10-14T19:16:51.864387+00:00
**Status:** verified served hotfix, provider limitations remain

Actual public origin https://mathiasbourgoin.fr/tezos_consensus/ observed in Chromium45s and Firefox30s with real RPC requests, no mocks. Both browsers visibly report revision6c2d7fd. HTML, JS index-BA9DhCGu.js, CSS index-oH-CZvYi.css and favicon return200; byte SHA256 matches every entry of /tmp/tezos-observatory-release-6c2d7fd/manifest.json in both browsers. No application-asset404 and no uncaught page exceptions.

Mainnet real applied chain headlines progress15373657→15373659 Chromium and15373663→15373667 Firefox, round0. Selected vote level can move ahead of applied head and is labeled separately. Examples: pre6996/7000, att6977/7000, quorum4667; later7000/7000; Firefox partial current-level counts285/7000 and1238/7000 after transition. All sampled values remain bounded by committee power;100.0% for6998 is one-decimal rounding rather than exact full participation.

Shadownet primary applied headline5489251/round112, block timestamp21:11:33Paris. Independent source read at2026-10-14T19:15:13.631867+00:00 confirms hashBLVo7TASXVxv5MEbWCHWcVHy5iJzB1x1r3zJHW2kNq1qbgNocG8, raw fitness00000070 =112, payload_round112. This is a changed same-level head from earlier audited round101, accurately reflected. Secondary selected votes5489252/round0 have known payloadvh2nhHPMXR…SvgTPfw and measured6689/7000 power,24/25 signers,95.6% in both phases. The new hotfix does not replace genuine payload-bound measurements with unavailable. Initial connecting states show unavailable, not fabricated zero. No live missing-current-group situation beyond initial connection occurred during this bounded window; deterministic QA covers that regression.

Schedule remains secondary: successor round-zero anchor19:11:33UTC+(6+112*3)s=19:17:15UTC, round0 end19:17:21UTC (=21:17:21Paris), matching screen. Observed successor votes and calculated schedule are separate evidence; calculated boundary is not proof of proposal progression. Block age220–280s while RPC message age14–44s demonstrates freshness distinction remains visible.

Provider limitations: Chromium observed73 HTTP200 responses plus CORS failures for some Mainnet baking-rights requests; Firefox60 HTTP200 and26 HTTP503 responses, including CORS-blocked auxiliary reads across providers. Some requestfailed records are intentional aborts during changing requests/page closure. Direct independent Shadownet Octez/SmartPy headers returned403, while Teztnets returned200/CORS*. Thus this is proof of deployed files/runtime and selected actual observations, not uniform provider health or cross-provider agreement. Shadownet applied level did not advance during check.

Screenshots, full snapshots every15s, response hashes, console/errors and source header JSON: /tmp/observatory-deployed-6c2d7fd. Chromium Shadownet screenshot visually inspected. Both browsers closed after observations. No code writes, remote mutation or further deployment by QA.
