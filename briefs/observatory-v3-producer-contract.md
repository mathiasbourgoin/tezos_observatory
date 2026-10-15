# V3 candidate producer: contract adjudication evidence

2026-10-15. Read-only investigation requested by root; no application edits, RPC probes, dependency changes or publication. Root source inspected at `2e81e64f12a324a7f8775887ce3ac01d6c6ff5c2`; Astra's uncommitted worktree still has base `bf0f2d5c395ecdcf155064ba56f1577bfb73cc4c`. References below distinguish present capability from proposed correction. This report does not grant an acceptance pass.

## Recommended decision

Keep **Producer unknown** whenever there is no exact candidate-specific evidence. However, **do not mark the matching-producer positive scenario in V3 AC-01 or AC-09 non-applicable or passed** merely because the existing model has no such field. The accepted V3 wording includes that positive path explicitly. The present pipeline has a genuine capability gap under a strict no-new-endpoint constraint. Root should resolve that gap through a narrowly scoped, bounded evidence-acquisition extension, or explicitly record these criteria incomplete until such an extension is accepted and implemented. No full-epic replanning is necessary.

The prerequisite foundations are consistent with this conclusion: they require safe conditional attribution, not a positive producer capability. Their acceptance therefore need not be retroactively invalidated. V3 adds a stronger positive example.

## Contract evidence

| Source | Binding meaning |
| --- | --- |
| `specs/observatory-foundations.md:36`, `:188` (FR-003); `briefs/observatory-foundations-intake.md:20` | Producer may be displayed only from matching candidate evidence; missing evidence must remain unknown. This is a conditional safety requirement. |
| `specs/observatory-foundations.md:57`, `:150`, `:310`, `:318` | Same-payload candidates stay distinct; payload votes do not prove their producer or candidate-specific signatures. The original foundation happy path explicitly expects no inferred producer. |
| `specs/observatory-v3.md:49` (US-1-S1), `:166` (FR-002) | Votes-only hash and producer are unavailable. This remains mandatory independently of positive capability. |
| `specs/observatory-v3.md:50` (US-1-S2), `:167` (FR-003), `:130` (C-1) | Candidates expose actual hashes and matching-only producer; shared payload is insufficient for attribution. FR-003 alone limits evidence, but the scenario explicitly describes exposing matching producer. |
| `specs/observatory-v3.md:270` (AC-01), `:278` (AC-09) | Both explicitly include selecting H2/P then H3/Q and exposing actual hashes and matching producer. Neither makes this entire positive scenario optional when the implementation lacks a producer field. |
| `specs/observatory-v3.md:380`; `briefs/observatory-v3-qa-readiness.md:38` | Required evidence matrix includes unavailable **and** matching producer. Always-unknown proves only the unavailable branch. |
| `briefs/observatory-v3-intake.md:18`, `:114`, `:116`, `:122` | Do not simplify by changing accepted identity/provenance/cancellation/comparison contracts; retain exact evidence and acquisition limits. The second-source comparison budget is not a spare acquisition channel. |

There is no contradiction between unknown-on-absence and showing a producer when exact evidence exists. The mismatch is between the accepted positive V3 scenario and the present acquisition capability. A fixture that invents an unsupported source format cannot repair that mismatch.

## Current implementation capability

- `src/rpc/models.ts:29–46`: `CandidateObservation` has identity/header/evidence; `BlockHeader` has chain/source receipt, proto counter, level/hash/parent/time/fitness/payload, **no producer evidence**.
- `src/rpc/guards.ts:35–73`: both header and validated-proposal guards produce this restricted header model. They do not parse metadata.
- `src/monitor/networkMonitor.ts:138–139`, `:215–217`: actual streams are `/monitor/heads/main` and `/monitor/validated_blocks?chain=main`.
- `src/monitor/networkMonitor.ts:385–409`: receipts correctly retain source and actual observed hash; proposal identity is source/network/chain/hash. This does not independently establish producer.
- `src/monitor/observationStore.ts:159–168`: candidate admission retains that evidence; payload equivalence cannot supply missing producer facts.
- `src/rpc/networkData.ts:186–208`: context establishment requests hash-pinned `/header` and `/protocols`, verifies the header, and caches a bounded context. Neither currently retrieves block metadata.
- `src/rpc/sourceComparison.ts:131` reads `/head/header`. Its identity/head/pending three-read workflow is separately contracted and cannot silently gain a producer read.
- Astra working `src/main.ts:315` currently emits `Producer unknown` unconditionally. That is honest for present inputs, but cannot fulfill a positive matching-producer criterion.

## Official wire formats, independently checked

Primary sources are pinned to the same Octez mirror revision already used by foundations, `5c73fc9ae945fa222307de01c22403526ce197ee`. These were documentation/source reads, not calls to any live Tezos RPC.

- [monitor_services.ml, lines 95–108 and 134–144](https://github.com/tezos/tezos-mirror/blob/5c73fc9ae945fa222307de01c22403526ce197ee/src/lib_shell_services/monitor_services.ml#L95): validated-block output includes chain ID, hash, raw header and operations; heads output includes hash and raw header. Neither schema includes block metadata. The applied-block monitor also lacks metadata. There is no supported `metadata.baker` or `metadata.proposer` envelope to preserve from these existing streams.
- [block_services.ml, lines 1303–1343 and 1761–1769](https://github.com/tezos/tezos-mirror/blob/5c73fc9ae945fa222307de01c22403526ce197ee/src/lib_shell_services/block_services.ml#L1303): full block information contains chain ID, hash, header, optional metadata and operations; `/header` returns header only. The independent `/metadata` endpoint is defined at lines 1351–1375. Metadata availability depends on stored history. None of the present acquisition paths requests full block information or metadata.
- [Ushuaia apply_results.ml, lines 2519–2542 and 2606–2624](https://github.com/tezos/tezos-mirror/blob/5c73fc9ae945fa222307de01c22403526ce197ee/src/proto_025_PsUshuai/lib_protocol/apply_results.ml#L2519): protocol metadata contains distinct `proposer` and `baker` delegate fields and their consensus keys. Do not silently collapse the roles into a generic `producer` or infer either from payload equality. A final field label must name the verified protocol role.
- [Ushuaia apply.ml, lines 3107–3115 and 3332–3336](https://github.com/tezos/tezos-mirror/blob/5c73fc9ae945fa222307de01c22403526ce197ee/src/proto_025_PsUshuai/lib_protocol/apply.ml#L3332) resolves the exact roles: metadata `baker` is the **block producer**, while metadata `proposer` is the **payload producer**. They can differ when payload is reused. For an observed candidate block's producer, use verified `baker`, labelled “Block producer / baker”; never silently fall back to `proposer`. A separate payload-producer field is optional and must retain that name. Partial construction can use zero consensus keys, so arbitrary metadata-like objects are not sufficient evidence of an applied stored block.

Consequently, accepting invented `metadata` added to a standard monitor/header fixture would create a positive test path that normal admitted sources cannot exercise. Adding an optional domain property without a real supported acquisition path also does not fulfill the requirement.

## Minimal honest correction for root to scope

The smallest useful extension is one source-bound, hash-pinned metadata acquisition at actual candidate admission, integrated into existing auxiliary lifecycle/provenance machinery. Navigation itself remains entirely local. This is a proposal, not an implemented or newly authorized endpoint contract:

1. Use the already verified candidate chain/source/hash/header/context. A request must target that exact source and immutable hash, never `head`, an arbitrary public provider or a same-payload sibling. Do not reclassify a right-holder as an observed producer.
2. Prefer the official `/chains/main/blocks/<candidate-hash>/metadata` endpoint with existing independently proven hash/header/chain context. An alternative is replacing an already needed context header request with official full-block info carrying hash/header/metadata, but that increases body size and couples optional metadata to required context admission; it is not a free no-change solution. Do not substitute an unsupported full-block response at the `/header` URL in fixtures.
3. Define a concrete bounded policy before implementation: one admission-associated read per proven source/chain/hash identity, no timer/render/selection reads, no retry/cascade, one in flight plus one latest queued destination and cache capacity 100. Deduplicate head/validated observations of the same exact hash/source/chain. An 8-second body-inclusive timeout is a reasonable new explicit limit, not an existing metadata guarantee. Do not extend comparison's three-read workflow or observer-B contextual reconciliation's admission budgets. Cache eviction must not cause render/navigation reads or unlimited re-admission replays; keep skipped/dropped acquisition honestly unknown. No unbounded historical backfill.
4. Receipt preserves requested hash, actual source, proven chain/context/protocol, wall and monotonic receipt. Validate the supported protocol's distinct baker/proposer fields and address form. Unsupported protocol, malformed/missing/pruned metadata, failed context match, timeout or absent/unstored candidate yields unknown independently of otherwise valid votes.
5. Pause, hidden, pagehide and generation/context invalidation abort external work and prevent late commit. Pinned retained identity may enrich with matching immutable evidence; evicted frozen snapshots do not become live acquisition targets. No read during paused inspection.
6. Production fixture tests must exercise the real endpoint shape through transport/guard/model/store/selection, not inject a ready-made view model. Test positive H2 and H3 with different exact producer evidence and different baker/proposer roles, H1/H2 shared payload without producer transfer, wrong hash/source/chain/context, missing/malformed/unsupported metadata, cancellation, same-hash deduplication across both streams, one-flight/latest-queue/cache limits and no reads on timer/render/navigation/paused selection. Both Chromium and Firefox retain exact numeric and crossing assertions.

Risks to resolve in the scoped correction: validated-but-not-stored candidates can legitimately return unavailable metadata; that remains unknown with no polling to await storage. Metadata responses have no own block hash, so the immutable requested hash and verified same-source candidate/context are essential, with redirect source handling consistent with existing trust boundaries. Do not let metadata availability gate candidate/vote admission or move selection. Keep original candidate receipt separate from later metadata receipt; enrich matching retained pins only, never mutate old provenance or resurrect evicted frozen evidence. This new auxiliary capability warrants focused independent domain review and lifecycle/request-ledger tests; existing full V3/foundation gates remain required.

If root retains a strict zero-new-endpoint rule, the honest disposition is **capability gap / positive AC scenario incomplete**, with unknown rendered correctly. That constraint cannot simultaneously yield a genuine positive path from currently received formats. This report does not recommend weakening AC-01/09, fabricating fixture formats or declaring full V3 GO before the gap is resolved.
