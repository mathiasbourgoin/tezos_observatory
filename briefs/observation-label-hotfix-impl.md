# Implementation Brief — observation-label-hotfix

**Date:** 2026-10-14
**Mode:** fast
**Status:** COMPLETED

## Modified files

| File | Type of change | Reason |
|---|---|---|
| `src/main.ts` | modification | Require selected payload-bound vote group before publishing current gauge counts; exclude payloadless votes from observed-instance selection/grouping; retain proposal payload attribution. |
| `src/dashboardView.ts` | modification | Headline displays applied block level/round; show block timestamp separately from RPC message freshness; scheduled successor estimate belongs to opportunities; observed-proposal label requires matching payload. |
| `tests/e2e/dashboard.spec.ts` | modification | Mock validated proposal stream; exact production stalled predecessor regression and missing/mismatched payload regression; assert applied-head identity. |

## Decisions made

Root's delegated FAST authorization supersedes upfront full-mode recommendation and skill's round-commit requirement: no commit/push/deployment from this agent. Independent review and QA remain root-owned mandatory gates.

Applied block level and round are always primary statistics; standalone fixture models may fall back to their level/round fields. A proposal without a selected valid vote group cannot measure zero. A genuine selected preattestation group can defensibly show zero observed attestations for the same instance under the existing stream coverage contract. Payloadless operations cannot fabricate an unknown-payload group or establish an observed instance. Proposal A and votes B at the same level/round display observed votes B, never observed proposal B.

No scheduling formula, monitoring architecture, RPC provider selection, harness, KB, scripts, dependencies or CI changed. The user-requested chain-only headline steering was incorporated before final verification.

## Quality Gates

Executed with Node 22 from `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin` prepended to PATH.

- [x] Baseline: check, 38 unit tests, build passed before production edits.
- [x] Red: new proposal mismatch/payloadless fixtures failed against prior implementation in Chromium and Firefox (wrong observed-proposal label/fake unknown group). Initial exact production fixture setup needed locale-number normalization; this was corrected without relaxing final headline identity.
- [x] Type check: `npm run check`.
- [x] Unit tests: `npm test` — 13 files, 38 tests passed.
- [x] Browser tests: `npm run test:e2e` — 26 passed across Chromium and Firefox (four new browser cases).
- [x] Build: `npm run build`.
- [x] Diff whitespace: `git diff --check` for task files.
- Format: no formatter command configured; retain surrounding project conventions.

Final gates passed at 2026-10-14 21:02 local time. Screenshots: `test-results/dashboard-production-stall-9ffdb-d-101-with-no-measured-zero-{chromium,firefox}/stalled-successor-hotfix.png`. Chromium screenshot inspected: primary applied block 5,489,251 / round 101, selected scheduled level 5,489,252 / round 37, both gauges unavailable, estimated opportunity round 37→38. Clock display follows browser local timezone (fixture UTC18:12:09 displays Paris20:12:09).

## Points of attention for review

Confirm payload identity comparison and selected-group coverage guard. Existing unit/browser tests validate genuine current vote counts, phase zero, round-boundary clearing, historical peak retention, interaction stability and mobile layout. Mock stream tests exercise actual production app, parser, monitor and rendering path; they do not certify live provider coverage.

## Identified out-of-scope

Candidate retention/monitor redesign reserved for next task. Existing source evidence rows share keys by URL, causing heads/operations rows on identical URLs to overwrite; not changed. Harness runtime repair is concurrently root-owned, and no local workaround was introduced. Existing transport coverage policy is preserved, with required payload/instance evidence added.
