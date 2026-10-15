# Bounded independent transport/controller review

Reviewed immutable `98f7e836b0232d5bf7207fde064b06f229dd4ab3` on 15 October 2026 in independent detached worktree `/var/tmp/observatory-interval-review-98`. App baseline: `49c74935ae82f5ff0f48dc50b9ace6c76caf4dd0`; metric baseline: `dc246ecb0f90d6b36e86f5b9cde90b7b31e66831`. The six source hashes below independently match the author's handoff. No production source was edited. Only two untracked review probes were added to this review worktree; this report is the sole root-checkout mutation and is not committed.

**Bounded recommendation: changes required.** One HIGH integration finding is independently reproduced in actual production Chromium and Firefox. No whole-metric, whole-V3, release, provider-coverage or publication approval is issued.

## HIGH — current applied-head listener reads the initial network identity forever

Location: `src/main.ts:583` through `586`; dependency evidence: `src/monitor/observationStore.ts:129` through `135` and `src/monitor/networkMonitor.ts:585`.

`view.networkIdentity` is the store's original `expectedNetwork` context. `establishNetworkIdentity` assigns it only once; later accepted contexts merely check chain equality. It is not the current applied observer context. The metric listener consequently compares every new snapshot hash against the first applied hash and skips `intervals.appliedHead` after any hash change.

This prevents both eligible material applied-head refresh triggers and proven applied branch invalidations from reaching the production controller. A validated same-source/same-chain same-level hash replacement (including the navigator's `same-level-round` classification) leaves retained metric evidence nonstale and allows a pre-replacement active matching-E batch to commit. This violates FR-017/FR-021 and AC-11/AC-20, despite the controller's direct-call unit tests passing.

Independent reproduction:

1. Serve the actual built page using existing production Playwright configuration and fixture, with initial applied head `BBlock100` and a successful metric batch.
2. Advance the installed browser clock by 60 seconds, explicitly refresh Mainnet, and hold only its fixed-level E verification response.
3. Send a real `mainnet-head` stream message with hash `IndependentAppliedRoundReplacement`, level100, same predecessor, and valid round1 fitness. Existing RPC fixture routes provide the exact accepted context.
4. Assert the production page reports `Observed same-level round advance` and `.applied-context` reports level100/round1. Both assertions pass in both engines.
5. Expected: immediate sticky stale state and fencing of held attempt. Actual: `Refreshing block intervals · As-of evidence · fetch age 60s`; no stale marker.
6. Release the unchanged fixed E. Actual: a new generation0 batch commits and fetch age resets to0s; state remains `As-of evidence`.

The qualified probe exits1 with two behavioral failures, one per engine, and no page runtime errors. It checks stale state before and after releasing the matching E, retaining separate durable evidence attachments. Both engines' attachment text agrees:

```text
accepted applied: Last applied block · level 100 · round 1
before release: Refreshing block intervals · As-of evidence · fetch age 60s · selected indexed-endpoint age 62s
after release: Refresh available in 55s · As-of evidence · fetch age 0s · selected indexed-endpoint age 67s
page errors: []
```

Fix direction: derive the metric event from the current snapshot's actually validated applied observer context, matching current head/source and accepted network chain. Keep initial network identity as chain qualification only. Preserve accepted-applied authority and existing monitor semantics; do not substitute proposals, votes, selected candidates, progression labels alone or raw unproved snapshots. Keep the controller's same-source/chain comparison, deduplication and cooldown. Add production listener tests for eligible forward change, same-height changed hash/round, rollback and adjacent proven wrong-parent, plus forward gaps/source rotation/proposals/votes/repeated-publication counterexamples. No source fix was attempted by this reviewer; root and implementer received the finding immediately.

Durable reproducer: `/var/tmp/observatory-interval-review-98/tests/e2e/blockIntervals.review.spec.ts`.
Qualified JSON: `/var/tmp/interval-review-98-applied-reorg-qualified.json`.
Error contexts and attachments: `/var/tmp/observatory-interval-review-98/test-results/blockIntervals.review-inde-1034d-fences-a-matching-E-refresh-{chromium,firefox}/` and the JSON's inline attachments.

```bash
rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH OBSERVATORY_TEST_PRODUCTION=1 OBSERVATORY_TEST_PORT=5399 PLAYWRIGHT_JSON_OUTPUT_NAME=/var/tmp/interval-review-98-applied-reorg-qualified.json npm run test:e2e -- tests/e2e/blockIntervals.review.spec.ts --workers=2 --reporter=json
```

The first attempt at this new probe exited1 for a review-fixture strict-selector error: `.mainnet` matched both tab and panel. That attempt is **ERROR evidence**, not a product RED. Its separate JSON `/var/tmp/interval-review-98-applied-reorg.json` remains retained. The selector was narrowed to `.network-panel.mainnet` before the qualified behavioral run. Assertions were not weakened.

## Independent checks and useful counterexamples

Runtime was Node `v22.23.3` from `/tmp/context-review-node22-bin`; install was clean in the independent worktree. Existing lockfile installed48 packages with zero reported vulnerabilities. All commands below were executed from that worktree. Production Playwright mode explicitly builds `dist` and serves Vite preview, with isolated ports and both configured projects; none of this evidence is mislabeled development-server output.

| Command | Exit | Result |
|---|---:|---|
| `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH npm ci` | 0 | Clean install |
| `rtk npm run check` | 0 | Initial ambient-runtime typecheck; separately repeated under explicit Node22 below |
| `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH npm run check` | 0 | Node22 typecheck |
| `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH npm test` | 0 | Original319 tests,22 files passed before adding independent probes |
| `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH npm run build` | 0 | Actual production build |
| `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH OBSERVATORY_TEST_PRODUCTION=1 OBSERVATORY_TEST_PORT=5398 PLAYWRIGHT_JSON_OUTPUT_NAME=/var/tmp/interval-review-98-reader.json npm run test:e2e -- tests/e2e/blockIntervals.spec.ts --workers=2 --reporter=json` | 0 | Existing metric reader/lifecycle tests4/4, Chromium and Firefox; pageerror hooks passed |
| `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH npm test -- tests/unit/blockIntervals.review.test.ts --reporter=verbose` | 0 | First ten, then all13 new independent real-collector/controller probes passed in two actual runs |
| New production applied-replacement probe, first selector attempt | 1 | Review fixture ERROR, explained above |
| New production applied-replacement probe, corrected selector | 1 | Actual behavioral RED2/2, no runtime errors, explained above |
| `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH node --version` | 0 | v22.23.3 |

The thirteen independent Vitest probes invoke the actual production collector/controller using existing Vitest and native Response/ReadableStream/AbortController. They establish:

- Exact cutoff equality, all three query cutoffs, unrounded actual arithmetic and offset-normalized fixed-E equality while retaining original timestamp evidence.
- Shared earliest lookup can yield partial week but contradict only day; malformed nonempty hour cannot use fallback; total six reads and exactly one earliest lookup.
- Populated wrong response path at earliest or mandatory verification is shared fatal.
- Exactly16384 response bytes succeed;16385 bytes on a floor affect only that floor, with shared validation and five reads retained.
- A pre-aborted invocation starts zero reads and leaves zero timers.
- A shared floor identity contradiction cancels a concurrently held body, starts neither third floor nor verification, and leaves zero timers.
- Active controller rollback, same-height replacement and adjacent wrong-parent fence a held matching-E response, retain original batch sticky stale, drop immediate restart during cooldown and do not auto-start when time alone advances. A new explicit eligible refresh alone clears staleness.
- Concurrency remains at most two while full response bodies are held independently after fetch resolves; third-floor/verification scheduling waits for the appropriate whole read to finish.
- Unsafe or contradictory initial level metadata stays unknown despite coherent later metadata, independently retaining a valid initial synchronization timestamp and valid window means.
- Two-row responses, above-E floors and floors one millisecond newer than cutoff affect only their own window and never activate earliest fallback.

These controller positives passing while the actual main listener fails are the reason the new finding is an integration finding, not a transport implementation failure inferred from test counts. Existing319 tests also exercise ignored-abort8s fetch/body behavior,24s atomicity and exact completion boundary; this review read those tests and the production implementation but does not claim the thirteen new probes independently duplicate every such case.

Independent probe file: `/var/tmp/observatory-interval-review-98/tests/unit/blockIntervals.review.test.ts`. No dependency, generic framework, production parser or transport was introduced. The canonical library index `/home/mathias/dev/library-index/data/INDEX.md` was checked before probe work, including focused infrastructure searches; existing project Vitest/Playwright/native APIs were sufficient. No indexed library was selected or started, so there is no library selection/index-entry mutation.

## Scope, source inventory and limits

Applied `.agents/skills/reviewer/SKILL.md`, `.harness/rules/project-authority.md`, `.harness/rules/typescript-patterns.md` and `/home/mathias/.codex/RTK.md`. `.claude/patterns` is absent (discovery command exited2); the project-mandated TypeScript patterns were read instead. Read the full author transport handoff, implementer brief, active30FR/20AC/70claim contract and root integration handoff including the latest applied-only clarification. The handoff was absent at the root `roster/.../transport-review-handoff.md` path (initial bundled read exited1), so its complete author-checkout copy was read. Read KB required properties and applicable projected obligations; generated KB files were not modified.

Reviewed the complete production collector/controller and all main metric/lifecycle deltas against the immutable app baseline. Inspected actual consumers: dashboard metric rendering, monitor derive/proven progression and network identity projection, observation-store identity semantics, timestamp/block-header guards, existing collector/unit tests, production metric tests, production fixture and Playwright/package scripts. Covered correctness/races/boundaries, abuse/bounded transport, test adequacy, maintainability, TypeScript boundary conventions and additive scope. The observed failure is substantive correctness/test-coverage; no additional security or style finding is asserted.

| Frozen file | Independently computed SHA256 |
|---|---|
| `src/rpc/blockIntervals.ts` | `1e5242ae319008703db1f874d387f8d5595b1f48510ac493ca042385119c6f3e` |
| `src/main.ts` | `1bd8fb733acf819079ec0bd52ddd2353e6a4aa240dd92707ed3d705c0f1d5cf3` |
| `src/dashboardView.ts` | `f65041b1fcf51fa802afc0f442efa5f8e442b57b19e5bec68edd6e3df4c7af2a` |
| `src/dashboard.css` | `0a6a10999f2c9029ae0e8a9b10493da250bf9bc9ceafc3b47b419335c285bd97` |
| `tests/unit/blockIntervals.test.ts` | `6e8a9e8fbd841801f385a14a096c1075c593417716f26c67d6c43604d0c8e6a8` |
| `tests/e2e/blockIntervals.spec.ts` | `fb6e950e154e19c50f4fa739d2fa08de9147c19fdae139dd2d068e029acd7598` |

Read-only command audit: `rtk git rev-parse 98f7e83`, `rtk git worktree add --detach /var/tmp/observatory-interval-review-98 98f7e836b0232d5bf7207fde064b06f229dd4ab3`, `rtk git diff 49c74935ae82f5ff0f48dc50b9ace6c76caf4dd0 98f7e836b0232d5bf7207fde064b06f229dd4ab3 -- src/main.ts`, source `sha256sum`, `nl`, `git status --short`, JSON-summary Python read, and successful `cat`/`sed`/`rg` source/contract/index reads all exited0. Exceptions are the two explicitly explained missing-path discovery reads above. Mutations were the isolated worktree creation, dependency install/build artifacts, two review probe files and this report. The root application, author's worktree, Astra, remotes and global configuration were not changed.

The complete configured E2E regression, all20 official metric criterion interfaces, full state/viewport/theme/engine visual matrix, manual AC-15/CHECK38, fresh managed claims/context gates, final combined independent review and separate QA are **not run or accepted by this bounded review**. They remain author/root final-delivery work, as explicitly scoped by root. A full regression is not needed to establish or resolve the reproduced local integration defect; it remains mandatory after the fix/integration. Existing AC34/goto/225.5ms timing watchpoints and prior bounded baseline qualifications remain open whole-V3 context, not new metric passes or silently green baseline claims. All323 inherited and70 metric claims remain binding; this report changes none.

Open question: none needed to act on the HIGH finding. Re-review the author's immutable runtime fix and production applied-listener positive/negative evidence before clearing this bounded changes-required verdict. The present review remains bound only to98f7e836b0232d5bf7207fde064b06f229dd4ab3.
