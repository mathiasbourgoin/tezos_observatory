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

Read full main assembly/lifecycle, dashboard DOM/camera and CSS, interval collector/controller, observation meaning, candidate-producer owner, inspection exports and build/browser configs. Monitor/store/networkData diff reviewed; full-file remainder and regression/test/evidence consumer inspection continue. This is an inventory of work, not proof all obligations pass.

The isolated prepare matrix `/var/tmp/observatory-v3-whole-review-prep/criterion-matrix.json` retains all95 criteria with pending source/execution/evidence fields and separate manual CHECK38 obligations. No missing bundle or planned command has been called PASS.

## Additional confirmed evidence-consumer finding

HIGH: `scripts/v3-evidence-contract.mjs:90` verifies declared production hashes without requiring the complete actual dist file set. The actual export accepts a synthetic loader-unit fixture baseline, accepts removal of an asset actually imported by its index, and accepts mutation of that omitted asset. This diagnostic uses only synthetic mechanical native surface inputs and no independent receipt; it is not real UI evidence or a passing production release. Exact script and result are under `/var/tmp/observatory-primary-evidence-dc89/production-inventory-probe*`. Require exhaustive production key comparison and negative omitted/extra/unbound imported-asset tests. Root's separately verified actual13-asset dc89 inventory is not contradicted by this verifier weakness.

## Bounded correction independently verified

Exact `f75cfe64c836a9e1efe620861184e75dc7bd2f2d` moves only evidence binding acquisition to actual capture execution in three helpers, plus its report. Own fresh detached checkout `/var/tmp/observatory-primary-review-f75` begins without dist. Exact ci/check/unit/build order passes; dist remains absent through all353 passing units and is emitted only at build. Raw ledger and logs: `/var/tmp/observatory-primary-evidence-f75/`. The lazy-binding finding has bounded correction evidence; dc89 failure remains retained. This does not approve f75 overall: the production inventory finding remains open, and root's separate specification reviewer reported a phase receipt/age HIGH whose evidence is not claimed as my own. No final matrix restart or whole clearance.

## AC13 proof gap

HIGH specification/evidence finding at `tests/e2e/dashboard.spec.ts:1141`: settlement timing starts at the first frame already rendering the final destination, omitting acceptance-to-render delay. The collected domain trace at1127 is not used by that assertion. A static assertion counterexample (accepted0ms, first final rendered80ms, settled240ms) passes the existing160ms assertion while violating the required240ms acceptance interval. This is a proof-coverage counterexample, not observed240ms product timing; it is explicitly labeled in the retained JSON. Require actual final coherent admission→final settled camera timestamps, both engines, and ERROR for missing evidence. The historical225.5ms report remains qualified.
