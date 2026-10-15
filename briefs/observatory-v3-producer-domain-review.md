# Focused independent producer review

Initial reviewed source: `539484ef01c68d763e2a93d05538e4daf0048828`; final returning-review source: **`a97efb3f56c8b76d2ce1e88d1c05719a3e37992d`**, detached checkout `/tmp/observatory-producer-review-539484e`. Author: Astra; reviewer: separate `v3_producer_domain_review` agent. **Final focused recommendation: approve; TS-01 corrected and independently reverified below.** This report covers the producer extension and its integration boundaries. It does not approve the whole V3, visual design, 37 criteria, manual CHECK-38, publication, or deployment.

## Findings

**MEDIUM — TS-01: new non-null assertions bypass the mandated narrowing convention.** `src/rpc/candidateProducer.ts:46`, `:63`, `:65`, `:67`, `:69` use `admission!`, `candidate!`, and iterator `.value!`. The project TypeScript rules expressly identify non-null assertions as an antipattern; the reviewer skill rates language-pattern violations medium by default. The current preceding boolean checks make these accesses plausible, and I have not reproduced a runtime failure from them. However, the compiler cannot establish the invariant across the boolean `eligible` method; future changes to eligibility can silently separate use from its prerequisite. Narrow the admitted/candidate record using an explicit type predicate or local guarded bindings, and handle the oldest cache key with an explicit undefined guard. This is a small typed correction, without changing the acquisition policy. Root may explicitly accept a recorded exception under project authority; this report does not silently waive the rule.

No independently reproduced domain correctness, provenance, lifecycle, request-budget, retention, or payload-transfer defect was found in this snapshot. This absence is limited to the inspected boundaries and executed scenarios below.

## Scope and inspected contracts

Read the complete root producer-extension decision, including the refinement rejecting a permanent session-wide 100-attempt cap; the prior independent producer contract investigation; V3 AC-01/09; foundation FR-003; reviewer, project authority, and TypeScript rules. The canonical library index was consulted; no dependency, infrastructure library, generic harness, application edit, or upstream change was introduced by this review. Scratch probes reuse the installed Vitest/Playwright and existing production fixture.

Inspected the entire new `src/rpc/candidateProducer.ts`, the complete new metadata transport method and changed `requestObserved` boundary, the changed admission/lifecycle/producer hooks in `networkMonitor.ts` and `main.ts`, and producer capture/readmission/history ownership in `observationStore.ts`. Supporting original admission, context authorization, epoch, retention, lifecycle, and rendering paths were read to determine whether the new hooks bypass them. UI composition and unrelated V3 navigation work in the same commit were not accepted by this focused review.

The exact foundation correction `12555656459965996797d0a81fb9245603e4e6c8` is present: opportunities survive only exact context-facts readmission when the prior record was not invalid. The new producer field follows the same condition. The original foundation fix's independent QA remains separately owned by root.

## Evidence and implications

- The class admits only from already admitted records and a current authorized epoch. Watermarks are source/chain qualified and monotone; only a proven higher observer level retires older attempt windows. Successor attempts survive becoming current. Attempts/cache are separately capped at 100; one flight and one latest queued destination are retained. Dropped queued destinations consume their attempt rather than being retried. Saturation is temporary and the rendered note identifies it. Cache eviction cannot reopen identities in the retained attempt window; lower-level replay cannot reopen retired windows.
- Metadata is requested once from the candidate source using the immutable hash, with redirects rejected and an eight-second body-inclusive race. Optional failure does not gate observation/vote admission. `baker` is returned; `proposer` is separately validated and never substituted. Unsupported protocol, missing/malformed fields, level/protocol/hash mismatch, failed acquisition, cancellation, or lost authority remains unknown.
- Metadata evidence retains its own receipt time and requested hash. Assembly adds the independently authorized chain/context/protocol without replacing the candidate receipt. Store capture checks exact identity/hash/source/network/chain/context/protocol plus generation token. Matching retained histories/pins can enrich; history-evicted frozen pin copies are excluded as enrichment owners. Same payload alone never selects another candidate's producer.
- Producer acquisition hooks occur after source admission events, including independently reconciled B contexts; the UI only presents captured facts. Stop/visibility/pagehide use the existing collection lifecycle and abort/fence active work. The comparison workflow and B-context reconciliation implementation/budgets were not changed by the extension.

I independently checked the pinned official [shell metadata encoding and endpoint](https://github.com/tezos/tezos-mirror/blob/5c73fc9ae945fa222307de01c22403526ce197ee/src/lib_shell_services/block_services.ml#L1180) and [Ushuaia metadata encoding](https://github.com/tezos/tezos-mirror/blob/5c73fc9ae945fa222307de01c22403526ce197ee/src/proto_025_PsUshuai/lib_protocol/apply_results.ml#L2606). They support the flat protocol/baker/proposer/level-info response shape used by the positive tests. These were source reads, not live RPC probes. No public provider coverage or availability is claimed.

## Executed verification

All commands below used Node 22.23.3 via `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin` prepended to the actual host PATH and were prefixed with `rtk proxy`. No source files or committed tests were modified.

| Command / scope | Observed result |
| --- | --- |
| `npm ci` | exit 0; 48 packages, zero reported vulnerabilities; npm reported the existing esbuild postinstall policy block, subsequent build ran successfully |
| `npm run check` | exit 0 |
| `npm test` on unmodified checkpoint tests | exit 0; 279 tests, 20 files, 2.22 s |
| `npm run build` | exit 0; Vite build, 287 ms |
| `OBSERVATORY_TEST_PORT=5237 npx playwright test --grep 'S9 same-height competing\|V3 AC-09' --repeat-each 3` | exit 0; 12/12 actual production-page tests, Chromium and Firefox, 3.9 s |
| `npx vitest run ../tests/unit/independentProducer.review.test.ts` final probe version | exit 0; 10/10 independent scratch tests, 9.05 s |
| `OBSERVATORY_TEST_PORT=5237 npx playwright test producer.review.spec.ts --workers 2` | exit 0; 4/4 independent actual production-page tests, Chromium and Firefox, 3.2 s |
| `git diff --check` | exit 0 |
| `git diff --exit-code 539484ef01c68d763e2a93d05538e4daf0048828 -- src tests/unit/observationStore.test.ts tests/unit/networkData.test.ts tests/e2e/dashboard.spec.ts` | exit 0; checkpoint application and existing targeted tests remain identical |

The independent domain probes use actual `NetworkData.reconcile`, `ObservationStore.accept`, metadata transport and capture, rather than injecting a finished producer view. They establish separate sibling baker/proposer roles and metadata receipts, unchanged original receipt, retained pin enrichment, no same-payload transfer, duplicate suppression, successor-to-current attempt preservation, 100-attempt saturation followed by resumed acquisition after proven advancement, 132 further real admitted context advances, bounded cache, rollback/unseen-old rejection, six malformed/unsupported responses remaining unknown without retry, actual abort-ignoring response-body timeout after approximately eight seconds, and stop/resume fencing of a late body without retry. The browser probes independently establish shared-payload H1 unavailable versus H2 positive without transfer; local paused inspection/theme causes zero additional metadata reads; hidden/restore cancels a held body, does not retry the duplicate, and still admits a new legitimate candidate's positive receipt.

Scratch evidence is preserved at `/home/mathias/.cache/observatory-review/producer-539484e-evidence/`: `independentProducer.review.test.ts`, `producer.review.spec.ts`, and SHA-256 hashes of the five reviewed application files. The two scratch test files also remain untracked in the isolated review checkout. They are review probes, not proposed project test additions.

Honest non-passing/tooling history: the first eight-probe run exited 1 with two reviewer-fixture setup failures (a synthetic sibling hash was not registered in the fixture header map; a replay fixture supplied the old observer generation rather than the production reconciler's refreshed generation). Six cases passed in that run. After correcting only the scratch fixture, eight passed; adding real-deadline and stop/resume probes produced the final ten passes above. These initial setup failures are not reported as product regression REDs. One inspection `cat tests/candidateProducer.test.ts` exited 1 because the existing producer tests live in `tests/unit/observationStore.test.ts`; the actual test file was then read. A bounded search piped to `head` emitted the RTK broken-pipe diagnostic after printing the requested matches; it was not a product gate. Other source/contract inspection and worktree/copy/hash commands completed successfully.

Not executed in this focused review: full browser suite; all 38 foundation criterion commands; whole-V3 criterion runner; final viewport/theme/motion/accessibility matrix; manual CHECK-38; fresh whole-epic review/QA; release checks. No separate lint script exists and none is claimed. Existing author tests for one-flight/latest-queue saturation, source/chain mismatch, retained/frozen capture, reorg, pause, timeout wiring and redirects were read and rerun as part of the 279-test suite; they are distinguished from the independently authored probes above.

## Recommendation

Initial-source recommendation was **changes required for TS-01**, or explicit root acceptance of a narrow documented TypeScript-pattern exception. This is superseded by the returning-review closure below. No additional producer-domain blocker was found. This focused report alone cannot establish full V3 GO.

Open questions: none about the agreed domain policy. Metadata availability for validated but unstored candidates remains intentionally unknown, with no retry or polling.

## Returning review: TS-01 closed, focused approve

Astra supplied clean commit `a97efb3f56c8b76d2ce1e88d1c05719a3e37992d`. I independently inspected the entire delta from `539484e`: only `src/rpc/candidateProducer.ts` changed, six added and six removed lines. Context/candidate are now explicitly guarded and captured before asynchronous use; cache eviction guards the optional iterator value. No non-null assertions remain in that module. The correction preserves the acquisition policy and closes TS-01 without an exception.

I switched the same detached review checkout to exact `a97efb3` and reran my own gates, rather than accepting the author's evidence:

- `npm run check`: exit 0.
- `npm test`: exit 0, **289 tests across 21 files** in 9.17 s: the checkpoint's 279 plus the ten untracked independent probes, including the actual eight-second response-body deadline.
- `npm run build`: exit 0, 294 ms.
- `OBSERVATORY_TEST_PORT=5237 npx playwright test --grep 'S9 same-height competing\|V3 AC-09\|independent producer' --workers 2`: exit 0, **8/8 actual production-page tests**, both engines, 4.7 s. These are four existing targeted instances and four independent page probes; the initial-source three repetitions remain separately attributed to `539484e` above.
- `git diff --exit-code a97efb3f56c8b76d2ce1e88d1c05719a3e37992d -- src tests/unit/observationStore.test.ts tests/unit/networkData.test.ts tests/e2e/dashboard.spec.ts`: exit 0. Application and existing test files are unchanged from the final commit; only my two untracked probe files are additional.
- `git diff --check`: exit 0.

No second clean install was necessary: only the single TypeScript module changed and dependency inputs remain identical. Final source hashes are separately preserved as `source-a97efb3-sha256.json` beside the initial-source hashes and scratch probes. A report-edit patch initially failed its exact-text match and was corrected; it changed no source and was not a product gate.

**Final focused recommendation: approve the producer-domain extension at exact `a97efb3f56c8b76d2ce1e88d1c05719a3e37992d`. No open focused finding.** Full V3 acceptance, the final visual matrix and whole-epic review/QA remain outstanding and are explicitly outside this recommendation.
