# Slice 2 C1 — independent correction disposition

**C1 closed for exact commit `35ff4557d99b7c687ce95355e7ae7859e1c12944`.** This scoped disposition does not accept the parent foundations implementation or issue a QA ledger/GO. The independently reviewed baseline was `3d5fae608766c3c3adbea267c642cb8a7b3e45ed`; review and fault injection used only the detached `/tmp/observatory-lifecycle-review-3d5fae6` worktree. The owner's mutable tree and root app sources were untouched.

The full fix diff and seven real-classifier regressions were inspected. `classifyBrowserReport` now accumulates matcher failures and inspects every required engine before throwing an AssertionError. Missing, duplicate, skipped, retried, timed-out, interrupted and inconsistent results throw execution errors. A passed browser result also requires its scenario completion annotation and an empty error list; unexpected runner status cannot masquerade as success or behavioral red. Actual product source is unchanged by this fix.

## Actual independent evidence

All runs used Node 22 first in PATH and RTK. Commands completed sequentially before any dependent fault mutation.

| Command/scenario | Actual exit |
| --- | --- |
| `rtk npm test -- tests/unit/checkRunner.test.ts` | 0; seven regressions pass, including mixed runtime/assertion in both orders, missing/skipped/retry/incomplete/zero-assertion/error-status cases |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-4 --browsers chromium,firefox` | 0; six assertion groups |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-20 --browsers chromium,firefox` | 0; two assertion groups |
| Actual AC-4 with Chromium `expect(1).toBe(2)` and Firefox `throw new Error("Independent Firefox runtime failure")` | **2**, correctly prioritizing Firefox execution failure after Chromium assertion |
| Actual AC-4 with Chromium `expect(1).toBe(2)` only, Firefox original scenario unchanged | **1**, correctly reporting a real behavioral assertion failure |

The two actual fault cases changed only the AC-4 test fixture in this isolated worktree. They exercised the existing Playwright child and production semantic runner; no substitute classifier or generic test infrastructure was used. The prior mixed-engine reproduction returned 1; the same independent injection now returns 2. The test was restored after completion. `rtk git status --short` returned 0 with a clean tree. The exact HEAD and restored worktree hashes match:

| File | Git blob SHA |
| --- | --- |
| `scripts/check-observatory-foundations.mjs` | `6327e0012b56facc409c9f59c06bdfb5e4914fb5` |
| `tests/e2e/dashboard.spec.ts` | `c8ab68908ff7e09fc234b0df906ff0151824d9a6` |
| `tests/unit/checkRunner.test.ts` | `5ceacfddbba5da5672c6021d3f2bcba740dd6fb3` |

Read-only diff/hash inspections, checkout and own-file restore returned 0. No additional broad gates were repeated: unchanged product source already had independent Node 22 check/build, 57 unit tests and 38 Chromium/Firefox cases passing on the baseline. No commit, push, deployment or root/owner app mutation occurred.

## Remaining semantic scope warning

**AC-21 is not certified.** Its accepted criterion explicitly includes cancellation of comparison responses, but comparison is not implemented at this exact slice. Its existing partial production test plus alias/eligibility assertions cannot establish the entire criterion even when the command returns 0. Remove AC-21 from the implemented semantic set until the comparison slice supplies its complete scenario; root will independently inspect and execute that guard correction on its later exact SHA. The earlier review's AC-21 exit 0 records only what actually ran, not full acceptance.

No new critical runner finding remains for C1. Full cache-context, phase-zero, history/pinning, search, comparison, events, timing and other acceptance obligations remain in the ten-slice parent task, including all 38 complete semantic checks. Public-provider coverage remains outside synthetic evidence. Scope-specific recommendation: accept the C1 correction; retain the AC-21 scope warning until its guard correction and full implementation are verified.

## Final interim guard checkpoint

Independently inspected the complete follow-up diff and checked out exact `9e783f66b9f07201f187081f456aa694aae82c76` in the same clean isolated tree. Relative to `35ff4557d99b7c687ce95355e7ae7859e1c12944`, it changes only the AC-21 implemented-set guard and two implementation evidence artifacts; production code and the reviewed C1 classifier are unchanged. The actual Node 22 command `rtk proxy node scripts/check-observatory-foundations.mjs AC-21 --browsers chromium,firefox` returned **2**, reporting incomplete execution and listing only AC-1/9/10/11/12/4/20 as implemented. The guard therefore prevents partial lifecycle coverage from being reported as complete AC-21 acceptance.

Accept this final interim guard checkpoint. C1 closure and independently measured AC-4/20 proof at `35ff4557d99b7c687ce95355e7ae7859e1c12944` remain valid; AC-21 is unavailable pending complete comparison cancellation coverage. No broad gates or fault injections were repeated, and no parent GO or full foundations acceptance is issued.
