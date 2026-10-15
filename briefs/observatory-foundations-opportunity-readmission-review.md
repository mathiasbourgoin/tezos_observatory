# Independent opportunity readmission review

**Verdict: GO — approve the targeted foundation correction.** No open findings. Raw findings: `[]`.

Reviewed application source: `12555656459965996797d0a81fb9245603e4e6c8`, parent `abefce242498c5c7d445039a6f718ac61fe87891`. Independent detached worktree: `/home/mathias/.cache/observatory-review/readmission-review-1255565`. Author worktree and root application source were not modified. The author subsequently added documentation-only commit `8dc4f85`; this verdict identifies the exact reviewed application source, not a newer UI branch.

The previous immutable reconstruction at `src/monitor/observationStore.ts:299` omitted captured opportunities on every successful `tryAdmission`, and `captureHistory` then replaced the retained candidate with the incomplete record. The correction at lines 300–301 preserves only that exact record's opportunities when its prior authority is valid and complete `contextFacts` match. It does not spread stale errors or phases, acquire new rights, recalculate a timer, select an observation, or manufacture historical evidence. `contextFacts` includes source/network/chain/protocol, observer and anchor header facts, not merely the opaque key (`src/consensus/phaseEvidence.ts:21`).

I read the complete modified store and unit file, the three-line production diff and all four added test cases (`tests/unit/observationStore.test.ts:456–494`), opportunity capture validator, and admission/history/frozen paths. Scope, correctness, security, TypeScript conventions, retention bounds and spec consistency were assessed. The change implements existing FR-052/053/086/087 and AC-22/33/34 without a new API or relaxed authority contract. Different context key and different anchor timestamp under the same opaque key discard active captures while preserving old attributed history; sibling identities do not inherit captures. No new dependency, unsafe boundary widening, unbounded storage or external side effect was introduced.

## Independently executed evidence

Node 22.23.3, existing lockfile and dependencies:

- Clean `npm ci`: exit 0; raw log `/home/mathias/.cache/observatory-review/readmission-review-ci.log` (the existing esbuild lifecycle script was blocked by local npm policy; actual check/tests/build below nevertheless executed successfully).
- `npm run check`: exit 0.
- Full `npm test`: exit 0, **264 passed / 19 files**, exact committed tests.
- `npm run build`: exit 0, Vite 7.3.7, 18 transformed modules.
- `git diff --check HEAD^ HEAD`: exit 0.
- `node .harness/bin/claims-reconcile.js check --root .`: exit 0, fresh digest `ceb740eb6e894bacaa792db0bb79070c521775172cb2391a01c5f3bb1bed51fc` as printed by the tool (the authoritative full tool output remains the freshness source).
- `node scripts/review-bundle-verify.js`: exit 0, 28 files SHA-matched, bundle 1.8.0. An earlier guessed `.harness/bin/review-bundle-verify.js` path failed MODULE_NOT_FOUND/exit 1; it was not a passing preflight and was corrected to the actual repository script.

I also wrote two additional independent tests in my isolated checkout, reusing the real RPC fixture and real store, not a duplicate model. Both passed on the corrected application (2 passed, 75 unrelated tests deliberately filtered out):

1. Capture both branches, pin the candidate, introduce an uncaptured sibling, actually call `accept({...proof,snapshot})` with a complete coherent pending body, then actually call `accept({...proof,snapshotError})`. The captured immutable object, wall/monotonic as-of, frozen remaining-at-capture, original receipt and pin remain stable; the sibling remains uncaptured and only its genuine first arrival counts as newer.
2. Capture/pin, create 151 distinct payload histories to evict the selected history, then call actual `accept(proof)` again. The one frozen snapshot retains object identity and byte-identical contents; subsequent capture is refused.

I restored only the store to its parent implementation in this isolated checkout and reran independent scenario 1: **exit 1, genuine assertion failure, opportunities received undefined**. Restoring the committed correction yields both independent tests green. These tests were removed from the checkout after execution, with their source preserved at `/home/mathias/.cache/observatory-review/readmission-independent-tests.txt`; logs are `readmission-independent-red.log` and `readmission-independent-green.log` in the same evidence directory. No author/root test was edited.

Production-page contractual checks were executed independently with both required engines:

- `node scripts/check-observatory-foundations.mjs AC-22 --browsers chromium,firefox`: exit 0, 14 assertion groups.
- Same command for AC-33: exit 0, 2 groups.
- Same command for AC-34: exit 0, 33 groups.

Each reports actual production `/` completion in Chromium and Firefox. Raw logs: `/home/mathias/.cache/observatory-review/readmission-review-AC-{22,33,34}.log`. All three Playwright server settings (base URL, port and dev command with strict port) were temporarily moved to 5234, then restored. Generated S9 PNGs were restored. The review checkout is clean.

## Limits and pipeline handoff

This is the separately commissioned targeted reviewer role under the project's delegated intermediate authority. It is not the full V3 coordinator review, final UI visual acceptance, fresh-lead approval, deployment approval or new whole-foundations acceptance. I did not run all 38 foundation wrappers or a second full 140-browser suite: the changed immutable retention path is checked by full independent unit/build and the three directly relevant both-engine production contracts. The author's 140-browser log is separately attributable author evidence, not my execution. No live-chain/provider coverage is established here.

No subagent fan-out, cross-runtime invocation, review normalizer/convergence verdict or canonical foundation ledger event was emitted by this targeted specialist. Those are coordinator responsibilities for the applicable aggregate phase; fabricating them would misstate this role. No autofix, commit, push or remote mutation was performed. Separate fresh QA is still required before integration as directed by the coordinator. Open questions: none.
