# Block intervals — story draft for independent voices

**Status: WORKING DRAFT — not a spec, no gate claimed.**
Source: complete VALIDATED intake and immutable V3 WIP a97efb3; additive only. Root coordinator owns intermediate validation; final publication remains maintainer-owned. No application/test implementation, dependency or generated projection edits in this phase.

## US-1: Compare completed-block intervals (P0)
As a Mainnet or Shadownet observer, I want three timestamp-derived means with actual coverage so that I can compare 1 week, 24 hours and 1 hour without mistaking sampled history for a complete live observation.
**Why this priority:** This is the requested feature.
**Scope:** No protocol estimate, ongoing unfinished interval, full-history download, independent ancestry proof or health score.
**Independent Test:** Feed bounded endpoint facts into the real calculation consumer and inspect the production three-window output without requiring refresh/error stories.
**Acceptance Scenarios:**
1. **Given** T=2026-10-15T12:00:30Z and the 1h cutoff 11:00:30Z, floor S level100 at11:00:04Z and E level104 at12:00:28Z, **when** the valid batch commits, **then** the mean is906.00s (3624/4), coverage is3624s over4 intervals and actual endpoints/as-of T are attributable; the nominal hour is not substituted as numerator.
2. **Given** the hour cutoff11:00:30Z, S level100 at10:00:00Z and the first later interval ends at11:59:00Z, E level102 at12:00:00Z, **when** the batch commits, **then** the complete long crossing interval is included (7200/2=3600.00s), with120min actual coverage shown.
3. **Given** a floor row exactly at cutoff11:00:30Z, **when** selecting S, **then** that exact boundary row is selected; a row newer than cutoff is not a floor.
4. **Given** the week and24h floor arrays are empty and the shared earliest available S is level0 at2026-10-15T10:00:00Z, E level1 at12:00:00Z, **when** the batch commits, **then** both affected windows show7200.00s over one interval with partial available history and actual span; neither claims a full week/day or genesis proof.
5. **Given** E is at/before a cutoff or no distinct positive ordered endpoint pair exists, **when** rendering, **then** the affected window says insufficient data/unavailable with its specific reason and never displays zero, Infinity or a guessed mean; malformed nonempty floor rows do not enable earliest fallback.
6. **Given** two valid distinct endpoints0.004s apart one level apart, **when** rendering, **then** the positive raw mean remains unrounded and displays<0.01s; ordinary positive means use two decimals.

## US-2: Trust bounded source acquisition (P0)
As an observer fetching the means, I want bounded source-qualified reads and race rejection so that an old or inconsistent indexer response cannot masquerade as a valid fresh result.
**Why this priority:** Untrusted indexer data crosses into numerical output.
**Scope:** No provider cascade, pagination, retry loop, network mutation or malicious-provider proof.
**Independent Test:** Drive real acquisition with deterministic bounded fetch/body fixtures and inspect committed evidence; no production clock estimates are needed.
**Acceptance Scenarios:**
1. **Given** Mainnet/shadownet each have valid E/floor facts, **when** acquiring, **then** each network uses its own documented TzKT base and anonymous no-store redirect-error GET, at most6 reads and2 concurrent, with one optional shared earliest fallback and a final fixed-level E recheck; no fallback means at most5 reads.
2. **Given** E level200/hashA/time11:59 and the indexer advances to201 while reads run, **when** the fixed-level200 recheck still equals E, **then** the as-of E batch may commit; a later mutable global head need not equal200.
3. **Given** a fixed-level E recheck returns changed hash/time/level or empty after rollback, **when** completing, **then** no new batch commits; the previous committed batch retains original facts and becomes stale/historical.
4. **Given** a streaming body exceeds16384bytes, or fetch/body ignores abort beyond8s/read or24s/batch, **when** the deadline/cap occurs, **then** acquisition settles as failure, starts no retry, cleans timers/listeners and never commits its late result.
5. **Given** one floor is malformed and another valid, or one network fails, **when** committing supported results, **then** only the affected window/network is unavailable unless shared-head/identity/consistency invalidation invalidates its whole network batch.
6. **Given** metadata indexedLevel250/knownLevel255 on the same response and timestamp-filtered E.level200, **when** presenting lag, **then** lag is5 with its own receipt; missing/unsafe/contradictory metadata shows unknown, never55 or fabricated0.

## US-3: Read retained results safely (P1)
As a keyboard, touch or assistive-technology observer, I want readable source/freshness and a bounded refresh action so that I can keep inspecting the dashboard through quiet periods and collection interruptions.
**Why this priority:** Values need honest interpretation and accessible integration.
**Scope:** No new consensus health authority, navigator motion, numeric live-announcement loop or persistent history.
**Independent Test:** Commit a fixture batch, then drive lifecycle/reader actions at the actual production page in Chromium and Firefox independently of live provider availability.
**Acceptance Scenarios:**
1. **Given** initial collection is visible/enabled, **when** a batch commits, **then** the network workspace shows three named means, actual coverage and linked TzKT attribution without opening specialist details, with full UTC endpoints/formula/receipts/reasons available in native details.
2. **Given** last batch start monotonic0, **when** applied-head changes or Refresh block intervals actions occur at59s and60s, **then** no start precedes60s; overlapping eligible triggers coalesce to at most one newest queued trigger, and cooldown has visible disabled feedback without a timer starting acquisition.
3. **Given** a committed result at age119.999s, **when** monotonic age reaches120s or collection is interrupted, **then** it is stale; jumping wall time does not change monotonic age, original T or mean, and an old block freshly fetched has independently labelled block age.
4. **Given** paused/hidden/pagehide/stop interrupts a running batch, **when** ignored-abort responses arrive after resume, **then** they cannot commit; queue is cleared, manual pause survives BFCache/pageshow and allowed visible resume respects cooldown.
5. **Given** a selected pin/disclosure/search/focus/scroll position, **when** theme/tab/navigation/tick/vote/round/visual updates occur, **then** they start no interval reads, preserve reader state, do not clear sticky stale invalidation and do not animate navigator motion or announce every number.
6. **Given** normal/dense/long/unavailable states at accepted phone/tablet/desktop/wide and zoom sizes in both engines and themes, **when** reading/interacting, **then** no horizontal document scrolling/overlap occurs, current/two-future overview remains usable, critical text>=14px and metadata>=12px, with composed-surface contrast and non-color/native keyboard/touch cues.

## Pending process
Fresh researcher, clarification elicitor, adversarial challenge and requirements formalizer evidence must run before final spec publication. Questions go to root. No unresolved challenge is silently filled. Intended bounded scale: three stories, approximately24–32 FR and12–18 AC/check interfaces, preserving all prior323 mandatory claims and foundation/V3 interfaces. Exact counts follow formalizer evidence.
