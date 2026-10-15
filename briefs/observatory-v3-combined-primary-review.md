# Combined primary review — factual progress, no overall verdict

Candidate: `dc89e072406dadd3b23857f8e862f90b0da72f02`. Independent primary reviewer `/root/v3_combined_full_review`. Own detached checkout `/var/tmp/observatory-primary-review-dc89`, evidence `/var/tmp/observatory-primary-evidence-dc89`, Node22 private PATH/TMPDIR, ordinary port5855. All393 obligations and95 acceptance criteria remain in scope. Root owns canonical scope/specialist/trace/convergence mechanics; none is claimed here.

## Open finding

HIGH: `tests/e2e/v3Evidence.ts:11` eagerly scans emitted production assets during test listing. A clean documented ci→check→unit gate fails because dist does not exist. Exact path: `tests/unit/v3EvidenceContract.test.ts:34` → Playwright `--list` → `sourceBindings()` → `scripts/v3-evidence-contract.mjs:23` → ENOENT absent dist. Raw structured finding: `briefs/observatory-v3-combined-primary-findings.json`.

## Actual executions so far

- `rtk proxy node --version`: exit0, Node22 runtime (exact stdout in node.log).
- `rtk proxy node scripts/review-bundle-verify.js`: exit0.
- `rtk npm ci`: exit0 in fresh own checkout.
- `rtk npm run check`: exit0.
- `rtk npm test`: exit1,352passed/1failed of353; raw unit.log retained.
- `rtk npm run build`: exit0 after the failure, for continued source/browser investigation. This does not repair or pass the clean gate.
- Targeted post-build `npm test -- --run tests/unit/v3EvidenceContract.test.ts`: exit0,4passed, corroborating the absent-build causal prerequisite. This does not replace the clean failure.
- Ordinary two-engine regression at5855/workers2: exit0,278passed,0skipped/unexpected/flaky,errors[],657.5seconds. Raw ordinary-e2e.json and ordinary-e2e.log retained; dc89 evidence only.

Command ledger: `/var/tmp/observatory-primary-evidence-dc89/commands.jsonl`. Whole initial gate sequence stopped at actual unit failure; subsequent build/targeted/browser work is separately qualified investigation. No official5188 consumers or full visual judgment executed yet. No source clearance or overall GO. Root routed the finding to Astra; candidate source remains unchanged here.

## Source inspection in progress

Read full main assembly/lifecycle, dashboard DOM/camera and CSS, interval collector/controller, observation meaning, candidate-producer owner, inspection exports and build/browser configs. Monitor/store/networkData full files and guards/assets also read. Full test-file and remaining changed documentation inspection is still incomplete and must resume with the next frozen batch; this report does not certify completion of the whole review. This is an inventory of work, not proof all obligations pass.

The isolated prepare matrix `/var/tmp/observatory-v3-whole-review-prep/criterion-matrix.json` retains all95 criteria with pending source/execution/evidence fields and separate manual CHECK38 obligations. No missing bundle or planned command has been called PASS.

## Additional confirmed evidence-consumer finding

HIGH: `scripts/v3-evidence-contract.mjs:90` verifies declared production hashes without requiring the complete actual dist file set. The actual export accepts a synthetic loader-unit fixture baseline, accepts removal of an asset actually imported by its index, and accepts mutation of that omitted asset. This diagnostic uses only synthetic mechanical native surface inputs and no independent receipt; it is not real UI evidence or a passing production release. Exact script and result are under `/var/tmp/observatory-primary-evidence-dc89/production-inventory-probe*`. Require exhaustive production key comparison and negative omitted/extra/unbound imported-asset tests. Root's separately verified actual13-asset dc89 inventory is not contradicted by this verifier weakness.

## Bounded correction independently verified

Exact `f75cfe64c836a9e1efe620861184e75dc7bd2f2d` moves only evidence binding acquisition to actual capture execution in three helpers, plus its report. Own fresh detached checkout `/var/tmp/observatory-primary-review-f75` begins without dist. Exact ci/check/unit/build order passes; dist remains absent through all353 passing units and is emitted only at build. Raw ledger and logs: `/var/tmp/observatory-primary-evidence-f75/`. The lazy-binding finding has bounded correction evidence; dc89 failure remains retained. This does not approve f75 overall: the production inventory finding remains open, and root's separate specification reviewer reported a phase receipt/age HIGH whose evidence is not claimed as my own. No final matrix restart or whole clearance.

## AC13 proof gap

HIGH specification/evidence finding at `tests/e2e/dashboard.spec.ts:1141`: settlement timing starts at the first frame already rendering the final destination, omitting acceptance-to-render delay. The collected domain trace at1127 is not used by that assertion. A static assertion counterexample (accepted0ms, first final rendered80ms, settled240ms) passes the existing160ms assertion while violating the required240ms acceptance interval. This is a proof-coverage counterexample, not observed240ms product timing; it is explicitly labeled in the retained JSON. Require actual final coherent admission→final settled camera timestamps, both engines, and ERROR for missing evidence. The historical225.5ms report remains qualified.

## Handoff while author batches corrections

Root requested this primary reviewer return to free a slot for the mandatory architect. This is a factual progress handoff, not overall clearance or a completed whole-product review. No manual CHECK38 judgment, independent visual receipt or official foundation/V3/metric interface result is issued. Source-bound full inspection of changed product modules and the stated evidence consumers was performed; full inspection of the large modified test files and remaining change artifacts is pending. The final frozen batch must renew affected evidence and complete every remaining obligation.

Own dc89 supplementary claims check returned exit0/fresh true, digest050df4d86fc51e3551f09ecd2b698f505c70db869bb425f9d897e21fe1e1f2d8, all three projections fresh. Own production build reproduced exactly110source/4contract/13dist bindings supplied by root. The ordinary278PASS report is genuine dc89 behavior evidence, with no independent final visual interpretation attached.

Current raw primary findings:3HIGH (clean discovery, production inventory completeness, AC13 acceptance-time proof). The first has separately verified bounded correction atf75; remaining two await author correction. Root's specification phase receipt/age HIGH is separately owned and not duplicated as an own finding. Canonical normalization, scope, trace, lifecycle, specialists and convergence remain root-owned. No product edit, publication or remote mutation was performed.

Evidence retained: `/var/tmp/observatory-primary-evidence-dc89/`, `/var/tmp/observatory-primary-evidence-f75/`, own detached checkouts and the private95-criterion preparation matrix. The synthetic loader fixture and static timing counterexample are expressly diagnostics, never production renders/receipts or observed timing failures. All initial errors are preserved.

## Resumed modified-test and change-artifact inspection on f75

Completed the remaining full changed test-file reads on immutable `f75cfe64c836a9e1efe620861184e75dc7bd2f2d`: the large dashboard scenario file, V3 matrix, metric browser scenarios, and all changed interval/data/monitor/store/meaning/classifier/shared-cancellation unit tests. Completed changed author checkpoint, readiness, evidence-format, integration/migration, intake/spec-formalization/validation and inventory artifact inspection. No further confirmed finding was identified in this read pass. This adds source inspection only; the earlier execution results and failures retain their original candidate attribution.

The per-file SHA256/read-method inventory is `/var/tmp/observatory-primary-evidence-f75/read-inspection-inventory.json` (66 changed files). Generated `kb/index.md` and `kb/spec.md` were assessed through the complete normative sources and actual successful managed freshness check, not claimed as a separate line-by-line reread of generated duplicates. The context manifest was structurally inspected in full:393 unique mandatory IDs,170 foundation/153 V3/70 metric, all nonclaim fields inspected. The historical artifact reports are explicitly qualified checkpoints and do not replace final independent proof.

Final proof watchpoint: native keyboard/mouse and target geometry coverage is present, but the inspected browser sources do not explicitly exercise touch APIs. Final independent reader/native verification must establish the required usable touch activation routes; this is pending evidence, not a demonstrated product defect. The acceptance-time camera origin and phase-specific LIVE/retained/frozen receipt/age fixes remain mandatory affected probes on the next frozen batch. Full final visuals, manual CHECK38 and all95 criteria remain open. No source clearance, independent PASS receipt or overall GO is issued by this read-only completion.
