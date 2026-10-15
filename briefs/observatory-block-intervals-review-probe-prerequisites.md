# Reviewer counterprobe prerequisite correction

**Scoped result: corrected positive probe and explicit unproven-gap negative pass in both DEV and production, Chromium and Firefox:4/4 in each mode.** This is a test correction at frozen `4cf199c58be940eed2a5de8fbd9ff3b7fce92714`, not a new candidate approval. The original QA202/218 regression result,98 NO-GO and4cf bounded source-approval reports remain unchanged.

My original counterprobe used raw `.applied-context` level108 display as the prerequisite for a later proven same-height replacement. That display can arrive before Gap108 observer derivation commits. This was a missing test prerequisite. Fresh independent investigation established that the failed Firefox DEV ordering had accepted progression105→fork108, with Gap108 helper work canceled before current-generation proof committed. It therefore did not establish a proven same-height replacement. Root assigned this owner correction after that evidence.

Read the full root reports `briefs/observatory-block-intervals-transport-qa.md` and `briefs/observatory-interval-regression-investigation.md`, complete `/var/tmp/interval-investigation-manifest.json`, exact positive/negative diagnostic sources and `investigationDiag.ts`. The investigation's causal proof and proposed prerequisite are credited to the independent investigator; the executions below are my own fresh runs. No private monitor/module instrumentation was copied or used.

## Exact correction and retained race coverage

Work remains isolated in `/var/tmp/observatory-interval-rereview-4cf`, detached at4cf. Before editing, preserved the original executed positive source at `/var/tmp/interval-review-counter-original.executed.ts` (SHA256 below). Neither original root review report was edited.

The sole positive-test delta is this assertion immediately before sending the fork:

```ts
await expect(panel).toContainText(`${next.hash} → ${following.hash}`);
```

This observes the actual accepted transition `IndependentGap105 → IndependentGap108`, after complete current observer derivation. It establishes the existing same-level-fork test prerequisite without waiting for the future fork under test. Every original assertion and action is retained. An independent string equality assertion verified that removing this one added line reproduces the entire original file exactly (exit0).

The investigator's deliberately unproven-gap negative was adopted with attribution as `tests/e2e/blockIntervals.unprovenGap.review.spec.ts`. Its diagnostic import was removed; it uses existing fetch/DOM/AbortSignal mechanisms only. It deliberately holds Gap108's observer-header JSON until cancellation, waits until that body is pending, then sends the fork. It requires actual accepted105→fork108 progression classified as skipped delivered levels, no false stale fence, and continued normal metric completion after releasing held fixed E. I additionally require the region to stop displaying `Refreshing block intervals`, proving completion rather than only a transient nonstale state. Its original substantive assertions are retained.

Both tests preserve the original proposal/vote nontriggers, unavailable committee/constants503, accepted105 refresh, duplicate suppression, held fixed-E response, exact15 metric read count and empty page-error list. Positive final state is stale retained evidence/fetch age61s; negative final state is freshly committed as-of evidence/fetch age0s. Both end with raw108/round1, demonstrating why raw display alone cannot distinguish their required behavior.

## Executed commands and evidence

Commands used existing Node22 selection, unchanged Playwright configuration, two workers, zero retries and unchanged timeouts. DEV and production runs were sequential. Each JSON contains per-engine results and inline durable `independent-main-counterexamples` attachments. No failed command occurred in this follow-up.

| Command, from isolated4cf checkout | Exit | Result |
|---|---:|---|
| `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH OBSERVATORY_TEST_PORT=5451 PLAYWRIGHT_JSON_OUTPUT_NAME=/var/tmp/interval-review-prerequisites-dev.json npm run test:e2e -- tests/e2e/blockIntervals.counter.review.spec.ts tests/e2e/blockIntervals.unprovenGap.review.spec.ts --workers=2 --reporter=json` | 0 | DEV4/4,0 skipped/flaky/unexpected;9.2s |
| `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH OBSERVATORY_TEST_PRODUCTION=1 OBSERVATORY_TEST_PORT=5452 PLAYWRIGHT_JSON_OUTPUT_NAME=/var/tmp/interval-review-prerequisites-production.json npm run test:e2e -- tests/e2e/blockIntervals.counter.review.spec.ts tests/e2e/blockIntervals.unprovenGap.review.spec.ts --workers=2 --reporter=json` | 0 | Actual built-dist preview4/4,0 skipped/flaky/unexpected;8.7s |
| `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH npm run check` | 0 | Corrected probes typecheck |
| `rtk git diff --quiet -- src package.json package-lock.json playwright.config.ts` | 0 | No production/config/dependency modification |

Additional commands all exited0: RTK-prefixed full report/manifest/source `cat` reads; `rg --files` diagnostic discovery; original-source `cp` preservation; investigator-negative `cp` into this owner's isolated checkout; source/artifact `sha256sum`; Python exact-one-line-delta assertion; Python decoding of both browser JSONs and attachment bodies. `apply_patch` changed only the two isolated probe files and added this root supplement. Existing unit suite was not rerun for this test-only prerequisite change; production source is byte-identical to the previously checked4cf source, and production was rebuilt by the configured browser command.

| Artifact | SHA256 |
|---|---|
| Original positive `/var/tmp/interval-review-counter-original.executed.ts` | `0f46a98b18268f1f8b508ead5d4e45edcbfebc43f892e2ccb74d103f77babdf8` |
| Corrected `tests/e2e/blockIntervals.counter.review.spec.ts` | `3c719fc935c4f99b1e2c684957f40b28f200b57337d0c3188d1ae20cde72a550` |
| Attributed negative `tests/e2e/blockIntervals.unprovenGap.review.spec.ts` | `0482a8f7fa996268900ad5fdfc6dda4fea3b3956e52389d751e65f12a0f36eee` |
| DEV JSON `/var/tmp/interval-review-prerequisites-dev.json` | `be719ffaae0c47cfc5020ac1328e3a82149312d9bc6c0584606410835cd0bb1b` |
| Production JSON `/var/tmp/interval-review-prerequisites-production.json` | `f86a17e9bd0c8a3d7c6b4fae52b87cff4ea3a5695d68053a80ca30448e9e66b3` |
| Frozen `src/main.ts` | `e5776adf41fce20bb50b98246d6135382266825d1293a6d00c3b333271b06f18` |
| Frozen `src/rpc/blockIntervals.ts` | `1e5242ae319008703db1f874d387f8d5595b1f48510ac493ca042385119c6f3e` |
| Served production `dist/assets/index-Cs_wBeIA.js` | `7897701de22e731d897a576a6eff7cde1549323e7d9b7727693385655ad57c61` |

No product fix is warranted by this probe race. Root can adopt the exact one-line positive prerequisite and attributed negative after reading this evidence. Root application source, other owners' worktrees, global settings, remotes and original review/QA history were not changed. No commit or publication occurred. S9 capture prerequisites and metric font correction are separate owner work; final full regression, all20 metric/original foundation/V3 interfaces, complete visual matrix, manual CHECK38 and fresh combined review/QA remain open.
