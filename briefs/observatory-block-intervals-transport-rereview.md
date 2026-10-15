# Bounded independent applied-listener re-review

**Recommendation: approve the bounded collector/controller/applied-listener scope at `4cf199c58be940eed2a5de8fbd9ff3b7fce92714`.** The HIGH integration finding at98 is independently corrected in both actual production engines. No additional finding was established. This is not whole-metric/V3 approval, final QA, matrix/manual acceptance, provider qualification or publication authorization.

The original review and immutable98 changes-required verdict remain unchanged in `briefs/observatory-block-intervals-transport-review.md`, with its original qualified two-engine RED. This separate round was explicitly authorized by root after the author supplied an immutable fix. Review used fresh detached worktree `/var/tmp/observatory-interval-rereview-4cf`, clean install and Node22.23.3. No production source was edited by the reviewer.

## Finding closure and source review

The complete runtime diff98→4cf is six lines in `src/main.ts:583` onward: four added, two removed. The listener now obtains current applied observer proof from `snapshot.derived.contexts`, requiring expected initialized chain, current network/source and `observedHeaderMatches` for actually supplied current-head facts. `networkIdentity` supplies only the initial chain association. The collector/controller is byte-identical to the original reviewed98 source; view/CSS are also unchanged. Other changes are README, handoff and additional tests. Playwright configuration and dependency manifests are unchanged.

Read the entire author `roster/observatory-block-intervals/applied-listener-fix.md`, complete runtime diff and current production seam. Rechecked the original reviewer skill/project authority/TypeScript obligations against the prior round and examined `NetworkData.derive`: observer contexts are stored before committee/constants qualification. The fix therefore does not introduce a committee availability prerequisite. It adds no HTTP reads or raw-head/proposal/progression fallback and changes no monitor consensus semantics. The existing source/chain-aware controller classification, cooldown/generation ownership and transport limits remain applicable.

The **unchanged original independent production probe** was copied into this new worktree and compared byte-for-byte with `cmp` (exit0). It passed in Chromium and Firefox against built production assets. Original source behavior: accepted same-level replacement leaves refresh nonstale and commits matching E. New source behavior: the same accepted round1 replacement immediately shows `Proven applied branch changed` and `Stale retained evidence`; releasing the same fixed-E response leaves the original fetch age and sticky stale state unchanged. Both engines recorded empty page-error lists before and after release. This directly closes the original HIGH; it does not rely on the author's GREEN claim or a modified assertion.

## Independent production counterexamples

A new reviewer-owned actual-main test (`tests/e2e/blockIntervals.counter.review.spec.ts` in the review worktree) passed in both engines:

1. Initial batch uses five Mainnet metric reads. After60s, validated proposal and votes appear in the production panel but initiate no metric read or invalidation.
2. RPC committee and constants reads are deliberately changed to503. An accepted current applied forward gap to105 still initiates the next five metric reads when eligible and stays nonstale. Repeating the exact applied head starts no read.
3. During a later explicitly refreshed attempt whose matching fixed-E verification is held, an accepted gap to108 stays refreshing and nonstale.
4. An accepted same-height hash replacement/round1 at108 then fences that active attempt despite unavailable committee/constants. Releasing its matching E cannot commit or clear stale state. Exactly15 metric reads were initiated across the three attempts; both engines' page-error lists were empty.

This adds independently authored consumer evidence beyond the original test and the author's counterexamples. The current author feature suite was also executed independently in both production engines, including its accepted-forward/duplicate/no-fence and unqualified raw-RPC503 counterexamples, reader/cooldown/failure states, initially-hidden/manual-pause/BFCache and the author's port of the original probe. That combined run includes two copies of the original reorg scenario (reviewer's unchanged file and author's port); its24 passes are not24 unique behaviors.

## Commands and results

All commands ran in `/var/tmp/observatory-interval-rereview-4cf` unless explicitly creating or copying that worktree. Every shell command was RTK-prefixed. Node path was explicitly selected for install/check/unit/build/Playwright.

| Command | Exit | Evidence |
|---|---:|---|
| `rtk git worktree add --detach /var/tmp/observatory-interval-rereview-4cf 4cf199c58be940eed2a5de8fbd9ff3b7fce92714` | 0 | Separate immutable source checkout |
| `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH npm ci` | 0 | Clean48-package install; zero reported vulnerabilities |
| `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH npm run check` | 0 | Typecheck |
| `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH npm test` | 0 | 346 tests/23 files:333 authored tests plus the same13 independent real-consumer probes copied unchanged from the prior round |
| `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH npm run build` | 0 | Production build |
| `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH OBSERVATORY_TEST_PRODUCTION=1 OBSERVATORY_TEST_PORT=5401 PLAYWRIGHT_JSON_OUTPUT_NAME=/var/tmp/interval-rereview-4cf-original.json npm run test:e2e -- tests/e2e/blockIntervals.review.spec.ts tests/e2e/blockIntervals.spec.ts --workers=2 --reporter=json` | 0 | 24/24 production passes; Chromium+Firefox; zero skipped/flaky/unexpected |
| `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH OBSERVATORY_TEST_PRODUCTION=1 OBSERVATORY_TEST_PORT=5402 PLAYWRIGHT_JSON_OUTPUT_NAME=/var/tmp/interval-rereview-4cf-counters.json npm run test:e2e -- tests/e2e/blockIntervals.counter.review.spec.ts --workers=2 --reporter=json` | 0 | 2/2 new actual-main counterexample passes; Chromium+Firefox; zero skipped/flaky/unexpected |

Additional read/copy/audit commands all exited0: `rtk proxy cat /var/tmp/observatory-block-intervals/roster/observatory-block-intervals/applied-listener-fix.md`; `rtk git diff 98f7e836b0232d5bf7207fde064b06f229dd4ab3 4cf199c58be940eed2a5de8fbd9ff3b7fce92714 -- src/main.ts src/rpc/blockIntervals.ts`; `rtk git diff --stat` with those revisions; `rtk proxy rg` over actual listener tests and `NetworkData` context creation; `rtk proxy sed -n '100,120p' tests/e2e/blockIntervals.spec.ts`; `rtk proxy sed -n '383,410p' src/rpc/networkData.ts`; two `rtk proxy cp` commands copying the prior reviewer unit/E2E probes into corresponding new-worktree test directories; two corresponding `rtk proxy cmp` commands confirming unchanged probe contents; source/asset `rtk proxy sha256sum`; Python JSON summary/attachment decoding. No command failed in this round. `apply_patch` added the new independent E2E probe and this root report only.

The same13 real-collector/controller probes again cover exact cutoff and normalized equality, dependent earliest contradictions, malformed floor exclusion, shared URL identity failures, exact16384/16385 body caps, pre-abort cleanup, shared-fatal cancellation, full streamed-body concurrency, metadata independence, floor selection assertions and active controller rollback/replacement/adjacent-parent fencing. Their implementation is unchanged from the original review. The canonical library index was checked in that round; no new infrastructure/library/dependency was introduced in this round.

## Durable evidence and source inventory

JSON files above include project names, actual results and inline durable JSON attachments. The original probe's attachments in each engine show:

```text
applied: level100 / round1
before release: Refresh available in60s · Stale retained evidence · fetch age60s
after release:  Refresh available in60s · Stale retained evidence · fetch age60s
reason: Proven applied branch changed; retained indexed evidence is stale
page errors: []
```

The new counterexample attachments show final level108/round1,15 reads, retained fetch age61s, sticky stale reason and `errors:[]` in both engines. These are actual source-built production runs: the configured `OBSERVATORY_TEST_PRODUCTION=1` path rebuilt `dist` and served Vite preview, with at most two workers per command and isolated ports5401/5402. No development-server or fake-browser result is substituted.

| Item | SHA256 |
|---|---|
| `src/main.ts` | `e5776adf41fce20bb50b98246d6135382266825d1293a6d00c3b333271b06f18` |
| `src/rpc/blockIntervals.ts` | `1e5242ae319008703db1f874d387f8d5595b1f48510ac493ca042385119c6f3e` |
| `src/dashboardView.ts` | `f65041b1fcf51fa802afc0f442efa5f8e442b57b19e5bec68edd6e3df4c7af2a` |
| `src/dashboard.css` | `0a6a10999f2c9029ae0e8a9b10493da250bf9bc9ceafc3b47b419335c285bd97` |
| unchanged reviewer unit probe | `a9a8c73d79cfccc744d0335b850c64354f0154a42080edb89c404cfb1adce99c` |
| unchanged reviewer original E2E probe | `6da6ce0586952035ffa500d0f88df06d69f3599d2ebf76e86a0bfc2cc176de28` |
| served build `dist/assets/index-Cs_wBeIA.js` | `7897701de22e731d897a576a6eff7cde1549323e7d9b7727693385655ad57c61` |
| served build `dist/assets/index-BtJToDP8.css` | `7de081ff7d21fb919784e7ee9e47c07db2d44cd9a684bc3ef144573c4c489a55` |

## Boundary of this approval

All original30FR/20AC/70metric obligations and323 inherited claims remain binding. The complete configured application E2E regression, all20 official metric interfaces,38 foundation and37 executable V3 interfaces, independent manual CHECK38, full state/viewport/theme/engine/composed-contrast matrix, managed claims/context refresh, final combined review and separate QA were not run by this bounded re-review and remain mandatory before final delivery. Original AC34/goto/225.5ms timing watchpoints and prior qualified baseline evidence are not silently accepted here. No generated KB file, root application source, author checkout, Astra checkout, remote or global configuration was changed.

Open questions: none within the bounded fix. Route the immutable corrected runtime onward through the remaining combined implementation/review/QA gates. This approval is bound to4cf199c58be940eed2a5de8fbd9ff3b7fce92714 and does not alter the original98 NO-GO evidence.
