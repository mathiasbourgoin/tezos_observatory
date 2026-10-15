---
auditor: code-quality-auditor
date: 2026-10-15
status: 2 critical duplicates, 2 warnings, 0 new critical
---

# Independent combined code-quality audit

Frozen source `f75cfe64c836a9e1efe620861184e75dc7bd2f2d`, compared with `bf0f2d5c395ecdcf155064ba56f1577bfb73cc4c`, in an independent detached checkout `/var/tmp/observatory-code-quality-f75`. Product and contracts were not edited. This is a specialist report, not whole-review, QA, publication or deployment approval.

## References and scope

Read the installed code-quality-auditor embedded skill, project authority, TypeScript and code-quality rules, generated KB properties/spec projection, glossary, architecture and human required properties/V3 contract. Consulted all three task specifications, including foundation94FR, V3 78FR and interval30FR. The combined393 claims remain obligations; this focused static audit and test subset do not certify all393 individually. Generated KB Invariants is empty; human `kb/context/required-properties.md` supplies the actual invariant doctrine. No code-intel audit-section pack frontmatter was installed, so no index initialization or external linter ran. The stale Claude compatibility code-quality path is absent; the actual installed `.harness/rules/code-quality.md` supplied thresholds, not invented defaults.

Examined changed production modules and their source/context, lifecycle, unknown-versus-zero, retention and receipt seams. Strict unknown boundaries, generation fences and scoped feature-local interval transport remain visible. Optional metadata/storage/clipboard catches are qualified fallbacks; no new unqualified empty catch was established. Naming uses established domain terms; no confirmed public vocabulary violation or definite five-line semantic duplication is reported. This is best-effort source analysis, not formal invariant proof.

## Critical

The two HIGH entries below duplicate findings already owned by the primary/spec reviewers. They remain present at f75; do not count them as novel independent defects or pretend the pending author corrections exist.

### C1: Duplicate: phase model omits its own immutable receipt and age

- Location: `src/dashboardView.ts:5`.
- Evidence: KB glossary Receipt and Phase definitions; kb/context/required-properties.md properties1/8; specs/observatory-v3.md FR-005. At f75 VoteView still contains only count/expected/power/total/threshold; gauge99-121 accepts no provenance, so neither phase can expose its own receipt/age. Independently confirmed by source inspection; served-browser stagger reproduction belongs to spec specialist, not this auditor. Duplicate of spec-v3-fr005-missing-phase-receipt-age.
- Recommendation: Carry accepted phase-specific observer/helper/context and original receipt facts into LIVE and retained/frozen view; retain truthful missing/coverage states.

### C2: Duplicate: declared production inventory need not cover actual emitted files

- Location: `scripts/v3-evidence-contract.mjs:90`.
- Evidence: kb/context/required-properties.md property10 and V3 FR-069/FR-074 require source-qualified deterministic evidence. loadV3Evidence checks hashes only for Object.entries(manifest.production); unlike its source inventory check it never compares with actual dist file set. Independently confirmed static gap; the omitted-import mutation experiment belongs to primary reviewer, not this auditor.
- Recommendation: Require exact actual emitted dist file keys before validating production hashes, without reintroducing eager build-dependent discovery.

## Warnings

### W1: New collector exceeds the project 50-line function limit

- Location: `src/rpc/blockIntervals.ts:53`.
- Evidence: .harness/rules/code-quality.md Size Limits defines max function length50. collectBlockIntervals occupies lines53-131 inclusive79, spanning transport cancellation/body validation, endpoint acquisition, metadata and window assembly. kb/architecture.md keeps RPC acquisition distinct from presentation; extraction can remain within this native module.
- Recommendation: Extract bounded per-read transport and/or endpoint/window assembly functions while retaining a single batch budget/controller owner and existing lifecycle tests. Do not replace with new infrastructure.

### W2: Dashboard growth crosses the file-size limit and enlarges the monolithic factory

- Location: `src/dashboardView.ts:255`.
- Evidence: .harness/rules/code-quality.md Size Limits sets max file500/function50. Actual wc gives509 lines versus351 at bf0f2d5; createDashboard spans255-509 inclusive255 lines. Existing factory was already large, but current change adds regions, chooser controls, camera, and provenance inside it. kb/architecture.md assigns production DOM here and permits reusable src/view elements. This is maintainability, not evidence of incorrect values.
- Recommendation: Extract cohesive view/region factories under the established view boundary, retaining keyed DOM, reader state, callback-only acquisition and actual motion tests. Do not merely compress lines.

## Info and inherited boundaries

`src/main.ts` already exceeded500 lines at the comparison base560; current628 is disclosed inherited size debt, not asserted as a newly created violation. Existing monitor constructor/long render structures likewise predate the feature. No unrelated cleanup or product changes were made. AC13 acceptance-to-render proof gap is owned by primary review and remains open; this specialist did not independently reproduce a production timing violation.

## Actual verification

Own environment Node22.23.3 via existing `/tmp/context-review-node22-bin`; private TMPDIR `/var/tmp/observatory-code-quality-evidence-f75/tmp`. Initially no dist directory existed.

| Command | Actual outcome | Durable log |
|---|---|---|
| `npm ci` | exit0 | `/var/tmp/observatory-code-quality-evidence-f75/ci.log` |
| `npm run check` | exit0 | `/var/tmp/observatory-code-quality-evidence-f75/check.log` |
| `npm test` before first build | exit0,353 tests/24 files | `/var/tmp/observatory-code-quality-evidence-f75/test.log` |
| `npm run build` | exit0 | `/var/tmp/observatory-code-quality-evidence-f75/build.log` |

This independently confirms the bounded f75 lazy-discovery repair. It does not erase the original dc89 clean-order failure. Own actual served-dist interval Chromium/Firefox suite, `OBSERVATORY_TEST_PORT=5858 npm run test:e2e -- tests/e2e/blockIntervals.spec.ts --workers=2 --reporter=json`, completed exit0:58 expected/passed,0 skipped,0 unexpected,0 flaky, no report errors; duration105.618s, start2026-10-15T09:44:53.641Z. Raw `/var/tmp/observatory-code-quality-evidence-f75/interval-e2e.json` SHA256 `a9f87761f24ee2002b60a49dd800eb492007e3701b3e5312784f690b6d6a565b`; stderr preserved separately. This includes the11 metric-state width/theme captures and additional reader/storage/system cases in that file; it is a specialist subset on f75, not the final whole V3 matrix or an independent visual acceptance receipt. Source/build bindings are preserved in the same evidence directory as `source-bindings.json`.

Full ordinary regression, all95 official acceptance interfaces, full2520-cell matrix, native X11/tooltip/real zoom and independent manual CHECK38 are explicitly not executed by this specialist: root coordinates primary review and fresh QA ownership and the final candidate still has open HIGHs. No full release approval, runtime-provider claim, or independent visual receipt is issued here.
