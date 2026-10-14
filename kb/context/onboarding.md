---
status: historical
schema-version: 2
last-updated: 2026-10-14
---

# Tezos Observatory knowledge base

Product and intended behavior are recorded in [spec](v3-contract.md), hard constraints in [properties](required-properties.md), code structure in [architecture](../architecture.md), unresolved findings in [risks](../risks.md), and vocabulary in [glossary](../glossary.md). [Project authority](../../.harness/rules/project-authority.md) records delegated intermediate decisions and retained publication/deployment approval.

Baseline review revision: `d9a58f2e072d640677782afb0427157183c99f80`. The worktree includes the reviewed Node-type/Vitest configuration correction and design guidance; this is onboarding intent, not certification that the ambitious V3 already exists. Clean Node 22 verification reported 38 unit and 22 Chromium/Firefox tests plus typecheck/build passing. Independent Node 26 verification reproduced those results. Live provider coverage remains limited.

Roadmap order: install and verify Roster; close correctness/evidence review; validate specification and planning; dedicated ASTRA research/design/direct V3 implementation; independent review and QA; maintainer publication/deployment approval; verify served revision and actual-origin RPC behavior. Existing comparative direction: [Explorus/Teztale review](../../docs/reviews/2026-10-14-explorus-teztale.md) and [anti-generic design guidance](../../docs/reviews/2026-10-14-v3-anti-generic-design.md).
