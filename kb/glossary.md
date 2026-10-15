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

These definitions describe the integrated S1–S5 consumers in [the observation store](../src/monitor/observationStore.ts), [RPC context/snapshot collection](../src/rpc/networkData.ts) and [phase accounting](../src/consensus/phaseEvidence.ts). The [independent S5 review](../briefs/observatory-foundations-slice-5-complete-review.md) records verification and the remaining programme limits. They do not claim that the later full-history, comparison or prediction work is complete.
