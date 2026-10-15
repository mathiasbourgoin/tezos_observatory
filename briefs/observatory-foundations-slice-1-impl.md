# Interim implementation checkpoint — observatory foundations slice 1

**Status:** INTERIM; parent implementation remains in progress. Independent architectural/reviewer decisions are pending. This checkpoint does not mark implementation COMPLETED/PARTIAL or review/QA GO.
**Date:** 2026-10-14
**Base:** `5efee040fca44893d191cd156e002b9e57fbe035`
**Owner:** the existing whole-epic implementer, retaining all ten slices and 38 checks.

The production page now lets a reader select H1 or H2 at the same level/round with a shared payload, or select a competing payload independently. It displays the observed block hash, unknown producer, shared payload qualification and immutable source/context/receipt facts. Atomic aggregate rejection and exact unique-delegate accounting prevent partial malformed aggregates and replay from inflating power. The next decision is independent review of candidate and accounting ownership before dependent slices begin.

## Delivered boundaries

`networkMonitor.ts` retains separately bounded 100 accepted and 100 unresolved candidate observations, keyed by network/source/chain/block hash, ordered by first monotonic receipt and lexical identity ties. Replay leaves first facts unchanged. Ahead-context reconciliation and quarantine promotion remain slice 4 work; the candidate products introduced here are not a claim that admission authority is finished.

`phaseEvidence.ts` is the production accounting function extracted from `main.ts`, then extended after behavioral regressions. It groups votes by source/context/level/round/payload, counts unique phase delegates, exposes conflicting payload signers and preserves unknown-rights slots. It rejects contradictory committees, incomplete totals, invalid thresholds and unsafe cumulative power. Percentage rendering remains separate from exact power, signer count and deficit.

`guards.ts` rejects a whole operation when any relevant consensus member is malformed, validates safe nonnegative applied levels/protocol indices and legitimate explicit-timezone calendar timestamps. A proposal retains the supplied chain identity. An operation retains its supplied raw RPC branch without interpreting it as immediate proposal ancestry. `OperationStore` no longer replaces first evidence or refreshes receipt order on replay; its existing 10000-operation cap remains in use.

`NetworkData` wraps reads with the actual responding endpoint and immutable receipt facts, retaining requested-head hashes only for routes actually pinned by hash, including successful fallback responses. Committee and protocol numerical boundaries reject fractional/negative/unsafe values and invalid threshold authority. Exact coherent cache/chain authority is deliberately unfinished until slice 3.

## Actual verification

All commands used the supplied Node 22 runtime. Baseline before production changes: clean npm ci, TypeScript check, 38 unit tests, 30 Playwright cases across Chromium/Firefox, and build.

After slice changes: TypeScript check passed, 50 unit tests passed, build passed and 32 Playwright cases passed across Chromium/Firefox. The new real `/` scenario independently selects H1/H2 and competing payload Q, verifies shared qualification/unknown producer, source endpoint, unique replay signer and exact 19400 deficit. Both browsers also ran the baseline focus/scroll and header regressions. Focused screenshot execution passed after correcting its panel selector; captures are [Chromium](../roster/observatory-foundations/slice-1-chromium.png) and [Firefox](../roster/observatory-foundations/slice-1-firefox.png).

| Semantic command | Actual assertions | Result |
|---|---:|---|
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-1` | 12 | exit 0 |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-9` | 12 | exit 0 |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-10` | 3 | exit 0 |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-11` | 9 | exit 0 |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-12` | 21 | exit 0 |

These checks load real production modules using the existing Vite transformation API; they do not duplicate accounting functions. Unsupported ACs are explicit incomplete-execution errors, not passing placeholders. AC-38 currently exits 2. The complete 38-command interface and browser-required cases remain owning-slice obligations.

Meaningful TDD failures were observed before behavior changes: H2 was discarded, mixed malformed aggregates retained valid signers, rollover dates were accepted, replay replaced original contents and invalid fractional committee data retained authority. Conflict and invalid-committee tests followed a mechanical accounting extraction and failed at assertions before extensions. The first candidate test initially dereferenced an absent new field, which was an execution error, not a behavioral red; it was corrected to assert the existing `latestProposal.hash` H1-versus-H2 boundary before production changes. [Standalone AC-1 red evidence](../roster/observatory-foundations/slice-1-ac1-red.log) records assertion exit 1 against the original base monitor with current check support; current code exits 0. The temporary original monitor was restored immediately.

Root caught a provenance-carrier defect before handoff: unpinned stream receipts borrowed the globally rendered head as a requested-head fact. Actual A/B regressions failed at assertions before correction. Unpinned streams and pending reads now leave requested-head unknown, and capture observed-head context only from the same observer. Pinned auxiliary routes retain their actual requested hash. The shell `proto` number is now explicitly a protocol-level counter, not a protocol hash. These fact corrections are included in the final interim checkpoint.

Managed claims remain fresh at `113f75b401e86d28db76e2179c62d2a2323e83ab3f7d718f327edc60ccca8512`; no verification claims were written into the accepted contract.

## Required review attention and remaining work

Review candidate versus payload identity, exact unique power and conflict handling, invalid authority/raw slot preservation, first receipt/replay semantics, source attribution and independent candidate bounds. `main.ts` still owns selection presentation and `networkMonitor.ts` owns candidate receipt. The helper is domain-specific and reused by the production consumer and semantic checks.

Slices 2–10 remain mandatory: all-work lifecycle; exact chain/head/protocol cache authority/reorg/eligibility; same-observer ahead reconciliation; authentic snapshot zero/partial qualification; at-most-once immutable events; full 150 histories and stable pins; searchable stable committee; explicit budgeted comparison; both conditional proposer/timer branches; glossary, complete semantic checks, independent audit, QA and bounded live-origin evidence. Existing stream-based opposite-phase zero and context-weak caches are baseline limitations that this interim checkpoint does not validate or solve. Public-provider coverage has not been tested or certified.

## Setup friction

The canonical library index was searched before using existing Vite/Vitest/Playwright support. No additional library or generic parser/test harness was selected. Optional Vitest coverage execution failed because `@vitest/coverage-v8` is absent; coverage percentage is unavailable, not passing. Root declined a dependency solely for optional coverage.

The original manifest writer created its own file before sampling status, accidentally recording the new manifest as pre-task dirty. That self-entry was removed; the original base and genuine copied-plan JSON dirty entry remain. Root approved exact helper/test paths and `.gitignore` additions for ACTIVE_TASK and manifest controls, plus committing the unchanged accepted plan JSON. No control file is committed. An initial standalone red invocation omitted the RTK executable from its temporary PATH and exited 127; the corrected invocation produced the genuine assertion exit 1. Concurrent Vite check runs opened competing HMR ports; HMR alone did not disable Vite's socket server; the existing `ws:false` option was then used for middleware-mode checks and clean commands were rerun. A screenshot attempt used a selector also matching the network tab; it was corrected to the panel and both captures passed. These were execution/setup errors, not product behavioral evidence.

No parent terminal ledger or phase-end friction event is emitted at this interim handoff. The ACTIVE_TASK slot remains active for the same owner's continuation.
