# Tezos Observatory delivery team

Status: proposed; harness installation awaits maintainer validation.

## Scope and invariants

A self-contained static TypeScript application for observing live Tezos consensus.
No signing, wallets, node mutation, background collector, or server-side polling.
Unknown observations must not appear as zero votes. Network identity, level,
round, payload, source and observation freshness must remain distinguishable.
Scheduled opportunities are estimates, not observed proposals or finality.

## Proposed team

Use the locally indexed, maintained Roster definitions. No external personas or
additional agent platforms are required.

| Role | Recommended definition | Responsibility |
| --- | --- | --- |
| Lead | tech-lead | Scope, evidence, handoffs and delivery decision |
| Planning | planner | Independently executable briefs with acceptance criteria |
| Implementation | implementer | Strict TypeScript changes and regression tests |
| Review | reviewer | Independent correctness and maintainability review |
| QA | qa | Unit tests, browser tests, responsive/accessibility checks |
| Knowledge | kb-agent | Keep architecture, properties and risks current |

ASTRA is a task-specific UI specialist, not a replacement for independent review
or QA. Its V3 task includes comparative research, original design and direct
implementation, followed by the same delivery gates.

## Execution and gates

Maintainer validates scope → lead → planner → scoped implementation → independent
review → QA → lead handoff → maintainer approves publication. The coordinating
session launches agents and conveys their results; the diagram describes logical
handoffs, not an autonomous background service.

Review findings affecting data correctness, failed deterministic tests, unreadable
layouts or unauthorized publication block delivery. Neither an attractive UI nor
passing mocked tests establishes that public RPCs are functioning correctly.
Live smoke checks must be bounded and disclose provider limitations.

## Verification

Node.js 22, npm, Git, GitHub CLI and installed Playwright browsers are available.
Run `npm ci`, `npm run check`, `npm test`, `npm run test:e2e` and `npm run build`.
GitHub Actions repeats these checks on pushes and pull requests. Chromium and
Firefox cover the production entrypoint with deterministic RPC streams.

## Knowledge base draft

- `kb/spec.md`: public product scope, primary workflows and acceptance criteria.
- `kb/properties.md`: identity isolation, deduplication, power accounting,
  cancellation, bounded retention and accessible stable UI.
- `kb/risks.md`: provider CORS/stream gaps, stale heads, clock estimation,
  competing payloads, aggregate operations and cross-source inconsistency.

## First delivery

Establish a sanitized public repository and reproducible quality checks. Complete
the evidence-led product improvements before the ambitious V3 visual redesign.
Do not publish private operational material or import unrelated repository history.
