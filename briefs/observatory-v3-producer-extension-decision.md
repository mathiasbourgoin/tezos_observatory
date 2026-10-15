# Root decision: matching candidate block producer

Approved intermediate implementation clarification, 15 October 2026. This is not publication approval, a weakening of accepted criteria, or a claim of implementation/QA success.

The independent investigation in observatory-v3-producer-contract.md establishes a real acquisition gap: V3 AC-01/09 require a positive matching-producer path; current official monitor/header formats carry no producer metadata. Foundation unknown-on-absence remains correct. Root accepts the investigation and authorizes the minimal additional evidence capability needed to fulfill the existing V3 scope. Do not invent metadata in monitor fixtures or mark the positive requirement N/A.

## Authorized acquisition boundary

Use the official immutable-hash metadata endpoint on the independently proven candidate source/chain, integrated with existing auxiliary transport/lifecycle primitives. The supported protocol metadata baker is the block producer; proposer is the payload producer and never a substitute. Record and expose the exact requested hash, source, chain/context/protocol and independent metadata receipt. Missing, malformed, unsupported, unproven, unavailable or timed-out evidence remains unknown; it never blocks candidate/vote admission or changes selection.

One read per admitted exact identity within its supported retention/authority window, one in flight plus one latest destination queued, cache at most100, body-inclusive timeout at most8seconds, no polling, retry, cascade or historical backfill. Deduplicate head/validated delivery of the same source/chain/hash. Use bounded admission/attempt bookkeeping that cannot create new reads from cache eviction or replay; do not build unbounded tombstones. If first-attempt authority cannot be proven after retention loss, keep the fact unavailable. Document the concrete bounded policy and saturation behavior before claiming this obligation satisfied.

Acquisition is associated with genuine admitted source events, never render, tick, theme, inspection, Previous, Latest or Follow actions. Comparison retains its independent three-read contract and B context reconciliation retains its existing budgets. Pause/initial-hidden/pagehide/generation/context invalidation abort and fence late bodies. Retained matching pins may enrich from an already legitimate receipt; history-evicted frozen copies never acquire or mutate facts. Metadata receipt cannot replace candidate first receipt or navigation chronology.

Reuse existing bounded fetch, cancellation, source identity and store mechanisms. No new dependency, generic parser/framework or collector. Preserve all foundation interfaces and invariants; any necessary additive typed interface must be documented for independent review.

## Required evidence

Real metadata-shaped responses through the production transport/guard/store/assembly path must prove H2/P and H3/Q attribution, baker versus proposer distinction, same-payload nontransfer, unknown failures, source/hash/chain/context mismatch, unsupported protocol, body timeout and lifecycle cancellation, stream deduplication, queue/cache/attempt bounds, replay after retention loss, and zero navigation/timer reads. Keep the original numerical/crossing assertions and both engines. Focused independent domain review and final whole-epic review/QA are required. No synthetic ready-made view or undocumented endpoint may substitute.

The author remains Astra. Root can answer further implementation questions under project authority. Full accepted V3 and foundation acceptance remain unchanged.

## Bounded-window refinement

Root rejected an author proposal to consume100 producer attempts permanently for the entire browser session: that would disable the positive capability after ordinary short-lived monitoring. The bounded attempt ledger must instead follow genuinely proven current/successor context windows, retaining attempts as a successor becomes current and retiring older windows only after independently proven head advancement. Old/replayed identities below the source/chain-qualified admission watermark cannot start new reads merely because old cache entries retired. No timer-driven window advance, no in-window attempt eviction or retry. Cap saturation may temporarily leave new evidence unknown until genuine context progress; it must not permanently disable all future acquisition until page reload. A rollback below the accepted watermark does not authorize historical backfill; retain honest unknown and original historical evidence. Exact safe integration with existing domain authority remains subject to implementation and independent verification.
