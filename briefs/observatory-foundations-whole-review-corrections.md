# Independent whole-foundations corrections review

## Correction disposition — accepted for root integration

Both HIGH findings in the historical whole-review NO-GO at `69dacc8f9d3fc0f49092174df2a3c80ad852ff16` are independently resolved by owner joint source `a2be763791ca437b5cf3fc0cb0f0ffb7ee283a4b` (parent event fix `1d9d4ca6a16ca34e2efd0f5458d76ea7f15f97de`). This disposition allows root to integrate these corrections. Final whole-foundations GO remains pending an exact root revision, integrated323-claim freshness/source equality, and my execution of all38 original commands at that revision. No QA, Astra or deployment acceptance is issued.

## Isolation and source identity

New detached checkout `/tmp/observatory-foundations-whole-review-a2be` was created from root69dacc8, then the two fixes were cherry-picked there only. Review HEAD is `e4b23f7581e6387c0213332a9add75cce35155ef`. The app/tests/checker/package/config diff against owner a2be is empty. Node v22.23.3, browser5212. New clean `npm ci` completed exit0 (48packages, zero vulnerabilities). The original69 checkout and historical NO-GO report remain preserved. Only this authorized supplement is written in root, without commit.

## Independent disposition of HIGH 1

`src/monitor/observationStore.ts:452–456` now suppresses creation of a first observed-quorum event when the reconstructed phase is uncertain. It does not delete positive phase facts, maxima, source receipts or numerical quorum state, add tombstones or change finite storage owners. Existing certain retained phases can still emit genuine crossings. The original independent replay test was reinjected unchanged from `retired-observed-quorum.patch`, with only a different test title to distinguish it from the owner's stronger committed version. It passed: one completed test,71 intentionally filtered. After151 ownership retirements and10000 unrelated raw evictions, the replay no longer appends the original event.

The owner's new committed store regression additionally verifies reconstructed power5/maximum5/threshold4/quorumObserved/uncertain, actual receipt20000/sourceB and10000raw/150history/500phase/12event bounds. The new real-page case proves the original event has left the12-event owner, ownership and raw eviction really occur, replayed5/5 power with quorum4 remains visible and the original event stays absent. Both engines passed in my full140 run.

I inspected the AC32 adjustment against the complete baseline contract. It preserves the original post-loss B target, power5, quorumObserved=true, uncertainty=true and both admission/positive receipt provenance at B; all retained sibling events remain the same immutable objects and changed-context negatives remain. A separate fresh store starts A below quorum and verifies B first-at-quorum produces its own observed-quorum event, without borrowing A's below state into a crossing. This distinguishes uncertain reconstructed numerical display from an event whose first-ever status cannot be proven; it does not waive the replay negative or introduce a specification amendment.

## Independent disposition of HIGH 2

`src/main.ts:143–177` now requires a view, renders retained pins before requiring a primary snapshot and chooses actual admitted source-local head/derived evidence when primary applied context is absent. Optional applied fields remain absent. `src/dashboardView.ts:276` no longer substitutes selected consensus level/round under Applied block labels. The independent applied-head clock requires an actual applied head and its proven compatible parameters. No new fetch, fallback, polling or fabricated monitor/domain observation is introduced.

I reinjected my exact original `autonomous-b.patch`, rather than relying only on the owner's regression. Both Chromium and Firefox passed with a read-only hook confirming actual Mainnet accepted pre600 before asserting the real production reader shows600/30000. Result JSON: `/home/mathias/whole-review-a2be-evidence/original-b.json`,2expected,0unexpected,0skipped. The stronger committed browser case also passed in both engines: B observer SmartPy/context122/target123, pre600/30000 and deficit19400, opposite phase unknown, primary applied headline and independent clock unavailable, retained pin and paused local committee inspection without additional reads.

## Own executed verification on joint source

| Command/probe | Actual result |
| --- | --- |
| `npm ci` | clean exit0 |
| `npm run check` | exit0 |
| `npm test` |260 tests/19files passed |
| `npm run test:e2e` |140 production scenarios passed, Chromium+Firefox,1.6m |
| `npm run build` |exit0,18modules,JS145.48kB/gzip41.64kB |
| `node scripts/review-bundle-verify.js` |exit0,28SHA matches,bundle1.8.0 |
| `node .harness/bin/claims-reconcile.js check` |exit0,current323 projections fresh, digest `ceb740eb6e894bacaa792db0bb79070c521775172cb2391a01c5f3bb1bed51fc` |
| Original independent retired-event test |1completed PASS, intentionally filtered other tests |
| Original independent production B test |2completed PASS, both engines |
| Original independent retained-store asymmetric numeric test |1completed PASS |
| Independent exact BigInt arithmetic/saved-origin oracle |PASS on corrected production modules |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-3` |exit0,25assertion groups, actualboth engines |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-31 --browsers chromium,firefox` |exit0,40groups |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-32 --browsers chromium,firefox` |exit0,15groups |

The retained-store numeric rerun still proves pre600/30000/quorum20000 and deficit19400 after supporting raw eviction, independently of att600/quorum600 and captured maximum committee/threshold bases. The actual reader asymmetric regression passed in both engines in my140 run. The independent BigInt oracle again verified replay/conflicts, separate phases,3/4/5 threshold boundaries, deficits/shares, safe cumulative boundaries, timing finite/boundary cases, and saved origin7000/4667/25unique/1zero arithmetic. There were no new public RPC samples.

AC3 now belongs to both browser-required and implicit-browser sets, preserving the original no-flags command and all23 native assertions while adding2 actual completed production engines. Its classifier implementation is unchanged. I inspected its complete flow and new AC3 unit cases, then injected failures into the actual production AC3 scenario: Chromium assertion+Firefox runtime returned2; reversed engines returned2; skipped Firefox completion returned2. Logs explicitly contain the runtime fault or missing completed assertion, not JSON/setup errors. Patches were restored in finally; evidence is `classifier-*.log` and `classifier-results.json` under the new evidence directory. Missing/empty/wrong-annotation reports are also exercised against the real exported classifier in the260-test suite. No runtime failure was labelled behavior RED or PASS.

## Read ledger and attribution

My complete baseline contract/code/consumer/origin reading is preserved in `briefs/observatory-foundations-whole-review.md`; those are my prior reads, not inherited owner evidence. For this correction pass I read both complete fix artifacts, both complete commit diffs including every added test/checker assertion, all corrected `src/main.ts`1–140,141–280,281–440,441–560; `observationStore.ts`1–160,161–320,321–467; `dashboardView.ts`1–160,161–189,190–230,231–270,271–351 (small rereads recovered output truncation); complete corrected checker1–105,106–199,200–330,330–390,390–450,450–520,520–619; complete checkRunner tests; new store/E2E tests in full. Unchanged accepted94FR/38AC/11intake/29clarification wording remains the baseline contract.

Complete hashes are preserved in `/home/mathias/whole-review-a2be-evidence/source-hashes.json`. Key corrected hashes: store `bea4da8aac5bf6b5b4b1d1e4c6004815f687c0017770113bbc5aefef911f5437`; main `daa5e0885ddb87e460b66f20aab0f74ff3ce561415890fc03c1e4a2094cc0d47`; renderer `23b442db253bff8fa54264f347d2d50d3c5613c2085c98bb4a7715c574d0454b`; checker `ca0782ed94d5bf91eb26b14e3cab351bb785ecb8325de4864617ac5c43fdd1db`.

Temporary tests, browser port configuration and six generated screenshots were restored. Correction checkout status is clean; exact app/tests/checker equality with a2be was rechecked. Owner260/140/38 evidence is explicitly not counted as my execution. Final whole verdict awaits exact integrated root revision and my fresh38-command pass there.
