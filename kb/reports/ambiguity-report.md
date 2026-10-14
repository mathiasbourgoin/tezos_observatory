---
auditor: ambiguity-auditor
date: 2026-10-14
status: 1 critical, 3 warnings, 1 info
---

## Critical

### [C1] Vocabulary omits precise contextual entities used by active obligations
- **Location**: kb/glossary.md; kb/spec.md FR-013, FR-025, FR-045, FR-073, FR-085; specs/observatory-foundations.md Entities.
- **Issue**: ObserverContext, UnresolvedObservation, PhaseEvidence, SessionSnapshot, ComparisonSnapshot, ConditionalOpportunity and ConsensusEvent have inline source-contract definitions but no glossary entries. The glossary consensus-instance definition omits source/context from its identity, whereas active requirements require those dimensions. Pin inspection describes historical selection only although accepted contract permits retained same-identity enrichment until eviction.
- **Recommendation**: Extend glossary with cross-linked authoritative definitions and precise source/context instance identity; distinguish retained pin enrichment from static evicted frozen copy. Do not weaken active claims. Root may explicitly continue because the accepted intake resolves these semantics.

## Warnings

### [W1] Generated index no longer enumerates doctrine
- **Location**: kb/index.md Generated views; kb/README.md.
- **Issue**: Index links only spec/properties; architecture, vocabulary, historical risks and preserved V3 context appear only through README. An index-only reader can miss binding doctrine.
- **Recommendation**: Keep generated projection managed; add or document an authoritative entrypoint linking doctrine without manual projection edits.

### [W2] Generated requirements lack vocabulary/source hyperlinks
- **Location**: kb/spec.md Requirements, Acceptance Criteria; kb/properties.md Runnable Checks.
- **Issue**: Claim ids and scenario traces lack links to their source entity definitions; generated Terms/Invariants sections are empty. Reader must discover README to distinguish active obligation from absent verification.
- **Recommendation**: Improve upstream projection cross-references or document explicit navigation through README; never hand-edit generated claims.

### [W3] Subjective V3 acceptance remains deferred
- **Location**: kb/context/v3-contract.md visual implementation and acceptance paragraphs.
- **Issue**: Beautiful, practical, original, deliberate layouts and sufficient contrast are not all quantified. These are preserved V3 intent, not foundations execution requirements.
- **Recommendation**: ASTRA phase supplies concrete rendered comparison and accessibility acceptance; retain foundations scope separation.

## Info

### [I1] Fresh contract and historical evidence are distinguished
- **Location**: managed projections; kb/risks.md; kb/context/onboarding.md.
- **Note**: Default claims reconciler check is fresh at df956427d1682044239f38a92ca709c4e916d8790b615436699c6e60555549d7; context manifest matches. All dated doctrine is current (2026-10-14). Historical baseline explicitly does not certify current defects. Existing local code references and Markdown destinations resolve. AC-3 wording “appropriate rights” is operationally specified by exact source/context rights requirements, not an independent undefined acceptance threshold.

## Cross-Spec Entities

Only one spec exists; no competing entity definitions. Source-contract Entities provide contextual definitions for active obligations; glossary navigation remains C1. No new requirement or implementation architecture was extracted for decomposition from this audit.

## Delegated disposition

Root explicitly chose to continue on 2026-10-14 under project-authority: the full accepted intake fixes exact identity/provenance semantics; implementation must extend glossary with actual consumer terms before final independent review. C1 is an accepted documented risk pending that documentation closure, not a passing verification result. No KB doctrine was auto-fixed by the auditor.

## Planning-context refresh

Root-approved narrow retention/crossing/comparison clarifications now map94 requirements,38 acceptance criteria and38 planned checks. Planner rechecked default claims freshness at113f75b401e86d28db76e2179c62d2a2323e83ab3f7d718f327edc60ccca8512 with matching170-claim manifest. Original audit digest above remains historical evidence. No implementation verification is claimed; glossary closure remains required.

## V3 planning combined-context audit — 2026-10-14

The planner read all KB Markdown files for this audit, separately from intake-only decomposition. Current actual default check is fresh at `ceb740eb6e894bacaa792db0bb79070c521775172cb2391a01c5f3bb1bed51fc`; task manifest contains323 mandatory claims and combined model `5c03c7a62d889f67edfaa3ade81eca950351071ecd7a1ac2da7ecb0f2ebca532`. Earlier digest/entity-count statements above remain historical.

C1 remains: the abbreviated glossary omits precise source/context and retained-enrichment definitions plus additional navigator/camera/captured-opportunity/rendered-evidence terms. Accepted contracts define these inline; glossary completion is not claimed. W1/W2 remain managed-navigation risks. W3's formerly unquantified production acceptance now has accepted numeric/state/viewport criteria and independent reasoned visual judgment; visual judgment is still a future release gate, not a PASS. No new contradictory normative direction was found. All dated doctrine is current and historical evidence is labelled. Relative Markdown link scan reported no broken destination. Source references are historical baseline references or intake-named integration files; no code behavior was mined for planning.

Both managed specs were inspected only for the required entity-consistency gate. Their ten shared entity definitions are byte-identical; no cross-spec entity conflict was found. V3's additional named entities are explicitly defined. No additional feature was extracted from these gate reads.

Root explicitly continued planning with C1/index risk on 2026-10-14 and assigned glossary closure to foundations slice10 before final independent review/QA. This disposition does not waive obligations, declare documentation complete or permit V3 implementation before full foundation GO.
