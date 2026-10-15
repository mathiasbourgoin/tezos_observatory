# Slice 4 implementation checkpoint

Status: **INTERIM, full S4 consumer checkpoint ready for independent frozen review.** This brief describes source-local ahead-observation reconciliation through the production monitor and reader. It does not declare parent implementation completion, acceptance, or a GO verdict. The frozen revision is the commit containing this brief; its exact SHA is sent to the parent immediately after the clean local commit. Parent implementation remains in progress.

The production reader now retains configured observer B's ahead candidate or candidate-free consensus evidence while primary observer A remains at its applied head. Evidence stays unresolved without numerical authority until the same B endpoint proves compatible chain, head, parent, execution protocol and target rights. Successful reconciliation promotes the retained identity without replacing A's applied head, changing the original receipt, fabricating a candidate hash or reinserting its raw operation. The reader exposes unresolved/error/context-invalid state, actual observation and helper provenance, and an explicit source-local retry control.

## Delivered consumer boundaries

`src/monitor/observationStore.ts` owns the canonical candidate and candidate-free quarantine, accepted observation products, bounded raw operations, membership references and separate admission proofs. Candidate and consensus-instance arrivals share the 100 unresolved limit. Accepted candidates remain separately bounded at 100; raw operations remain bounded at 10000. First monotonic receipt and lexical identity ties determine eviction; replay does not refresh the first receipt. Quarantine and raw eviction remove owned membership/proof references so evicted evidence cannot silently regain power through a different retained target.

`src/monitor/networkMonitor.ts` ingests proposals and operations into that store and projects its products to the actual application consumer. Reconciliation keeps observer-local context separate from the selected primary applied chain snapshot. The same-observer context callback withdraws old live authority as soon as contradictory context is observed, before asynchronous replacement rights finish. Collection and observer generations fence delayed admission, including pause/resume and same-height changes. The monitor supplies retained target ownership to failed-context bookkeeping.

`src/monitor/observerReconciliation.ts` owns one workflow and one newest queued material context per configured source. Starts use monotonic spacing of at least 15000 milliseconds. Material identity includes source, proven head/parent/protocol and target identity; receipt replay is not a fresh material context. Failed retained contexts require a fresh explicit manual retry after cooldown. An early click does not enqueue a future automatic retry. Lifecycle interruption aborts in-flight reads and clears queued starts; restart does not erase retained failure state. Reconciliation performs no provider cascade or permanent polling.

`src/rpc/networkData.ts` obtains reconciliation proof from the originating configured observer only. Exact pinned block/header/protocol and parent evidence establish the execution context used for rights and constants. Concrete rights/constants context facts must match the admission proof; an equal opaque key alone is insufficient. Candidate target substitution, incompatible execution protocol, wrong-chain membership and obsolete generation proofs cannot supply numerical authority. `src/consensus/phaseEvidence.ts` accepts power only through compatible concrete context and distinct delegate membership, preserving individual/aggregate replay deduplication.

`src/main.ts` and `src/dashboardView.ts` expose retained source-local targets and retry through production `/`. Selection uses canonical retained identities, and applied A hash/level remain independent of selected B consensus context, including unavailable-authority paths. Positive coherent power is labelled as partial source observation. Absent opposite-phase observations remain unavailable; this slice does not manufacture complete snapshot zero.

## Chain identity decision and review corrections

A same-B pinned validated header's actual `chain_id` proves that observer's network identity independently. Reconciliation does not require a new `chain_id` RPC or bootstrap proof borrowed from A. Requested pinned block identity and actually observed source context remain distinct immutable facts. If a known expected chain contradicts that proof, numerical authority is withheld and raw attributable evidence remains inspectable.

The real wrong-chain behavioral red was corrected and covered at the actual consumers. The earlier assumption that B's pinned actual chain proof was intrinsically insufficient was withdrawn after root clarification; it was not an accepted contract failure. This distinction preserves the accepted source-proof boundary without inventing an additional prerequisite.

Earlier domain corrections are recorded in [the domain interim checkpoint](observatory-foundations-slice-4-domain-interim.md) and [the frozen domain review fixes](observatory-foundations-slice-4-domain-review-fixes.md). The final consumer diff extends those bounded domain APIs through the monitor and production reader; those older reports do not certify this later consumer checkpoint.

## Verification evidence and pending freeze

Final immutable-code verification used Node 22. The last explicit optional-context guard initially triggered TypeScript TS18048; it was corrected to an explicit existence check and TypeScript was rerun successfully. No application source was changed during the successful final browser run.

| Check | Actual final result and scope |
|---|---|
| `npm ci` | PASS, 48 packages, zero vulnerabilities. |
| `npm run check` | PASS after the explicit optional-context guard correction. |
| `npm test` | PASS, 120 tests / 17 files. |
| `npm run build` | PASS after the final guard correction; 16 modules, JS 84.20 kB. |
| Native AC-1 / 3 / 9 / 10 / 11 / 12 / 18 | PASS; respectively 12 / 23 / 12 / 7 / 9 / 29 / 21 assertion groups. |
| Original AC-4 / AC-20 | PASS in Chromium and Firefox; 7 / 2 assertion groups respectively, including production `/`. |
| Original AC-17 / AC-21 | ERROR exit 2, truthfully incomplete until retained historical consumer / comparison evidence is delivered. |
| `npm run test:e2e` | PASS, 46 tests across Chromium and Firefox, 17.9 seconds, stable final application code. |
| Scope / whitespace | `check-scope-diff.sh` and `git diff --check` PASS. |

Earlier full browser execution had 44 PASS / 2 failures from inherited opposite-phase false-zero expectations. Those expectations were corrected to exact preattestation power 600 and attestation unavailable; the genuine B production unavailable-power red is separately retained in the implementation history. A subsequent pre-final run passed 46 tests. During the final TypeScript correction, another full run reported 44 PASS / 2 failures: Chromium timed out waiting for the source-B operation stream rotation; Firefox reported a destroyed navigation execution context while awaiting that stream. Their cause is not asserted. The final run on immutable application code passed all 46 tests; it does not erase the earlier results.

The final source-context withdrawal regression also exercises the actual monitor: new same-observer head facts invalidate old numerical authority before a replacement helper can finish or fail. Temporarily removing actual head delivery reproduced the consumer assertion failure; restored production delivery passes. Browser fixtures use identical pinned header facts rather than manufacturing contradictory timestamps.

Final production evidence screenshots (not substitutes for assertions) have SHA-256:

- `roster/observatory-foundations/slice-4-chromium.png`: `b63d38de6f581657459c133ef8c31a51c4f9751df7a4fdb0972e1765bca6f696`.
- `roster/observatory-foundations/slice-4-firefox.png`: `e6995ad0dc548f7b7ad27e2ba7a15342d6b551b9c260146f53d5ea3ec4a17d8c`.

Historical S1 screenshots were restored after the browser suite regenerated them; S4 has its own evidence artifacts.

Native checks preserve behavioral assertion failures as exit 1 and execution/import/setup/timeout/cleanup errors as exit at least 2. Their positive assertion counts are part of the evidence. Browser scenarios exercise production `/`, independently attributed B proof/power and A applied context, source-only request ledgers, failure/manual retry, lifecycle interruption and delayed bodies. Final counts alone do not replace those scenario assertions or the independent review checklist.

## Remaining contract limits

S5 still owns coherent post-identity complete pending snapshots, justified source-snapshot zero, immutable accepted-observation events, bounded crossing certainty and observer-health semantics. Current partial positive observations do not close those requirements. Pending mempool requests remain unpinned and must not acquire a fabricated `requestedHeadHash` in that later work.

S6 still owns complete retained session/history/pin inspection, including the historical application-consumer evidence needed for AC-17. Retaining immutable records during S4 does not close that historical criterion. S8 still owns independent comparison and comparison-specific AC-21 lifecycle evidence. Full prediction/progression and remaining later-slice requirements also remain open under the whole-epic contract.

No publication, deployment or parent completion is authorized by this interim brief. Review must use the owner's exact frozen SHA and final evidence against the slice-4 checklist; the full ten-slice and 38-check contract remains binding.

Reuse remains the existing OperationStore, phase accounting, native maps, AbortController, Vite, Vitest and Playwright. No generic infrastructure or dependency was introduced by this slice report.
