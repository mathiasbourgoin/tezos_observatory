---
status: live-doctrine
schema-version: 2
last-updated: 2026-10-15
superseded-by: null
---

# Observation vocabulary

- Applied head: the head a selected source reports as applied; not independent network-wide agreement.
- Validated proposal: a candidate validated by a source; not automatically canonical or final.
- Consensus instance: network, level, round and payload, with phase-specific votes and source/context attribution.
- Candidate: an observed proposal identified by block hash and matching context; candidates can share a payload.
- Voting power: committee power attached to observed distinct delegates, not token balance or operation count.
- Coverage: stated usable evidence scope for the selected source and instance; connectivity alone is insufficient.
- Missing/unobserved delegate: an expected participant whose relevant vote this source has not observed under stated coverage.
- Scheduled opportunity: protocol/clock-derived possible proposal time; not evidence a proposal arrived.
- Pin inspection: keep the selected historical instance while collection continues.
- Follow live: select the current supported live instance as observations arrive.
- Pause collection: stop external observation work; distinct from pinning.
- Session history: bounded observations retained in this browser session, not a chain archive.

## Source evidence and phase events

- Phase: preattestations or attestations, accounted separately for the selected consensus instance. A signer observed in one phase is not automatically observed in the other.
- Quorum threshold: the protocol-context power requirement against which the selected phase is checked; delegate count is a separate quantity.
- Observer context: the attributed RPC source and proven chain, head, predecessor, producing/executing protocol and target level used to admit evidence. Matching coordinates alone do not establish the same context.
- Receipt: immutable source attribution and local wall-clock/monotonic arrival times. A requested head and an observed head are separate facts; an unpinned pending read does not acquire a requested head retroactively. Monotonic time measures elapsed age and retention order; wall time is the displayed receipt date.
- Usable validated snapshot: a complete, usable validated-category response received after the selected identity was established, with unchanged same-observer context across the body. A request can start earlier; its completed body must follow both request start and identity establishment. Omitted, malformed, truncated or locally lost relevant evidence cannot establish completeness.
- Measured zero: zero observed power for a specified phase in a usable validated snapshot of the named source and instance. It does not establish network-wide absence. Missing opposite-phase observations alone are unknown, rather than zero. See Coverage above.
- Partial positive observation: observed valid signer power with incomplete evidence scope. It supports its attributed positive value without proving a complete missing-delegate set or zero in another phase.
- Numerical basis: the committee total, threshold and delegate/slot/power mapping used for an accepted phase value. A captured maximum retains its own basis and receipt when later rights differ.
- Observed quorum: accepted phase power at or above its justified threshold. If the first accepted evidence is already at quorum, this does not prove a transition from below threshold.
- Quorum crossing: new compatible vote evidence takes an identical attributed phase instance from a retained below-threshold state to quorum under an unchanged numerical basis. Replay, rendering, selection or rights correction cannot create that transition.
- Crossing-history uncertainty: loss of admitted consensus, phase or accepted-product history prevents proving whether a reconstructed identity crossed earlier. The reader qualifies that limitation; observed quorum can remain visible without an invented crossing. Evicting unrelated raw operations alone does not establish this uncertainty.

These definitions describe the integrated S1–S5 consumers in [the observation store](../src/monitor/observationStore.ts), [RPC context/snapshot collection](../src/rpc/networkData.ts) and [phase accounting](../src/consensus/phaseEvidence.ts). The [independent S5 review](../briefs/observatory-foundations-slice-5-complete-review.md) records verification within that slice; the later history verification is recorded separately below. Comparison and prediction remain unfinished.

## Retained inspection

- Session snapshot: immutable accepted facts for an attributed consensus instance, including candidate identities, phase signers, current and maximum committees, numerical bases, coverage and original receipts. The history holds at most 150 instances per network; its lifetime is separate from the 100 active accepted candidates and 100 unresolved identities.
- Retained pin: a selected historical identity with stable reader controls. Accepted facts for the same retained instance can enrich the view. Eviction from the active candidate index alone does not freeze this pin.
- Frozen pin: the single immutable inspection copy held outside a network's retained history after its selected instance is evicted. Later observations cannot enrich it. Local reselection and visible sibling inspection use its captured facts; a new retained pin replaces it, and explicit Latest or Follow can leave it.
- Candidate-fact retention: at most 100 candidate facts inside each session snapshot, protecting the pinned selection. Truncation is explicitly partial and cannot establish complete coverage or measured zero. Each retained historical phase-signer, unknown-slot or conflict set holds at most 10,000 unique facts.
- LIVE-eligible observation: an accepted record whose proven context remains authorized for the current observer. A retained historical candidate is not automatically eligible for direct following merely because it shares an instance with an eligible record.
- Latest observed: a one-time selection and pin of the newest coherent LIVE-eligible observation by original receipt. It does not start ongoing follow or resume collection. If no eligible observation exists, the reader explicitly reports live unavailable.
- Follow live: continuing selection of coherent LIVE-eligible observations by original receipt, independently of whether collection is paused. It never substitutes a stale historical item for unavailable live evidence. See the existing Follow live entry above.
- Newer items: first accepted distinct selectable units after a pin baseline. A candidate-free instance and its first candidate represent one unit; further distinct candidate hashes are separate units. Replay and same-identity enrichment do not increment the count. After all bounded identity owners are lost, the displayed count is qualified as a lower bound rather than asserting unprovable first-ever arrivals.
- Captured maximum committee: the immutable delegate/power mapping belonging to a phase's recorded maximum. It remains distinct from that phase's current committee after rights corrections. See Numerical basis above.

These S6 definitions are grounded in `SessionSnapshot`, `SessionInspection`, `pin()`, `latest()` and `captureHistory()` in [the observation store](../src/monitor/observationStore.ts). The [independent S6 review](../briefs/observatory-foundations-slice-6-complete-review.md) records the integrated history verification. Later committee verification is recorded below; comparison, prediction and whole-programme acceptance remain unfinished.

## Committee inspection

- Validated-rights committee: delegates and exact powers established by the selected context's validated rights. Membership and committee share do not require receiving a vote. A known captured 3/5 share remains 60% when both phase observations are unavailable.
- Phase receipt state: received evidence, absence in a usable selected-source snapshot, or partial/unavailable evidence, reported independently for preattestations and attestations. Snapshot absence never asserts network-wide inactivity. See Measured zero and Coverage above.
- Raw alias: the alias value used for search and sorting before the display adds source attribution or a pending notice. A trimmed case-insensitive query matches this alias OR the address separately; a substring spanning the displayed fields does not match.
- Explicit committee order: the reader's address, alias or power ordering with address ties. Arrivals update existing rows without resorting them; newly matching rows append until the reader explicitly changes the query/order or resorts.
- Pending exclusion: a focused row that no longer matches stays in place with a visible notice until focus leaves. Its alias and accessible copy label update on the same node; leaving the row removes the nonmatch without an automatic resort.
- Unknown-rights signer: an attributed raw signer observation whose validated committee membership or power is unproven. It remains separately inspectable and cannot supply an invented committee row, power or complete missing-delegate list.

These definitions follow the integrated committee reader in [main](../src/main.ts) and [the dashboard view](../src/dashboardView.ts). The [independent S7 review](../briefs/observatory-foundations-slice-7-complete-review.md) records current and historical committee, local paused controls and corrected-alias verification; it does not certify comparison or prediction.
