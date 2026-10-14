# Tezos Observatory

Monitor Tezos consensus from a browser: Mainnet and Shadownet heads, observed
preattestations and attestations, voting power, proposal opportunities, and
delegates not observed by the selected RPC source.

This is a static TypeScript application. RPC connections run only while a viewer
has the page visible. It needs no background collector or systemd service.

## Develop and verify

Use Node.js 22 or newer, then:

```sh
npm ci
npm run dev
```

Open the printed Vite URL. The production entrypoint is `src/main.ts`, loaded by
`src/index.html`; fixtures are not the production dashboard.

```sh
npm run check
npm test
npm run test:e2e
npm run build
```

Playwright requires installed Chromium and Firefox browsers. The end-to-end suite
tests both components and the real `/` page with deterministic browser RPC
streams. It covers streamed vote updates, duplicate votes, obsolete head data,
unknown observations, independent network failure, layout at desktop/mobile
widths, pause/resume, persistent disclosures and stable list scroll/focus.

## Interpret the display

The applied head level and round describe the last head reported by the node.
Observed consensus and scheduled opportunities are separate. The selected level,
round and payload identify received proposal or validated-mempool evidence;
votes can already concern the next level. A clock-derived opportunity alone
does not establish a proposal or justify a zero-participation gauge. Missing
usable observations are shown as unavailable. Competing payloads remain separate;
the display selects the strongest by combined voting power and reports alternatives.
Recent consensus rows retain peak power observed during this browser session:
they are historical observations, not current-round participation or a chain archive.

Each gauge sums committee voting power once per delegate, using attestation
rights pinned to the observed head hash. A signer count is not an operation count
or a token balance. The quorum marker comes from the protocol constants.

Calculated rounds and countdowns are scheduled opportunities, not promises that a
block will be produced. Round zero starts one predecessor-round duration after
the predecessor timestamp; later boundaries add the successive round durations.
`roundSchedule.test.ts` checks cumulative timing and exact boundaries.

Missing delegates means expected rights minus signers observed by this source.
It does not establish inactivity across the network. Unknown rights, unavailable
mempool data, and an observed zero are distinct states. Aliases come from TzKT;
their absence does not change consensus health. Shadownet eligibility is checked
with bounded concurrency and cached for a minute. Mainnet eligibility is shown
as unknown rather than querying hundreds of delegates every block.

## Transport and failures

Mainnet vote streams use the public TzKT RPC, which allows browser CORS for monitors;
head streams use the other public providers because TzKT head delivery can lag
its mempool by multiple blocks. The
protocol helper lookups use separate RPC providers because TzKT restricts those
routes. `NetworkMonitor` opens `/monitor/heads/main`,
`/chains/main/mempool/monitor_operations`, and an optional
`/monitor/validated_blocks?chain=main` proposal monitor as streamed JSON. It deduplicates votes,
rejects obsolete asynchronous responses, and retains only current/next-level
operations, bounded to 10,000 entries. A normal mempool stream ending at a head
flush reconnects to the same source without activating error fallback. Aggregate
consensus operations expand into signer slots before power is counted.
Long rounds do not expire valid votes
merely because two minutes have passed.

On cold startup, one head RPC bootstraps the view alongside the streams so a
quiet stream cannot leave the page empty. If public RPCs reject or fail their streams, a watchdog enables bounded fallback
reads: heads every 15 seconds and the mempool every 30 seconds. Successful streams
stop their corresponding polling. Committee rights are cached by protocol and
level, successor committees are prefetched, and protocol constants are reused
across head changes. Missing auxiliary data is retried with bounded delays. The page
retains coherent values during reconnects, labels their age and source errors,
and cancels work when paused or hidden. Public RPC CORS policies and availability
can still prevent observations; a successful UI build cannot guarantee access.

Network health and RPC coverage are separate observations. The delayed-level
heuristic flags proposal rounds of 3 or more, or a block older than the larger
of 30 seconds and five minimum block delays. It is an operational indicator,
not an independent verification of consensus or finality.

## Publish

`npm run build` emits the static site in `dist/`, with relative asset URLs for
deployment below a path such as `/observatory/`. Publish the entire directory,
including `assets/` and `favicon.svg`, with `index.html` as the directory index.
Keep prior hashed assets during rollout so already-open pages can finish loading.

The [comparative product review](docs/reviews/2026-10-14-explorus-teztale.md)
records interface principles and proposed improvements inspired by Explorus and
Teztale. Recommendations are not a promise that every feature is implemented.
No server-side polling is introduced by this deployment.
