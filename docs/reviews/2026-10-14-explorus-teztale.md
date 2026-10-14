# Consensus observation: comparative product review

Tezos Observatory should let readers identify an observed consensus instance,
inspect participation evidence and understand scheduled opportunities without
confusing a clock estimate with a received proposal. This contributor review is
dated 14 October 2026. Recommendations are product direction, not a certification
that every feature is implemented.

## Lessons from Explorus and Teztale

Explorus demonstrates a direct-node exploration model with level/round history,
consensus operations and baking rights. Its historical consensus table and rights
matrix suggest a progression from transient gauges to a selectable inspector.
See the [official introduction](https://www.functori.com/blog/blog-getting-started-with-explorus.html),
[consensus state](https://gitlab.com/functori/dev/explorus/-/blob/e9ee577fa92e082e5ad071cb87b6e3ea3bf53de6/src/common/tezos_process.ml),
[historical votes](https://gitlab.com/functori/dev/explorus/-/blob/e9ee577fa92e082e5ad071cb87b6e3ea3bf53de6/react-front/src/components/explorus/OldBlocksConsensusOpsTable.tsx)
and [rights matrix](https://gitlab.com/functori/dev/explorus/-/blob/e9ee577fa92e082e5ad071cb87b6e3ea3bf53de6/react-front/src/components/explorus/BakingRightsTable.tsx).

Teztale's useful contribution is observation provenance: block validation,
application, operation reception and inclusion answer different questions.
Weighted timelines and observer comparison can expose those differences.
See the [archiver/schema](https://gitlab.com/tezos/tezos/-/tree/1727d7e192f2374edda7ad7adceef6f4ec51f71a/teztale),
[level inspector](https://gitlab.com/nomadic-labs/teztale-dataviz/-/blob/d9c1eb82f6672e2c9f34ebb7da87b59261609e62/src/views/Level.tsx),
[observer comparison](https://gitlab.com/nomadic-labs/teztale-dataviz/-/blob/d9c1eb82f6672e2c9f34ebb7da87b59261609e62/src/views/LevelDiff.tsx)
and [threshold history](https://gitlab.com/nomadic-labs/teztale-dataviz/-/blob/d9c1eb82f6672e2c9f34ebb7da87b59261609e62/src/views/DelayToConsensus.tsx).
These are source-based comparisons, not availability or performance claims about
their public deployments.

## Separate evidence from estimates

| Evidence | Establishes | Does not establish |
| --- | --- | --- |
| Applied head message | The source reports that head | Global agreement about every candidate |
| Validated proposal message | The source validated that proposal | Canonicality or finality |
| Accepted consensus operation | A vote for a precise level/round/payload/phase | Another payload's quorum |
| Protocol timing calculation | A scheduled opportunity | Receipt of a proposal |
| Open stream | A connected transport | Complete round coverage or chain progress |

Count power once per delegate, phase and instance, including replay and aggregate
operations. Never combine competing payloads. Use the active protocol's exact
integer quorum, not a rounded percentage threshold. Unknown rights or missing
identity must not become apparent measured zeros. Missing means not observed by
the selected source under stated coverage, not proof a delegate is offline.
Committee power is not token balance; eligibility needs a context and age.

## Prioritized product direction

First attach every gauge, delegate list and opportunity to an explicit identity,
and reject obsolete asynchronous results. Show observed proposal, observed votes,
applied head and scheduled opportunity separately. Observation coverage and
chain-progress status are independent: a source can reconnect while the chain
advances or remain connected without observing advancement.

Next provide compact network summaries above a full-width selected-instance
inspector. Follow-live and pinned inspection are different from pausing collection.
New observations should accumulate behind a newer-items control without moving
the selection, disclosures, focus or scroll positions.

Retain a bounded history with level, round, payload, peak observed power in each
phase and coverage. Completed observations must remain readable after the next
fast block. Session history is not a complete historical reliability record.

Add cumulative power timelines only with honest timestamp provenance. Browser
receipt includes RPC buffering and network/scheduling delay; it is not network-wide
propagation latency. Snapshot/replay data must not invent original arrival times.
External composite observations must identify sources and aggregation rules.

Use one searchable committee table with phase-specific receipt states, power,
share, eligibility and context. Filter missing votes or watched delegates without
changing sorting underneath the reader. Show exact quorum deficit without implying
that a particular missing group is jointly necessary.

Give the selected proposal producer, next same-level round and conditional next-level
round-zero right separate identities and timing assumptions. A future-level
countdown stays conditional until its predecessor is known.

## Release acceptance

Test synthetic delayed heads, timely votes, long rounds, competing payloads,
aggregate replay, reconnects, missing rights and same-height reorganizations.
Older quorums must never appear as current participation, and a schedule alone
must never manufacture observed votes. Finality claims require verified ancestry.

Exercise desktop and mobile layouts with long aliases and expanded lists, keyboard
navigation and reduced motion. Updates must not clip text or move the inspection
target. Hiding or pausing the page must stop external work.

Record the deployed revision for live checks, observe several complete transitions
and measure browser receipt-to-render delay separately from RPC arrival delay.
Build success and synthetic tests do not establish live provider coverage. Optional
external history and richer graphs should follow these identity, accessibility
and coverage guarantees rather than replace them.
