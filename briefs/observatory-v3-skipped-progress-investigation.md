# Investigation — V3 skipped delivered progression

**Date:** 2026-10-15T07:53:00Z  
**Status:** HYPOTHESES IN PROGRESS — original intermittent failure not reproduced; not closed.  
**Candidate:** `b68953928c0202f387e2bccd16fb7ab3d75ff254`, detached `/var/tmp/observatory-skipped-investigation`. Its application source is byte-identical to failing QA candidate `6b84225097035528bf4af96856b1661e5197a68e` (`git diff … -- src` empty). No product source, original assertions, timeouts or production fixture changed in this investigation.

## Symptom and authoritative distinction

Fresh QA's original full production dashboard run was164/168; Firefox foundation AC34 reached applied104 after100/r3→101→fork101 but omitted `Skipped delivered levels; intermediate path unobserved`, retained the prior same-height-reorg notice, and showed selected context unavailable. This historical failure remains authoritative evidence. Its saved DOM does **not** include actual committed derived contexts, pending request ownership, returned context errors or proven head at failure, so it cannot identify why exact104 proof failed to arrive.

The empirical discriminator is **committed source/chain-qualified context for104**, rather than raw applied104, committee availability or a timer. On the passing trace the monitor first emits raw applied104 while proven head and last progression are still fork101. A subsequent actual `derive` returns contexts104/105 with observer104 and no errors; monitor then emits `progression.kind=skipped-levels`, proven head104. Thus a single applied-level assertion establishes receipt but does not establish completed contextual qualification.

## Executed reproduction and controls

All browser commands used PATH `/tmp/context-review-node22-bin:$PATH`, actual production build/preview on isolated port5411, real Chromium and Firefox, at most two workers, no skipped tests/retries. Each existing Playwright web-server command rebuilt actual dist. These are direct investigation runs with raw process exit codes, not standalone semantic CHECK verdicts.

| Command after `npm run test:e2e --` | Exit | Actual result |
| --- | --- | --- |
| Original `tests/e2e/dashboard.spec.ts --grep "foundations AC-34" --repeat-each 12 --workers=2 --reporter=json` |0|24/24,12 per engine |
| Own unchanged-assertion diagnostic `tests/e2e/skipDiagnostic.spec.ts --repeat-each 20 --workers=2 --reporter=json` |0|40/40,20 per engine |
| Own full dashboard diagnostic copy `tests/e2e/skipBroadDiagnostic.spec.ts --workers=2 --reporter=json` |0|168/168, all original dashboard assertions retained; AC34 only adds runtime tracing |
| Separate negative control `tests/e2e/skipMissingIdentityControl.spec.ts --workers=2 --reporter=json` |0|2/2; deliberately unavailable exact104 header, asserts qualification remains unknown |

Own clean `npm ci` exit0. Build/start succeeded inside every browser run. No separate unit/typecheck was needed for this read-only investigation, and none is claimed. Application source stayed unchanged before/after. Existing tests updated two tracked screenshot outputs in the owned checkout; these are not new release assets.

The diagnostic duplicates import the real compiled inspection entry and wrap the **same production classes**. They record real monitor state snapshots, proven head/progression, actual NetworkData derive maps/errors and context failures. They do not replace computation, sleep between arrivals, extend a timeout or manufacture a receipt. Instrumentation itself can change scheduling, so its passing repetitions cannot erase the original failure. The broad copy mirrors original run breadth but not the original machine's complete concurrent workload. Host load alone is not a causal finding.

The negative control overrides only the exact `ObservedTiming104/header` response with503. Both actual engines returned empty derived context maps and explicit `Target context104/105: TzKT RPC HTTP503` errors; raw applied104 remained visible, last qualified progression remained the earlier reorg and current selection was unavailable. This **reproduces the outward state by an intentional different input**, not the original intermittent cause. It proves why forcing the skipped label from raw levels would fabricate proof. The original ordinary AC34 assertions remain intact in its original file and both diagnostic copies.

Durable JSON reports: `/var/tmp/skipped-investigation-{initial,diagnostic,broad,missing-identity}.json`; corresponding `.err` files; clean install `/var/tmp/skipped-investigation-ci.log`. Decoded, durable attachment JSON: `/var/tmp/skipped-progress-evidence/trace-000.json` through`trace-039.json`, `broad-trace-000.json`/`001`, and `missing-trace-000.json`/`001`. `manifest.json` in that evidence directory binds full candidate, source/test/dist hashes, commands, actual exits and counts. Diagnostic scripts remain in the isolated checkout, not the application or root tree.

## Tested hypotheses

| # | Hypothesis | Result and grounding |
| --- | --- | --- |
|H1|104 exact observer context was pending or rejected when the expectation expired.|**Open for original failure.** This is consistent with the observed unavailable selection and old progression; intentional missing-header control demonstrates this mechanism. Original failing runtime state is missing. `src/rpc/networkData.ts:390–396` inserts context only after `targetContext` succeeds, and retains errors.|
|H2|A committee/constants failure alone suppresses otherwise qualified progression.|**Refuted as the general mechanism.** Context maps are populated before committee/constants work (`networkData.ts:391–393`); monitor records progression from those contexts independently of rights (`networkMonitor.ts:356–359`). Actual original AC34's subsequent missing-constants case still emits the new qualified same-height-reorg with both constants requests503, in all40 decoded traces. This does not prove which input failed historically.|
|H3|The presentation drops a committed `skipped-levels` discriminator.|**Not observed; simple mapping-error hypothesis refuted.** Actual normal diagnostic traces carry committed `skipped-levels` through to the asserted DOM on both engines; `src/main.ts:450–451` maps that discriminator directly to the expected exact wording. No original failing state capture proves the discriminator had committed.|
|H4|A lifecycle/head generation cancellation or source/chain mismatch prevented104 qualification.|**Open, not attributed.** `headGeneration.ts:30–36,102–116` cancels obsolete owners and refuses stale commits; `networkMonitor.ts:380–384` requires same source/chain. No original request/derived trace establishes cancellation, mismatch or a cache-patch regression. Focused and full passing samples show neither under their tested schedule.|

## Root cause, introduction and impact

**Original root cause remains undetermined.** The scope is asynchronous source-qualified progress admission and its fixture scheduling, not a demonstrated classifier arithmetic or CSS issue. The generic `Incomplete committee total` display comes from empty/unusable numerical authority (`src/consensus/phaseEvidence.ts:34`, `src/main.ts:331`) and cannot identify a network/context failure by itself.

`recordProvenProgress` classification dates to `dccf71f`, per blame, but this is the introduction of the legitimate mechanism, **not proof of introduction of the intermittent defect**. No first-bad commit is claimed. Source bytes matching6b establish that the candidate reproductions test the same product implementation, not that its later test-only changes explain the earlier failure.

## Next diagnostic plan; no product fix authorized by this finding

1. Keep original foundation AC34 and all its qualified-label assertions unchanged and active in the final immutable combined suite.
2. A bounded test-infrastructure improvement is passive failure-only attachment capture in the final original test (no new product behavior, waits or changed assertions). Carry the diagnostic capture into a further original failing run if it recurs: state snapshot/derived maps/errors, proven head, source/chain identity, generation and AbortSignal ownership, request claim/header/body/settlement timing, and actual progression at failure. Preserve decoded attachments even when a later scenario overwrites `test-results`.
3. If raw104 arrives but derivation is merely pending, identify the precise outstanding original request and whether failure is infrastructure latency or a fixture precondition; do not increase the timeout without that evidence.
4. If exact104 context rejects, investigate the captured exception and immutable header/context facts; preserve unknown authority rather than force labels from raw stream values.
5. Only after a causal discriminator is reproduced should root select a Fast `implement → independent review → QA` correction. No product patch, test-label removal, added wait, timeout relaxation, contract change or release GO follows from this investigation.

Potential regression tests, contingent on the cause: exact-header body completing after a newer generation; valid observer proof with unavailable committee/constants still qualifying progression; invalid/missing observer identity retaining old attributed progression; source switch/chain mismatch never inventing skipped transitions. Current missing-identity control already observes the latter boundary in actual production.

KB handoff to root: persist the proven distinction between raw applied receipt and committed source-qualified progression; preserve the refuted committee-only/mapping hypotheses and the original unknown condition. This report is the durable evidence handoff and does not hand-edit generated KB files. Release status remains open pending final combined independent QA and all other required V3 gates.
