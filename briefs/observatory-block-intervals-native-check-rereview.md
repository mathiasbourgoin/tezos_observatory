# Independent bounded native-check rereview —65f142c

**Original HIGH exact-cutoff coverage and MEDIUM missing-browser-summary findings are independently resolved. New MEDIUM AC15 native-zoom observation gap requires correction; bounded NO-GO for completion of the new evidence consumer.** No HIGH finding remains in this review. This does not replace or erase the original dde2145 NO-GO report, establish whole-V3 approval, or perform final QA.

Candidate: clean immutable `65f142c65d84ff5d92f784686c936f5ddd10699a`, parent dde2145, five-file delta. Own detached checkout `/var/tmp/observatory-native-rereview`; Node22/private TMPDIR `/var/tmp/observatory-native-rereview-tmp`. There is no production runtime/main/view/CSS change. Disposable mutation copy `/var/tmp/observatory-native-remutation`; no candidate product edit or author/Astra worktree read/edit was used for this review.

## Resolved original findings

- **Exact cutoff:** `tests/unit/blockIntervals.test.ts:215` now drives the real collector with S exactly C in all three windows, both UTC and equivalent +02:00 source strings. It asserts full count/span/unrounded mean, preserved original timestamp spelling and exactly five reads. I reapplied the exact `>cutoff`→`>=cutoff` mutation to actual collector line103 in the disposable copy: native46-case execution exits1,45pass/1fail, with only the new exact-cutoff case failing. Current candidate46 cases pass under official AC3. `/var/tmp/native-rereview-mutant.json` and `.stderr` retain native evidence. Thus the former all-GREEN forbidden boundary mutation is caught by an actual consumer assertion.
- **Malformed browser summaries:** runner lines38/55 require safe integer nonnegative expected/skipped/unexpected/flaky counts, total agreement and agreement with completed outcomes. My probe deletes stats, changes expected to0.5 and makes totals incoherent in the actual prior independent native28-PASS report. All now throw execution errors (wrapper mapping2), rather than returning GREEN. Actual exported classifier also reports ERROR for mixed behavioral/runtime failures in both orders; `/var/tmp/native-rereview-probes.log`.
- **Binding limitation:** runner line61 includes exact `tsconfig.json`; independently executed AC3 evidence lists its hash in `source.files`.

## New confirmed finding

**MEDIUM — missing native screen measurements satisfy the zoom evidence check.** `scripts/check-observatory-block-intervals.mjs:125` compares `native.nativeBaseline===native.nativeMeasured` without requiring either observation. A diagnostic bundle with four distinct Chromium/Firefox ×light/dark source/parent/screenshot-bound metric records, baseline width720 and measured width/documentWidth360, but both native screen observations absent, returns `{code:0,assertions:48,failures:[]}` from the actual exported `validateMetricInventory`. Undefined equals undefined, so this does not establish unchanged native screen geometry or distinguish the asserted viewport ratio from actual native zoom. Reproduction: `/var/tmp/native-rereview-probes.mjs`; log and disposable records under `/var/tmp/native-rereview-probes-UM6RGc`. These are diagnostic fixtures, expressly not real screenshots, native zoom captures, a release bundle or independent approval receipts.

Require present, valid finite screen/zoom geometry from the actual combined helper before comparing it; missing/malformed observations must throw ERROR2. Present measured dimensions that demonstrate insufficient zoom or changed screen geometry should produce behavioral RED1. Do not infer a new schema from this isolated candidate: `rg` finds no producer for nativeBaseline/nativeMeasured here, only the consumer. Root must align the final consumer with the actual shared native helper's measurement schema. The author followup is outside65f and was not reviewed.

## New AC15 consumer assessment

Runner lines99–143 now require36 unique metric records per state, exact parent engine/theme/viewport match, declared hashed sidecars, matching parent measurement/screenshot paths and screenshot SHA, matching source/contract/production fingerprints, plus all ten named additional surfaces. It exercises observed source wording, three window names, numeric/non-numeric states, typography, native target geometry, details and requested surface observables. Shared loader remains responsible for hash integrity and complete parent matrix/build validation; this isolated candidate lacks that module. The consumer alone is not a replacement for shared authority or independent visual review.

My actual-export diagnostic probes confirm correct distinction for present behavior versus binding failure: wrong source href→RED1; present zero-width geometry→RED1; changed productionCombined→ERROR2; control record→code0. Existing authored tests independently exercised font/source/coverage/parent mismatch and inventory-only rejection during my full native run. These probes are not final matrix acceptance. No source inspection or file count is being represented as a native screenshot review.

I checked RED extraction provenance rather than relying on its description: both original inventory loops from my immutable dde checkout occur byte-identically in `/var/tmp/block-intervals-metric-record-red-source.mjs`; independently computed SHA256 `e2a938a620dc5ee2560e594d88a216264c55e91692cd146a1814fc71ed5d1e20` agrees with its provenance JSON. Its exported function is actually invoked by independentMatrix. The old loops are real original consumer code, not a separately rewritten model. This verifies extraction provenance; historical author RED reports remain author evidence, not my execution.

AC15 currently remains honest **ERROR2**: I ran the guarded official interface and observed missing `scripts/v3-evidence-contract.mjs`. Evidence `/var/tmp/observatory-block-interval-check-rh5q8D/evidence.json`, log `/var/tmp/native-rereview-ac15.log`. No final bundle/native zoom/storage/system captures or independent visual receipts were supplied or fabricated. Additional state/native measurements, shared compatibility, original foundation/V3 interfaces/manualCHECK38, all20 metrics,393 claims and fresh distinct QA remain required on the final combined source.

## Actual commands/results

All shell commands used RTK. Reads/diffs/searches/provenance scripts exit0; own worktree creation/copy/mutation/probe-file preparation exit0. Full five-file delta and author followup were read. Commands use Node22 and private TMPDIR; no new library/framework/dependency was selected.

- `npm ci`: exit0; `/var/tmp/native-rereview-ci.log`.
- `npm run check`: exit0; `/var/tmp/native-rereview-check.log`.
- `npm test`: exit0,22files/343tests; `/var/tmp/native-rereview-test.log`.
- `npm run build`: exit0; `/var/tmp/native-rereview-build.log`.
- Official guarded `run(['AC-3','--browsers','chromium,firefox'])` with isolated port5840: exit0,46featurecases/163nativeassertions plus28actualdistChromium/Firefox cases; `/var/tmp/observatory-block-interval-check-ypDKvq/evidence.json`, `/var/tmp/native-rereview-ac3.log`. This exercised the actual strict classifier with fresh native reports rather than synthetic summaries alone.
- Exact actual collector mutation followed by `node node_modules/vitest/vitest.mjs run /var/tmp/observatory-native-remutation/tests/unit/blockIntervals.test.ts --reporter=json`: expected exit1,45pass/1fail; mutant report above.
- `node /var/tmp/native-rereview-probes.mjs`: exit0 for diagnostic driver, retaining each actual-export code/throw result; zoom omission unexpectedly code0, malformed summaries and mixed runtime cases correctly ERROR2, binding mismatch ERROR2, present behavior failures RED1.
- Official guarded AC15: expected exit2, missing helper, evidence above.
- Python byte-identical-loop/hash provenance check: exit0, two loops found, both identical.

Skipped explicitly:19redundant full official checks, full foundation/V3 e2e/matrix/manual gates and final combined QA; these belong to root/fresh independent QA on final combined source. Parent owns canonical phase/convergence/ledger/friction artifacts; this specialist is authorized only this new report. Original report remains unchanged. No publication/deployment action occurred.
