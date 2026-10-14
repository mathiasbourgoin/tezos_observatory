# Tezos Observatory delivery team

Status: accepted by the root coordinator on 14 October 2026 under explicit maintainer delegation; canonical projections and bundle hashes verified; CommonJS execution is repaired through maintained upstream tooling; upstream review/QA passed and draft PR #86 tracks the unmerged repair.

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

Root validates intermediate scope → lead → planner → scoped implementation → independent
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

## Accepted project authority and installation

# Project authority and delivery policy

Effective 14 October 2026. The maintainer explicitly delegated intermediate Roster questionnaires, validation, onboarding, KB, specification, planning, implementation and local installation decisions to the root coordinator. The coordinator may answer these gates and records its decisions in task artifacts. Maintainer approval remains required for publication and deployment of the concrete reviewed result. This project override takes precedence over copied default human-validation instructions; upstream Roster definitions remain unchanged.

The coordinator launches separate agents and supplies verified briefs. Separate implementation, independent review and QA remain mandatory. ASTRA implements V3 directly and does not review its own work. A fresh planner receives the research brief; a fresh lead reviews delivery evidence. Critical findings are resolved or explicitly accepted with recorded rationale; incomplete deterministic evidence blocks delivery.

Use project-local Codex only. Do not modify global runtime settings. TypeScript patterns live in `.harness/rules/typescript-patterns.md`; read them before implementation/review even when canonical prompts mention the Claude compatibility path. No signing, wallet interaction, node mutation, background collector, decorative polling or undisclosed provider aggregation.

Target Node 22 or newer; reproducibility checks use Node 22. Commands: `rtk npm ci`, `rtk npm run check`, `rtk npm test`, `rtk npm run test:e2e`, `rtk npm run build`. No separate lint command exists: do not invent or silently skip one. Playwright requires Chromium and Firefox. Build/test success does not establish public provider coverage.

Route roadmap tasks through roster-run and keep phase artifacts, evidence and open findings. Reports are due every 15 minutes during active work. Messages prefixed `roadmap:` extend the same objective. Preserve public-safe source references and never publish machine-local operational material.

Developer profile: recruiter, tech-lead, planner, implementer, reviewer, qa, architect and kb-agent. Architect activates for structural changes. Canonical pipeline/meta/KB/workflow skills and review bundle are installed; project-local Codex is the only enabled runtime. No security/full/personal overlays. Optional arch-index declined. KB acceptance and the current design contract are recorded in `kb/spec.md` and `briefs/project-intake.md`.
