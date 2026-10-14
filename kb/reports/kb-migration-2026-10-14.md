---
auditor: kb-migrate
date: 2026-10-14
status: complete-scoped-migration
---

# Accepted claims and preserved product intent

The default KB projections are fresh and the accepted foundations contract is active, while the full V3 product contract remains preserved and binding. This migration establishes planning context, not implementation correctness.

Root approved Phase A findings, Phase B deferrals, the exact Phase C moves/link rebasing and Phase D metadata/authority plan under [delegated project authority](../../.harness/rules/project-authority.md). No application changes, publication, deployment or Git identity attestation occurred.

## Audit findings and decisions

Direct ambiguity and compliance audits were used under root's capacity waiver; fresh specialist agents were not run. These audits covered the seven legacy KB files and focused source references, not exhaustive implementation certification. The absent check-kb-links script was replaced by a read-only relative Markdown link scan: zero broken links before migration.

| Finding | Decision |
| --- | --- |
| Legacy spec mixes foundations with full V3 design intent and subjective beautiful/practical/original criteria | Preserve the whole binding V3 contract; quantify through V3 specification and rendered review rather than weakening it |
| Bounds, contrast and coverage language lacks full thresholds in legacy prose | Preserve intent; accepted foundations provide their scoped numerical rules; remaining V3 detail deferred |
| Glossary omits phase, eligibility, finality and producer definitions; legacy files have no dates/schema | Preserve glossary body; schema/date migration performed; additional vocabulary deferred to V3 specification |
| Candidate storage rejects equal rounds (`src/monitor/networkMonitor.ts:335`); inspector pin/follow-live controls absent (`src/dashboardView.ts:152`) | Baseline implementation gaps, deferred to foundations/V3 implementation; no spec amendment |
| Historical producer mismatch risk differs from current payload guard (`src/dashboardView.ts:224`) | Keep baseline evidence verbatim; README now states risks are historical observations/candidates, not current certification |

The legacy specification's concrete consensus, selection, coverage, cancellation and V3 requirements remain intended obligations. The code scan does not establish all numbered properties or every legacy prose claim as PASS. Existing acceptance check commands are planned deliverables, currently unexecuted; active claims retain verification absent.

## Preservation and generated views

Moved only index to [onboarding](../context/onboarding.md), spec to [V3 contract](../context/v3-contract.md), and properties to [required properties](../context/required-properties.md). Architecture, glossary and risks stay in place. The [human entrypoint](../README.md) links these files and generated foundations views. Six legacy normative bodies match revision `371a20e` exactly after the approved relative-link transforms; [digest proof](../../roster/observatory-foundations/kb-preservation.json) records source and preserved hashes. README retains its original body with an explanatory addendum.

All ten non-report KB files now carry schema-version 2. Human context metadata distinguishes live intent from historical onboarding/risks. Generated index/spec/properties are derived and were not hand-edited. Separate [claims authority](../../specs/claims-authority.json) names the delegated root coordinator for requirements, acceptance criteria and checks; it does not attest reviewer Git identity.

## Executed verification

- Real claims validate: one managed document, 166 claims (90 requirements, 38 acceptance criteria, 38 planned checks).
- Real default project followed by default check: all three projections fresh.
- Model digest: `88f0e279b244d15ec62d1384f6a74e3d51e7c69b98121933d9e3516a0d1bf5f2`.
- Freshness digest: `df956427d1682044239f38a92ca709c4e916d8790b615436699c6e60555549d7`.
- Exact [task context manifest](../../roster/observatory-foundations/context.manifest.json): all 166 active mandatory claim IDs.
- Second real projection: byte-identical index/spec/properties, proving generated-view idempotence.
- Recursive KB relative links: zero broken; all non-report files schema-version 2.
- Post-migration ambiguity review: no new normative body ambiguity introduced; baseline unresolved items remain explicitly deferred above.

Migration is complete for the approved scope. Independent implementation/review/QA and provider evidence remain required before delivery; publication/deployment remains the maintainer's decision.
