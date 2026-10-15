# Interim architecture and correctness review — foundations slice 1

**Status: INTERIM.** Independent slice review at `eca67be81d8c264e762a1078baefc72597c372b0`, against base `5efee040fca44893d191cd156e002b9e57fbe035`. The candidate/accounting boundaries passed the scoped deterministic checks; one measured performance warning requires root disposition. Overall architecture risk: **medium**. This report makes no parent GO/COMPLETED decision and does not certify the full contract.

## Findings

**Critical:** none established within the delivered slice.

**Warning W1 — quadratic conflict detection blocks the render thread under a permitted operation count.** [phaseEvidence.ts](../src/consensus/phaseEvidence.ts), lines 63–71, compares every group with every other group. The production caller invokes it synchronously during rendering. With valid same-level/same-round operations, distinct payloads and a single known signer, the actual helper took 28 ms for 1,000 groups, 525 ms for 5,000 and 3,154 ms for 10,000 on the supplied Node 22 runtime. The last case fits the existing 10,000-operation cap. These are observed helper timings, not browser measurements; a multi-second browser input/render interruption is the consequential inference. This is new work added for conflict disclosure, rather than an unfinished cache/zero feature.

Fix direction: index payload membership by `(context, round, phase, delegate)` while grouping, then mark that delegate as conflicting in each of its groups when it occurs in more than one payload. This avoids all-pairs group comparison and preserves independent P/Q counts. Validate a large permitted operation set through the real helper and add a focused semantic conflict assertion; avoid a timing threshold that depends on the machine. Root should resolve or explicitly retain this warning before dependent evidence growth.

**Optional:** no additional finding. The domain helper is a reasonable extraction with actual production and semantic-check consumers. Its type-only NetworkData dependency creates no runtime cycle. No new generic parser, framework or harness was introduced.

## Verified boundaries

Candidate keys retain source/network/chain/block identity independently of payload grouping. H1 and H2 sharing P survive replay, remain independently selectable on production `/`, and display unknown producer with shared-payload qualification. The browser scenario separately selects Q and confirms exact unique signer power and deficit. Independent accepted/unresolved candidate products each cap at 100 by first monotonic receipt and identity ties; the operation store retains first facts and the 10,000 cap.

The numerical boundary rejects contradictory slots/delegates, unsafe cumulative power, incomplete declared total and invalid threshold. Atomic malformed aggregate/mixed-operation rejection prevents retained valid members from contributing power. Valid unknown-rights slot observations remain separately available. Calendar validation accepts explicit offsets and rejects rollover dates, missing timezone and unsafe header values. Raw RPC operation branch remains retained without a proposal-ancestry inference; shell `proto` is explicitly labelled a protocol-level counter.

The A/B regression independently passed: unpinned stream and pending receipts do not claim a requested hash; B stream evidence does not borrow A observed-head facts. Auxiliary hash-pinned requests retain their actual requested hash. The responding endpoint is captured in an immutable receipt rather than reconstructed from the current transport label. These checks establish the corrected fact carrier; they do not establish later coherent rights/cache authority.

## Independent execution

All gate and experiment shell commands used RTK. Gates ran with `PATH=/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin:/home/mathias/.cargo/bin:/usr/local/bin:/usr/bin:/bin`. The commands below ran independently before the review verdict, not from the implementation report.

| Command | Exit | Observed result |
|---|---:|---|
| `rtk npm ci` | 0 | Clean install; 48 packages, zero audit vulnerabilities. Existing allowScripts policy blocked esbuild postinstall; subsequent real build passed. |
| `rtk npm run check` | 0 | TypeScript passed. |
| `rtk npm test` | 0 | 14 files; 50 tests passed. |
| `rtk npm run build` | 0 | Vite production build passed. |
| `rtk npm run test:e2e` | 0 | 32 cases passed across Chromium and Firefox, including production selection and baseline focus/scroll/header behavior. |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-1` | 0 | 12 behavioral assertions. |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-9` | 0 | 12 behavioral assertions. |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-10` | 0 | 3 behavioral assertions. |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-11` | 0 | 9 behavioral assertions. |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-12` | 0 | 21 behavioral assertions. |

The performance experiment used `rtk proxy ... node --input-type=module -e ...` and exited 0. It created the existing Vite middleware server with `hmr:false, ws:false`, loaded `/consensus/phaseEvidence.ts` with `ssrLoadModule`, constructed N single-content operations (`level:120, round:2, slot:0`, unique payload string), called `groupsFor(ops,[{address:"D1",slot:0,power:3}],120)` and measured `performance.now()` for N=1000/5000/10000. It asserted no latency contract and changed no app files.

Evidence reads used `rtk read`, `rtk rg`, `rtk proxy sed`/`nl` and `rtk git diff/status/rev-parse`; successful except the requested `kb/architecture/README.md` path, which does not exist (exit 1). Actual doctrine is `kb/architecture.md`, which was read. Diff scope is 21 files, including plan/checkpoint/support screenshots; full changed production code and semantic support were examined. Playwright regenerated the two existing screenshot artifacts; those review-generated changes were restored to the tested HEAD. No app changes or commits were made.

## Remaining closure limits

The accepted spec's Acceptance Criteria and Entities, VALIDATED plan, project authority, TypeScript patterns and implementation checkpoint informed this scope. Context-compatible cache/chain authority, all-work lifecycle, same-observer ahead reconciliation, authentic zero/coverage, immutable events, full history/pins, searchable committee, comparison budgets and conditional timing remain assigned later slices. Existing global-head admission and context-weak rights caches are therefore not certified by this interim review. Candidate-to-group selection currently matches source/payload, so later context authority must tighten that association rather than infer compatibility from a shared payload. These are explicit prerequisites, not evidence that the current helper already satisfies them.

No gate was skipped among the five ordinary gates and five requested semantic proofs. The other semantic commands and bounded public-origin checks were outside this checkpoint and were not run. Public-provider completeness/finality is unverified. Root owns the intermediate decision and W1 disposition; final independent full-contract review/QA and maintainer publication approval remain required.
