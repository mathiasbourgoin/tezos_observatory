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
- Observation source: the configured endpoint that actually supplied a fact, identified by its original Receipt. A provider name or URL alone does not prove the chain identity. Another primary endpoint being unavailable does not invalidate proof obtained from this source.
- Helper responder: the endpoint that returned rights, constants or eligibility evidence. Its original Receipt remains distinct from the selected instance's observer. A different configured helper requires proven compatible chain, head, parent, protocol and target context; its response is never relabelled as the observer's. See Observer context above and Comparison numerical authority below.
- Producing protocol: the full protocol hash justified for a verified block context. Target execution protocol: the full protocol hash justified for a target level from its proven anchor's next-protocol metadata and observer/parent relationship. These are distinct from the header's numeric protocol-level counter (`proto`), which cannot identify a protocol hash. Missing or contradictory protocol evidence remains unknown. See Observer context above.
- Operation branch: the operation's original RPC branch hash. It is a raw anchor fact, not automatically the immediate proposal parent. Inequality with the current head alone cannot establish vote invalidity.
- Contextual admission: a later proof sidecar binding retained observations to their own configured observer, chain, head, parent, target, execution context, rights and lifecycle generation. It can establish Numerical basis without rewriting raw receipts or refreshing first arrival. Context invalidation withdraws LIVE authority while the original historical facts remain inspectable.
- Source-local rendering without a primary snapshot: independently admitted observer B evidence and retained inspection remain readable when observer A has no applied snapshot. B keeps its original head, context and numerical attribution. No A snapshot or receipt is synthesized; unproven primary applied values and its independent clock remain unavailable.
- Usable validated snapshot: a complete, usable validated-category response received after the selected identity was established, with unchanged same-observer context across the body. A request can start earlier; its completed body must follow both request start and identity establishment. Omitted, malformed, truncated or locally lost relevant evidence cannot establish completeness.
- Measured zero: zero observed power for a specified phase in a usable validated snapshot of the named source and instance. It does not establish network-wide absence. Missing opposite-phase observations alone are unknown, rather than zero. See Coverage above.
- Partial positive observation: observed valid signer power with incomplete evidence scope. It supports its attributed positive value without proving a complete missing-delegate set or zero in another phase.
- Numerical basis: the committee total, threshold and delegate/slot/power mapping used for an accepted phase value. A captured maximum retains its own basis and receipt when later rights differ.
- Observed quorum: accepted phase power at or above its justified threshold. If the first accepted evidence is already at quorum, this does not prove a transition from below threshold.
- Quorum crossing: new compatible vote evidence takes an identical attributed phase instance from a retained below-threshold state to quorum under an unchanged numerical basis. Replay, rendering, selection or rights correction cannot create that transition.
- Crossing-history uncertainty: loss of admitted consensus, phase or accepted-product history prevents proving whether a reconstructed identity crossed earlier. The reader qualifies that limitation; observed quorum can remain visible without an invented crossing. Evicting unrelated raw operations alone does not establish this uncertainty. Reconstructed positive power and its actual as-of receipt do not prove a first-ever observed-quorum event: that event is also withheld when prior bounded phase history is uncertain. Retained sibling events remain unchanged.

These definitions describe the integrated S1–S5 consumers in [the observation store](../src/monitor/observationStore.ts), [RPC context/snapshot collection](../src/rpc/networkData.ts) and [phase accounting](../src/consensus/phaseEvidence.ts). The [independent S5 review](../briefs/observatory-foundations-slice-5-complete-review.md) records verification within that slice; later history and comparison verification are recorded separately below. The integrated S9 prediction vocabulary and its separate verification boundary are recorded below.

Source and contextual-admission definitions also follow the integrated [source-local reconciliation](../src/monitor/observerReconciliation.ts) and its [independent S4 review](../briefs/observatory-foundations-slice-4-complete-review.md). S9 opportunity capture and its independent verification are recorded below.

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

These S6 definitions are grounded in `SessionSnapshot`, `SessionInspection`, `pin()`, `latest()` and `captureHistory()` in [the observation store](../src/monitor/observationStore.ts). The [independent S6 review](../briefs/observatory-foundations-slice-6-complete-review.md) records the integrated history verification. Later committee and comparison verification are recorded below; S9 prediction verification is recorded below; whole-programme acceptance remains open.

## Committee inspection

- Validated-rights committee: delegates and exact powers established by the selected context's validated rights. Membership and committee share do not require receiving a vote. A known captured 3/5 share remains 60% when both phase observations are unavailable.
- Phase receipt state: received evidence, absence in a usable selected-source snapshot, or partial/unavailable evidence, reported independently for preattestations and attestations. Snapshot absence never asserts network-wide inactivity. See Measured zero and Coverage above.
- Raw alias: the alias value used for search and sorting before the display adds source attribution or a pending notice. A trimmed case-insensitive query matches this alias OR the address separately; a substring spanning the displayed fields does not match.
- Explicit committee order: the reader's address, alias or power ordering with address ties. Arrivals update existing rows without resorting them; newly matching rows append until the reader explicitly changes the query/order or resorts.
- Pending exclusion: a focused row that no longer matches stays in place with a visible notice until focus leaves. Its alias and accessible copy label update on the same node; leaving the row removes the nonmatch without an automatic resort.
- Unknown-rights signer: an attributed raw signer observation whose validated committee membership or power is unproven. It remains separately inspectable and cannot supply an invented committee row, power or complete missing-delegate list.

These definitions follow the integrated committee reader in [main](../src/main.ts) and [the dashboard view](../src/dashboardView.ts). The [independent S7 review](../briefs/observatory-foundations-slice-7-complete-review.md) records current and historical committee, local paused controls and corrected-alias verification; it does not certify comparison or prediction.

## Explicit source comparison

- Comparison selection: the selected source, identity and available observer context, rights, constants and receipts captured before an explicit comparison starts. Nested values are immutable for that request; later caller changes cannot reprice its result. See Observer context, Receipt and Numerical basis above.
- Explicit comparison: a reader-requested observation from a different configured source for the same network. One workflow runs at a time, with at most three endpoint reads, eight seconds per complete read and twenty-four seconds total. Selection changes cancel obsolete work synchronously; selection alone starts no comparison. Comparison evidence never enters LIVE accounting, history, reconciliation or quorum events.
- Head agreement: explicit agreement of proven chain identity and selected versus fetched head hash, level, decoded round and timestamp. It does not establish vote agreement or finality. The label remains independent of an optional pending-read failure, which leaves the overall result partial. A current fetched head and a selected historical head remain separately attributed.
- Comparison numerical authority: permission to attach power using compatible cached rights and constants for the exact selected target level and proven source, chain, head, predecessor and producing/executing protocol context. Original helper attribution remains intact. Missing or incompatible proof leaves raw observations without justified power; comparison-specific authority cannot relax LIVE admission.
- Stale comparison: a retained result at least sixty seconds old by monotonic receipt age, or invalidated by selection/context change or collection interruption. Returning to the earlier context does not make it fresh. A prior completed result can remain attributed and stale; a newly completed cancelled request cannot become an accepted result. See Receipt above.
- Shared raw retention: LIVE and comparison raw operations together occupy at most 10,000 entries per network. Comparison capacity is the remaining allowance and shrinks after LIVE growth. Captured positive values retain their original basis and receipt after raw truncation, with explicit partial/as-of qualification; zero remaining capacity cannot establish measured zero or complete coverage. See Measured zero and Numerical basis above.

These definitions follow the integrated [comparison service](../src/rpc/sourceComparison.ts), [comparison authority](../src/consensus/phaseEvidence.ts), [main lifecycle wiring](../src/main.ts) and [reader](../src/dashboardView.ts). The [independent S8 review](../briefs/observatory-foundations-slice-8-complete-review.md) and [root integration evidence](../briefs/observatory-foundations-slice-8-integration.md) establish this slice only. S9 prediction verification is recorded below; whole-foundation review/QA and Astra acceptance remain open.


## Conditional opportunities and clock context

- Phase-specific threshold: the quorum requirement belonging to an accepted phase's own Numerical basis. Rights corrections can leave retained preattestation and newer attestation facts with different thresholds; rendering one phase cannot replace the other's threshold. Captured maxima retain their own bases separately.
- Conditional opportunity: one of two futures relative to the selected observed level N, round R: same-level N/R+1 or next-level N+1/R0. Both can coexist. Future block hashes remain unknown; a clock estimate does not replace the observed anchor.
- Expected proposer: a delegate justified by coherent, context-pinned baking rights for that exact branch's level and round. It is separate from the producer of an observed candidate. Missing or conflicting rights leave it unavailable; knowing a proposer does not establish timing.
- Conditional deadline: a predicted protocol boundary justified by execution parameters and an actual reference timestamp/round. The next-level boundary is conditional on hypothetical production. Execution durations govern the predecessor-round term too. Unsupported migration timing remains unavailable; differing protocol hashes do not establish a round reset. Timing and proposer availability are independent.
- Captured opportunity: immutable original proposer/timing contexts and receipts, deadline, remaining duration at capture, wall date and monotonic capture time. Historical inspection renders those captured facts without continuing its countdown or substituting current helpers. Later live evidence cannot fill an uncaptured frozen historical opportunity.
- Renderable capture/receipt date: a safe integer millisecond value within the inclusive calendar range ±8,640,000,000,000,000. Invalid displayed capture or proposer/timing receipt dates are rejected before opportunity publication without repairing the original receipt. Applied header timestamps have their separate strict string guard.
- Independent clock estimate: an estimated protocol round derived from a proven applied reference and execution parameters, visibly separate from selected branch deadlines. Its original observer and actual parameter responder remain distinct. Unsafe or unrenderable computed endpoints make the estimate unavailable while independently valid branches can remain known. Clock advance alone cannot select an observed round, expire coherent votes, refresh receipts or advance applied values.
- Prediction elapsed / awaiting observation: a justified conditional deadline has passed without the corresponding observation. This creates no block, history transition, quorum event or finality claim. Missing timing remains unavailable.
- Observed progression: a source-attributed transition between actual heads: same-level round advance, next-level advance, same-height reorganization or skipped delivered levels. Skips disclose an unobserved intermediate path; transport connectivity remains separate.

These definitions follow [conditional timing](../src/consensus/roundSchedule.ts), [immutable opportunity capture](../src/consensus/opportunityFacts.ts), [retained observations](../src/monitor/observationStore.ts), [production wiring](../src/main.ts) and [reader](../src/dashboardView.ts). The [independent S9 review](../briefs/observatory-foundations-slice-9-complete-review.md) accepted frozen source `b964fed` within that slice, including separate phase thresholds, calendar bounds and clock attribution. The [glossary proposal](../briefs/observatory-foundations-glossary-addendum.md) records contract references. Fresh whole-foundation review, independent QA and Astra acceptance remain open.

The [independent whole-review correction disposition](../briefs/observatory-foundations-whole-review-corrections.md) verifies the event/display and autonomous-source boundaries above on joint source `a2be763`. Final exact-root whole review and independent QA remain separate gates.
