_Generated: 2026-10-15T06:02:45.531516+00:00_
_DO NOT include the task description in this file or share it with the researcher._

1. Which network data sources, TzKT integrations and transport interfaces currently expose applied block headers, predecessor hashes, levels, timestamps and protocol identity, and what history, pagination, browser CORS and failure constraints are documented or enforced for each?

2. How does the application distinguish applied chain heads, predecessor chains, competing proposals, rounds and reorganizations, and which existing data structures retain or discard these observations?

3. What historical block or consensus observations are retained in memory or storage, for how long and with what bounds, and how are coverage, gaps, duplicate observations and timestamp validity represented?

4. Where are request concurrency, pagination, caching, retry, timeouts and total acquisition limits defined, and how do network switching, visibility, pause/resume and stale asynchronous work affect their lifecycle?

5. Which existing calculations and tests derive durations, elapsed time, rates, averages or network health from block data, and what timestamp ordering, weighting, sample counts and observation boundaries do they use?

6. How do existing UI components and tests present network metrics, source attribution, freshness, observation ranges, partial coverage, unavailable values and failures across desktop and mobile layouts?

7. Which existing fixtures, deterministic tests and documented provider checks cover long historical ranges, changing protocol timing, missing predecessors, reorganizations, malformed timestamps and interrupted browser requests?

8. [ecosystem] What historical block lookup, timestamp filtering, ordering, pagination, historical retention and browser-access capabilities do current official TzKT and Tezos node interfaces document for Mainnet and Shadownet?

9. [ecosystem] How do documented Tezos explorers or monitoring tools define and calculate average block time and fixed-time observation windows, including boundary intervals, arithmetic denominators, partial history and the distinction between chain health and data-source availability?
