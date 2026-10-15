---
auditor: ambiguity-auditor
date: 2026-10-15
status: 0 critical, 2 warnings, 2 info
---

## Critical

None after root's b7454d3 glossary correction. New indexed-endpoint, T/C, floor, mean, window/batch, partial-history, freshness, endpoint-age, lag and refresh terms are defined. Exact phase-snapshot coverage and historical whole-foundation status are qualified. No contradictory duplicate Entities definitions found.

## Warnings

### [W1] Generated views omit glossary/source navigation
- **Location**: kb/index.md Generated views; kb/spec.md Terms and claim entries; kb/properties.md Runnable Checks.
- **Issue**: The index enumerates spec/properties only, while the maintained glossary and historical risks live alongside them. Projected domain concepts use their defined vocabulary without a direct glossary link; the generated Terms section is empty. The complete check commands name runner paths without direct authoritative source links.
- **Recommendation**: In a separately scoped upstream renderer change, add stable glossary and authoritative-source navigation through the supported pipeline. Do not hand-edit projections. For this task, give downstream roles the full intake and explicit authoritative artifact paths.

### [W2] Formal entity aliases are not separately indexed in glossary
- **Location**: specs/observatory-v3.md Entities; kb/glossary.md Observation vocabulary / retained inspection / conditional opportunities.
- **Issue**: ObservedNavigatorAnchor, CameraFocus and RenderedEvidenceRow have definitions in the authoritative entity section but their exact formal names are not glossary headwords. Their conceptual meanings are present; no conflicting meaning was found.
- **Recommendation**: Add exact-name aliases during a separately authorized glossary maintenance pass. Continue using the normative Entities definitions and current glossary concepts; do not invent alternative names.

## Info

### [I1] Planned runner paths remain absent in this checkout
- **Location**: kb/properties.md V3/metric Runnable Checks.
- **Note**: Existence-only checks find scripts/check-observatory-v3.mjs and scripts/check-observatory-block-intervals.mjs absent here. They are explicitly labelled planned, not executed. This is outstanding implementation/verification work, not stale proof or permission to omit their interfaces. Foundation runner exists. The active V3 worktree has a separate delivery gate.

### [I2] Generated views use digest provenance rather than last-updated dates
- **Location**: kb/index.md, kb/spec.md, kb/properties.md frontmatter.
- **Note**: These files have no last-updated field, so 30-day calendar-age inference is unavailable. Actual reconciler check passed freshness050df4d86fc51e3551f09ecd2b698f505c70db869bb425f9d897e21fe1e1f2d8, model fd0211fa8b3037a6bbf889c930a4094a58b91ff67b3b84c27362753d1cc76ac0. Glossary2026-10-15 and historical risks2026-10-14 are under30 days old.

## Audit evidence and limits

Read kb/index.md, every indexed file (spec323 lines/properties110 lines in complete bounded chunks), complete glossary and historical risks. Checked defined concepts, vague-pattern candidates in context, cross-file semantics, Markdown target existence and named component-file existence without reading app source. All Markdown paths checked resolve. The `may` occurrences are explicitly bounded permissions or historical hypotheses, not missing thresholds. Contrast, deadlines, storage, motion and numerical limits are quantified; independent visual judgment remains an explicit manual gate. Historical risk rows describe earlier evidence, not present implementation assertions.

Read only Entities sections across all three specs for the mandated cross-spec audit; shared foundation/V3 entity definitions are byte-equivalent. New metric entity names and concepts are defined locally or in glossary; no new AC introduces an undefined domain entity. Specification content was not used to decompose work: intake plus root's coordination handoff remain the only decomposition authority. No application code was read, no behavior was verified, and no KB projection was edited.
