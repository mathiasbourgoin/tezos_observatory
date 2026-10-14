# Interim implementation checkpoint — foundations slice 2

**Status:** INTERIM; whole-epic implementation remains in progress. Independent review pending; no parent terminal ledger event.
**Base for this slice:** `2d4a06ff74865c46ca67f7c727faaf38ed650b91`.

Initial hidden pages now start no external work, including aliases. Collection has one production permission predicate: page active, visible, and manually enabled. Pause, visibility loss and pagehide stop streams, auxiliary facade reads and opportunity controllers. Pageshow resumes only when that predicate permits it; manual pause persists. A resumed collection uses fresh facade/controller generations, including at the same head.

Every auxiliary read uses the facade's collection signal and its caller's signal, checks its captured generation before updating the responding source or a cache, and starts no fallback read after cancellation. Aliases join cancellation and reject late bodies; cancelled fallback bodies cannot change the displayed responding source; cancelled rights, constants, baking rights and eligibility cannot poison same-head resumed caches. Pure local candidate inspection and retained positive observed power remain usable while paused; interrupted opposite-phase zero is unavailable. Existing same-context automatic rights-error retries and empty opportunity retries were removed; an explicit reconnect or materially new target can request work again.

## Actual verification

Node 22 TypeScript check and build pass. All 57 unit tests pass, including real cancellation fixtures whose fetch deliberately resolves after abort. All 38 production-page Playwright cases pass across Chromium and Firefox; new cases cover initial hidden requests, permitted resumption, stream abort ledger, persistent manual pause through pagehide/pageshow/visibility, and local paused candidate inspection with no additional reads.

| Exact semantic command | Actual result |
|---|---|
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-4 --browsers chromium,firefox` | exit 0; both production-page engines plus four facade cancellation assertions |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-20 --browsers chromium,firefox` | exit 0; both production-page engines |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-21 --browsers chromium,firefox` | Historical exit 0 exercised only the lifecycle subset; NOT accepted as full AC-21 closure. Current invocation exits 2 until comparison cancellation is implemented in slice 8. |

Root subsequently identified that full AC-21 additionally requires cancelled comparison responses. The earlier measured exit 0 was partial lifecycle evidence, not a full criterion pass. Those real unit/browser assertions remain; the original command now returns incomplete-execution exit 2 until the missing comparison consumer assertion is added. No criterion was waived.

The command interface reuses the existing Playwright CLI and its JSON report. It requires exactly one completed named scenario in each required engine, rejects missing/skipped/retried/incomplete execution, and distinguishes matcher assertions from runtime/setup failures. Runner exit 1 alone is never classified as red. A single-browser invocation actually exits 2. A deliberately malformed production main-module import also actually exits 2, captured in [execution-error evidence](../roster/observatory-foundations/slice-2-ac4-execution-error.log), even though a subsequent locator assertion fails. Runtime/local script-import hooks prevent disguising that setup error as a behavioral red; the entrypoint was restored immediately. [AC-4 red evidence](../roster/observatory-foundations/slice-2-ac4-red.log) records a genuine hidden-alias assertion (expected zero requests, received two) classified as exit 1 against the previous production `main.ts`; temporary source substitution was restored immediately. The first classification attempt conservatively returned execution error because Playwright included ANSI codes before the matcher; stripping those codes corrected classification, without changing any behavioral assertion.

TDD initially reproduced three facade assertion failures: aliases started while paused, alias signals remained un-aborted, and a late eligibility body committed after pause. The hidden-page browser assertion failed before production lifecycle changes. The paused inspection fixture now establishes its known committee/power before pausing, so it actually tests coherent cached inspection rather than racing an unfinished derivation. Its retained-power assertion exposed the old stream-state coupling and drove the production fix.

The own-worktree 170-claim projections remain fresh at `113f75b401e86d28db76e2179c62d2a2323e83ab3f7d718f327edc60ccca8512`. Root's separate combined V3 projections were not copied. Existing header/logo and visual system remain unchanged.

## Review and continuation

Review lifecycle ownership, signal/body/source/cache commit fences, same-context generations and paused local inspection. The real primary fallback remains bounded by the configured pool; explicit comparison and reconciliation must join these fences when introduced. Exact coherent chain/head/protocol cache authority, ahead reconciliation, authentic post-identity full-snapshot zero, full history/pins, committee search, comparison and selected-relative conditional opportunities remain later-slice obligations. Core glossary closure remains slice 10.

The prior W1 correction and root's independent accepted [disposition](observatory-foundations-slice-1-w1-disposition.md) are preserved. No phase-end friction entry or parent COMPLETED/PARTIAL/GO event is emitted here. The same owner continues the complete ten-slice/38-check plan.
