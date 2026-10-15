# Foundations S5 — independent complete-slice review

**APPROVE — INTERIM S5 only**, at `84f4e6de0127f4c23d0673754c7870fa86b1e6ce` (parent `bda98ea800e29ad7f02448b37da2af162f4c62f3`). All six independently reproduced findings, including the empty-contents complement, are corrected and independently revalidated. No unresolved blocking S5 finding remains in this review. This does not approve the whole foundation programme or close criteria assigned to later slices.

Reviewed on 2026-10-15 in detached worktrees, finally `/tmp/observatory-s5-final-review-84f4e6d`. The final HEAD was checked and the worktree restored clean. The owner’s mutable worktree and S6 work were not used as verification sources. No implementation change, commit, integration, push, or deployment was performed. This report is the sole root-workspace write.

## Contract and scope

Authority: accepted `specs/observatory-foundations.md`, accepted plan/addendum, `briefs/observatory-foundations-slice-5-review-checklist.md`, applicable project authority and TypeScript rules, reviewer/architect skills, and S4’s recorded limits. Reviewed the complete S5 change from `31c2119cc2135b7d96f600e3bde0764915dd728c`, initial S5 `fc7e1327a529167a24bca535623c574b455d329e`, and both correction checkpoints. Final aggregate change: 14 files, 860 insertions and 92 deletions; no dependency or infrastructure addition.

Coverage included snapshot version 2 and completion ordering; exact observer/context/generation admission; invalid aggregates, unknown kinds and partial positives; opposite-phase unknown versus authenticated zero; interruption and late completion; immutable receipts, maxima and captured denominator/threshold; shared payload accounting; prior-below versus first-observed quorum; corrections/replays; bounded retirement and overflow; reorg return; twelve retained events and supporting maps; source health and actual production readers.

The temporal rule is completed body receipt after identity and request start. A request started before identity may qualify when its full body arrives after identity and its contexts remain coherent. Request start alone is not a completeness proof or a server capture timestamp.

## Findings and independent correction verification

The following were actual assertion failures against frozen checkpoints, sent to the owner for reproduction. Severity describes the demonstrated former failure, not an unresolved finding at the final SHA.

| ID | Former severity / frozen RED | Reproduction and observed failure | Final correction and independent result |
|---|---|---|---|
| S5-R1 | High / `fc7e132` | Admit a preattestation with power 3 and a complete snapshot containing it; add 10,000 unrelated raw records so the supporting canonical record is evicted. Coverage stayed complete while counted power fell to zero. The real selected-candidate page also displayed a false zero in Chromium and Firefox. | Lost admitted support invalidates matching coverage before phase refresh. Original receipt and maximum are preserved. Store and both real-page regressions PASS; the page reports unavailable/stale rather than fabricated zero. |
| S5-R2 | Medium / `fc7e132` | Emit observed quorum, retire its phase through 151 other payloads while its event remains among the retained twelve, then receive a fresh same-identity quorum. Two events with the exact same identity appeared; reproduced on the real page in both engines. | Deduplicate against the existing bounded event list. Store and both page regressions PASS, preserving the original retained event/receipt. No infinite tombstone requirement was introduced. |
| S5-R3 | High / `fc7e132` | A malformed consensus content missing its payload made the parser report unusable, but valid siblings still produced quorum. Raw RPC `contents: []` could also establish complete zero coverage. Both failures were reproduced through the real page in both engines. | Invalid aggregates count no siblings; empty raw contents are unusable. Raw identity remains inspectable. Guard/accounting regressions and both production scenarios PASS. A valid nonconsensus operation remains usable raw evidence with no counted consensus contents. |
| S5-R4 | Medium / `fc7e132` | Replay an admitted stream operation through an unpinned pending snapshot with coherent before/after context. Two canonical records and two identical payload selectors appeared instead of one; both page engines reproduced it. | Exact authorized snapshot context can reuse the existing canonical operation without rewriting its immutable stream receipt or inventing pinning facts. Unit and both-page regressions PASS. A different proven fork still retains two distinct receipts/records: positive regression PASS. |
| S5-R5 | High / `bda98ea` | Evict only unrelated nonconsensus raw evidence, then observe a fresh coherent power 3→5 crossing. Global uncertainty incorrectly suppressed the first genuine crossing although no admitted consensus/phase history had been lost. Real-page reproduction failed in both engines. | Raw loss sets history uncertainty only when admitted consensus support was lost. Unrelated-only overflow and never-admitted ahead-of-head raw overflow both preserve the fresh crossing: PASS. Actual admitted-consensus/phase retirement remains conservative: power/quorum may be observed without reconstructing a crossing, PASS. |
| S5-R6 | Medium / `bda98ea` | Repeated supporting-record evictions appended the same compact coverage reason: four copies after four losses, allowing metadata growth despite the raw bound. | Reasons are an idempotent set while distinct reasons and original receipts survive. Independent repeated-eviction regression PASS. No additional retention budget or unbounded history map. |

R1’s essential positive also passes: a genuinely complete snapshot that contained no relevant operations remains an authenticated zero after 10,001 unrelated raw records. Unrelated operations never included in that snapshot do not retroactively destroy its proof. R5’s true-history-loss positive prevents the opposite regression of reconstructing a crossing after actual admitted history is forgotten.

The independent temporary regression patch is preserved outside the repository at `/tmp/observatory-s5-84f4e6d-independent-regressions.patch`: twelve unit groups and seven real-page scenarios, each page scenario executed in Chromium and Firefox. Temporary tests, server configuration and generated tracked screenshots were restored afterward.

## Implementation assessment

At the final SHA, `src/monitor/observationStore.ts` keeps compact snapshot coverage without copied operation arrays (line 33), admits snapshot reuse only under exact source/context and temporal guards (lines 133–145, 257–258), and handles loss of admitted support before phase recomputation (lines 178–188). Reason deduplication is bounded by the finite reason vocabulary. Completed body receipt must not precede identity or request start; stale generation/context cannot restore authority. Own tests cover start 0 / identity 1 / body receipt 2 acceptance with unchanged receipts, and rejection of body-before-identity and body-before-start cases.

Phase accounting retains captured maximum basis and evidence instead of repricing history on correction/replay. Crossings require an actual previously observed below-threshold state under a compatible basis; first-observed quorum is a separate event. Events share payload identity, are limited to twelve, and their retained exact identities prevent duplicates. Phase state is limited to 500 and attached to retained products; retirement is explicit uncertainty rather than an unbounded tombstone map (`observationStore.ts`, approximately lines 283–327). Raw storage remains bounded at 10,000, unresolved admission at 100; canonical memberships/bindings are pruned with retained records/products. Batch membership construction preserves receipt and crossing semantics rather than refreshing evidence on replay.

`src/rpc/guards.ts` rejects empty raw contents and invalid payload aggregates atomically. This agrees with the pinned [Octez operation representation](https://github.com/tezos/tezos-mirror/blob/5c73fc9ae945fa222307de01c22403526ce197ee/src/proto_025_PsUshuai/lib_protocol/operation_repr.ml), which requires the consensus payload field and rejects empty contents lists. `src/rpc/networkData.ts` collects explicit version-2 pending data with before/after context and generation guards; the [pinned pending-operation encoding](https://github.com/tezos/tezos-mirror/blob/5c73fc9ae945fa222307de01c22403526ce197ee/src/lib_shell_services/block_services.ml) was checked as the primary source. This review does not claim independent cryptographic validation of arbitrary RPC input.

`src/main.ts` consumes store authority and per-phase coverage: observed partial positives may remain visible, but zero/missing-delegate assertions require usable complete coverage. An unobserved opposite phase remains unknown. The production tests exercise the reader rather than only a synthetic facade. `src/monitor/networkMonitor.ts` derives progression from real same-observer proven advancement; connected alone starts unknown. Reconnection/provider changes preserve attributed previous progress without lending it to the new observer. No age/counter-based predictive stall claim is introduced.

One deliberate conservative limit remains: after actual admitted consensus/product/phase history loss, session uncertainty can affect subsequently unseen identities. The visible partial-crossing-history notice communicates that limit; observed power/quorum and raw evidence remain available without invented crossings. The flag does not reset merely with time, height, replay, or reorg return. This was tested independently and is distinct from the corrected unrelated/unadmitted-raw-loss defect.

## Independent executions

All commands used RTK. Runtime was independently checked as Node **22.23.3**, from `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin/node`, placed first on PATH. The following results are reviewer executions, not owner claims.

| Exact final SHA command / check | Observed result | Exit |
|---|---|---|
| `rtk npm ci` | Clean dependency installation | 0 |
| `rtk npm run check` | Type check passes | 0 |
| `rtk npm test` | **147 tests, 17 files**, frozen suite before temporary additions | 0 |
| `rtk npm run build` | 16 modules; JS 96.14 kB, gzip 28.40 kB | 0 |
| `rtk npm test -- --testNamePattern REVIEW` | **12 independent groups pass**, 147 frozen tests skipped; 159 augmented tests accounted for | 0 |
| `rtk npm run test:e2e -- --grep REVIEW` | **14/14** independent real-page tests, two engines, 6.4 s | 0 |
| `rtk npm run test:e2e` after removing temporary tests | **62/62**, Chromium and Firefox, 27.8 s | 0 |
| `rtk git diff --check` | No whitespace errors | 0 |
| `rtk git rev-parse HEAD`; `rtk git status --short` after restoration | Exact final SHA; clean | 0 |

For browser isolation, only the detached test server port/base URL was temporarily changed to 5197; application and assertions remained frozen for the full 62-test gate. It was restored afterward. No shared running process was killed or silently reused.

Native commands were `rtk proxy node scripts/check-observatory-foundations.mjs AC-N`. Each entry below was independently run on the final SHA and exited 0:

| AC | 1 | 2 | 3 | 9 | 10 | 11 | 12 | 14 | 18 | 19 |
|---|---|---|---|---|---|---|---|---|---|---|
| Assertion groups | 12 | 11 | 23 | 12 | 7 | 9 | 29 | 32 | 21 | 17 |

Exact browser wrappers used the same command with `--browsers chromium,firefox`: AC4 **7**, AC8 **2**, AC13 **2**, AC20 **2**, AC31 **33** assertion groups; all exited 0 with both engines and required completion evidence. Original AC15, AC17, AC21, AC32 and AC36 each exited **2 / incomplete**, as required; no reduced subset was substituted for those original criteria.

The initial `fc7e132` gates independently passed 138 unit tests and 58 browser tests; the first correction `bda98ea` passed 144 unit tests, relevant independent regressions and native checks before the later two REDs were found. Those checkpoint passes did not override adversarial failures. Final approval uses the corrected exact SHA and final results above.

The browser report classifier was independently challenged with eight groups: empty reports, absent engine/completion evidence, skipped/retried cases, runtime failures, real assertion failures, and mixed runtime/assertion failures. Runtime/incomplete cases remain ERROR/exit 2, genuine assertion failures exit 1, and mixed failures prioritize ERROR. A runner success with no required completed cases cannot certify a criterion.

Execution qualifications: an early shared-port collision produced ERROR/exit 2; isolation resolved it. Reviewer fixture/consumption-marker mistakes, a patch application conflict and resulting zero-test runs were not counted as product failures or passing evidence. Final regressions wait for actual body/receipt consumption and assert nonempty scenarios. An install-script warning did not prevent the actual successful build. No lint command, coverage percentage, live-provider completeness test or independent performance benchmark is claimed. The owner’s reported batching speedup was not independently measured here.

## Remaining programme limits

The ten-slice, 38-check foundation goal remains active. S6 retained/final history, pinning/eviction and relevant historical criteria remain open; S8 comparison remains open; S9 prediction and timed stall/progression clauses remain open. S7 committee completeness is not certified by these guards or missing-delegate displays. The original incomplete criteria above retain their status.

S5 approval does not certify live RPC completeness/finality, whole-history zero correctness, full AC27, visual acceptance, or production deployment. Historical S1/S4 screenshot files regenerated during tests were restored to the frozen state; they are not new S5 evidence. The final implementation worktree and earlier review worktrees were left clean. The parent can use this report to accept the corrected **interim S5** revision while preserving all later-slice obligations.
