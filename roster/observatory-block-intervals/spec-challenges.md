# Block intervals — adversarial requirements challenges

Fresh adversarial requirements pass over the complete validated intake, accepted story draft, fresh researcher report, resolved clarifications Q1–Q8 and research External prior art. This report records questions for the delegated root gate, not user questions, implementation proposals or acceptance evidence. Root decisions on completion-receipt freshness, cooldown clearing and applied-head triggers are treated as binding. Every story is challenged below.

## Challenges

**C-1 [US-1, scenario 5 — outcome taxonomy].** The scenario combines “insufficient data/unavailable,” while intake Arithmetic 6 calls zero/negative duration and disagreeing endpoint order insufficient data, then calls contradictory endpoints unavailable. Clarification Q2 repeats both categories. Exactly which result/reason applies to positive level difference with negative time difference, reversed levels, equal time with different levels, and E at/before C? The final spec needs one determinate classification for each rather than an implementer-selected slash label.

**C-2 [US-1, scenarios 3–5 — source rows and ordering].** What is the required outcome for a limit=1 response containing two rows, a floor S above E.level, a floor timestamp after C, or an earliest row at/before C after the floor returned empty? These violate different selection assertions; specify whether each invalidates only its affected window or the shared batch. An earliest response is shared, so its failure scope is otherwise unclear.

**C-3 [US-1, scenarios 1/6; US-2, scenario 3 — timestamp equality and precision].** Guards accept timezone offsets, and the metric supports subsecond intervals. Does fixed-E “exact timestamp” equality compare the represented instant or the source string (e.g. Z versus +00:00)? What timestamp precision is supported, and what happens to extra precision accepted by parsing but truncated in arithmetic? Calendar validity alone does not settle equivalent encodings or precision loss.

**C-4 [US-1, scope and scenarios 4/5 — explicit provider history evidence].** Intake Arithmetic 8 requires unavailable/partial with a specific reason when TzKT exposes missing/partial history, but neither stories nor Q8 identify the admissible evidence or its effect on an otherwise valid floor pair. Which response facts qualify, and when does a valid endpoint-only result become partial versus unavailable? Absence of independently checked intermediate history is already an accepted limitation and must not itself become a new failure test.

**C-5 [US-2, scenarios 3–5 — failure scope and deadlines].** An invalid/missing fixed-E recheck prevents commitment, but what does a timeout, HTTP failure, invalid JSON or oversized body on that mandatory recheck do? Conversely, if a floor times out at 8 seconds but remaining reads finish within 24 seconds, may the coherent new batch commit with that window unavailable? Define whole-batch deadline behavior when some windows already succeeded; “acquisition settles as failure” and independent window failure currently leave different permitted outcomes.

**C-6 [US-2, scenario 6 — metadata provenance selection].** Several bounded responses can contain distinct coherent known/indexed metadata and receipts. Which response supplies the displayed lag/synchronization evidence? If initial metadata is coherent but later recheck metadata is missing/contradictory, can the earlier observation remain displayed with its original receipt? Same-response arithmetic is settled, but response selection and malformed synchronized-at handling are not.

**C-7 [US-2, scenarios 1/5 — identity contradiction].** Which actually supplied identity facts can establish an explicit network contradiction, given the minimal block projection and optional headers? What happens to an unrecognized or malformed identity assertion, as opposed to a recognized contradictory one? This must remain distinct from RPC/TzKT height difference, which Q7 explicitly says is not a contradiction; no additional identity read is authorized.

**C-8 [US-3, scenarios 3–5 — invalidation during an active batch].** Q7 makes a proven reorganization/rollback immediately stale retained results, but does it also fence an already running pre-event attempt? Can that attempt later commit and clear sticky invalidation merely because its fixed-E recheck still matches? Specify which post-invalidation successful batch may clear the stale state. Pause/hidden generation fencing is explicit; reorganization/context invalidation fencing is not.

**C-9 [US-3, scenarios 1/2 — Refresh ownership].** Both networks collect independently while tab selection is presentation only. Does the native Refresh block intervals action target the displayed network, both networks, or a separately named network? Specify cooldown/disabled feedback and concurrent-action behavior when one network is cooling down or active and the other is eligible.

**C-10 [US-3, scenarios 1/3 — refresh/failure reader states].** When an attempt runs over an existing result, does the reader retain that result with a loading annotation, and what receipt/failure information remains visible after failure? A failed whole attempt retains the old batch stale/historical; an independently failed window in a successfully committed batch cannot inherit an old value (Q4). Define the displayed state when no previous batch exists, including paused/initially hidden collection, without treating an absent value as zero.

**C-11 [US-3, scenario 3 — independent indexed-block age].** Completion age is now settled, but what precisely anchors indexed-block age when E is historical and wall time jumps during acquisition or after commitment? Specify its baseline receipt and whether clock inconsistency can produce unavailable age or a clamped value. A wall jump must not silently alter the mean, T or completion-based freshness.

**C-12 [US-3, scenario 6 — reviewable visual contract].** The scenario says “accepted” dimensions/zoom/contrast without a revision-qualified matrix or numeric contrast reference. The researcher establishes that root and V3 checkouts differ. Which exact existing foundation/V3 acceptance interfaces supply that matrix for this additive region, and which new reader checks demonstrate preservation at those sizes? This requests a determinate contract/reference, not execution evidence at specification time.

## Required prior-art divergence challenges

These divergences have validated product rationale in the intake. They must be explicitly dispositioned against that rationale, rather than reopened as unknown arithmetic or infrastructure choices.

**C-13 [US-2 — TzKT blocks REST].** Prior art: TzKT provides filtered, level-sorted bounded lists with pagination and exact-or-lower timestamp lookup ([Blocks controller](https://raw.githubusercontent.com/baking-bad/tzkt/master/Tzkt.Api/Controllers/BlocksController.cs)); stories assume endpoint-only floor queries with no pagination and no intermediate-block verification—justify divergence/adopt prior approach. In particular, what stated evidence limitation prevents the bounded selection from being advertised as fully verified historical continuity? The intake already selects bounded endpoints and explicit indexed-span attribution; the final spec must preserve that justification.

**C-14 [US-2 — Octez historical RPC].** Prior art: Octez offers historical hash fragments with operator-dependent retention/context ([Shell RPC reference](https://octez.tezos.com/docs/shell/rpc.html), [history modes](https://octez.tezos.com/docs/user/history_modes.html)); stories assume TzKT-only historical reads with no RPC fallback—justify divergence/adopt prior approach. The accepted bounded browser-only source contract must explain why unavailable TzKT history remains unavailable rather than asserting archival node coverage.

**C-15 [US-1 — Tenderbake timing].** Prior art: Tenderbake defines individual timestamp differences and round-dependent protocol duration ([Consensus reference](https://octez.tezos.com/docs/active/consensus.html#time-between-blocks)); stories assume a fixed-wall-window telescoping timestamp/level mean including the full crossing interval—justify divergence/adopt prior approach. The validated empirical-versus-protocol distinction must remain explicit so neither nominal delay nor unfinished current wait is substituted into the formula.

**C-16 [US-1/US-3 — TzIndex health].** Prior art: TzIndex computes weighted consensus penalties with crawler synchronization gating ([Tip implementation](https://raw.githubusercontent.com/blockwatch-cc/tzindex/master/server/explorer/tip.go)); stories assume arithmetic means and separate source/chain evidence without a health score—justify divergence/adopt prior approach. The final criteria must make the accepted separation falsifiable, including provider failure and a freshly fetched old block.

**C-17 [US-3 — Node monitoring].** Prior art: Octez monitoring scrapes instantaneous metrics into configurable retained time series ([Monitoring](https://octez.tezos.com/docs/user/node-monitoring.html)); stories assume event-triggered browser acquisition, no timer polling and only one retained batch—justify divergence/adopt prior approach. The accepted quiet-period behavior must not imply a continuously maintained week-long series or automatic retry after cooldown.

## Edge cases requiring explicit disposition

- **EC-1 [US-1]:** Floor exactly at C with equivalent offset encoding: boundary inclusion expected; timestamp recheck equivalence/precision remains C-3 unspecified.
- **EC-2 [US-1]:** E timestamp equals C: no completed sample expected; exact insufficient/unavailable label remains C-1.
- **EC-3 [US-1]:** Empty week/day floors plus invalid shared earliest: no partial mean expected; failure scope/reasons remain C-2.
- **EC-4 [US-1]:** Valid E/S with declared missing intervening history: no invented continuity expected; partial/unavailable threshold remains C-4.
- **EC-5 [US-2]:** One floor ignores abort, times out, then returns late while other windows succeed: late response cannot affect results; permitted partial commitment remains C-5.
- **EC-6 [US-2]:** All floors valid but E verification HTTP503: no verified new batch expected; explicit failure classification remains C-5.
- **EC-7 [US-2]:** E response metadata says250/255; recheck says260/260 or lacks metadata: no cross-response subtraction allowed; displayed provenance remains C-6.
- **EC-8 [US-3]:** Batch starts at0, events/clicks at10/24/59 seconds: cooldown-ineligible triggers dropped; no deferred60-second start, even after failed attempt. Q6 settles this.
- **EC-9 [US-3]:** Proven rollback during acquisition with unchanged fixed E: old result immediately stale; acceptance/fencing of pending success remains C-8.
- **EC-10 [US-3]:** Mainnet cooling down while Shadownet eligible and user activates Refresh: target and feedback remain C-9.
- **EC-11 [US-3]:** Batch completes24 seconds after T, at completion age119.999 then120 seconds: fresh then stale respectively; T and arithmetic unchanged. Q5 settles this.
- **EC-12 [US-3]:** Hidden initial load and manual pause preserved through BFCache: no acquisition expected; absent-result reader wording remains C-10.
- **EC-13 [US-3]:** Wall clock moves backward during acquisition of a valid historical E: completion freshness remains monotonic; indexed-block age interpretation remains C-11.
