# Foundations slice 2 — independent interim lifecycle review

Reviewed exact detached commit `3d5fae608766c3c3adbea267c642cb8a7b3e45ed` against `2d4a06ff74865c46ca67f7c727faaf38ed650b91` in `/tmp/observatory-lifecycle-review-3d5fae6`. This is an interim slice review, not parent foundations acceptance or a QA ledger. The owner's mutable slice-3 tree was neither tested nor evaluated.

## Critical finding C1 — execution error masked by earlier engine assertion

`scripts/check-observatory-foundations.mjs:26-32` inspects required browser results sequentially and immediately calls `assert.fail` for the first behavioral failure. Consequently a Chromium behavioral failure prevents evaluation of a later Firefox runtime error, missing/retried result or skipped execution. The catch at line 118 returns behavioral-red exit 1 even though the required workflow has an execution error. This violates the accepted intake's check-deliverable contract: incomplete/runtime execution must return >=2.

Independent reproduction used the existing AC-4 production-page scenario and runner, changing only the test in the isolated review tree:

```ts
async ({page, browserName}) => {
  if (browserName === "chromium") expect(1).toBe(2);
  if (browserName === "firefox") throw new Error("Injected Firefox runtime failure");
  // Original scenario follows unchanged.
}
```

`rtk proxy node scripts/check-observatory-foundations.mjs AC-4 --browsers chromium,firefox` actually returned **1**, reporting only Chromium's assertion. An independent direct invocation of the same Playwright scenario with JSON reporting returned 1 and recorded exactly one completed failed result per required engine: Chromium's `expect(...).toBe(...)` and Firefox's `Error: Injected Firefox runtime failure`. Both engines ran; the semantic runner hid the second failure. The direct report is retained locally at `/tmp/observatory-lifecycle-mixed-report.json`.

Fix direction: validate every required engine's execution completeness and error classification before emitting any behavioral assertion failure. Accumulate behavioral failures, give execution errors precedence, and only return 1 when all required execution completed and failures are actual assertions. Reverify mixed assertion/runtime, assertion/skipped and assertion/retried classifications through the existing runner. Root must review the replacement commit before closing C1.

## Deterministic evidence

All commands used Node 22 via `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin` first in PATH and RTK shell execution. Baseline commands ran before fault injection.

| Command | Actual exit and evidence |
| --- | --- |
| `rtk npm ci` | 0; clean install, 48 packages |
| `rtk npm run check` | 0 |
| `rtk npm test` | 0; 14 files, 57 tests |
| `rtk npm run build` | 0; Vite production build |
| `rtk npm run test:e2e` | 0; 38 tests, Chromium and Firefox |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-4 --browsers chromium,firefox` | 0; 6 assertion groups |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-20 --browsers chromium,firefox` | 0; 2 assertion groups |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-21 --browsers chromium,firefox` | 0; 6 assertion groups |
| AC-4 command with mixed-engine fault above | 1; incorrect classification, expected >=2 |
| Direct Playwright AC-4 JSON invocation with mixed fault | 1; confirms Chromium assertion and Firefox runtime error both executed |

A first install invocation using a truncated PATH returned 127 because RTK was no longer on PATH; the corrected invocation retained PATH and the actual clean install passed. No required gate was skipped. Read-only policy/diff/spec/source inspections returned 0 except the combined initial skill read also requested absent root `AGENTS.md` and returned 1 after successfully reading both skills. Supplied AGENTS instructions and RTK instructions were applied. Own fault injection and generated tracked screenshot changes were restored; no app source mutation, commit, push or deployment occurred.

## Product lifecycle assessment and limits

The reviewed slice uses a single permitted-collection predicate for initial visibility, manual pause, pagehide and pageshow. Start/stop coordinate monitor, facade and opportunity controller; resume creates a fresh facade generation and resets auxiliary work keys. Request and post-body generation checks fence source/cache commits, aliases join cancellation, and fallback loops check generation before another read. Unit coverage exercised deliberately late alias/rights/constants/baking/eligibility/fallback bodies. Production-page coverage independently showed zero initial hidden requests, stream cancellation, manual pause persistence through visibility/BFCache events and paused local candidate inspection retaining positive observed power without new reads. No additional concrete product-lifecycle defect was found in the slice diff.

Review covered correctness, boundary/cancellation safety, regression risk, test adequacy, TypeScript conventions, scoped changes and architecture constraints against accepted intake, specification Entities and AC-4/20/21. The architecture stays within the existing domain facade and orchestration; no new generic infrastructure or library was selected. Existing context-weak cache keys, phase-zero/pinning/search/comparison and remaining foundations obligations are later-slice work and are **not certified** here. Comparison is not implemented in this exact slice; AC-21's full parent scope remains pending. Synthetic browser results establish no public-provider coverage.

Warnings: none newly actionable beyond these explicit scope limits. Optional improvements: none.

**Disposition: changes required for C1; architecture risk medium due to unreliable semantic failure classification.** Baseline product gates pass, but those passes do not close the critical runner-contract violation or grant parent GO.
