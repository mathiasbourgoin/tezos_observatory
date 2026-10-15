# Opportunity capture readmission correction

Implementation source: `12555656459965996797d0a81fb9245603e4e6c8`.
Base: `abefce242498c5c7d445039a6f718ac61fe87891`.
Isolated branch: `fix/observation-opportunity-readmission`.
Worktree: `/home/mathias/.cache/observatory-review/observation-opportunity-readmission`.

Repeated `ObservationStore.accept` rechecks admitted records through `tryAdmission`. Its explicit immutable reconstruction omitted `opportunities`, then `captureHistory` replaced the retained candidate and representative with this incomplete record. Thus previously captured exact-context proposer and timer facts disappeared even though no observation identity or authority changed. This is a domain retention bug, independently of Astra's page rendering or asynchronous rights completion.

The correction retains only the existing record's captured opportunities when the old admission is valid and its full `contextFacts` exactly match the new admission. Identity/target/original receipt remain untouched. No general spread preserves stale errors or phase state. Changed context, invalidated authority and sibling candidates receive no previous capture; old history remains attributed to its original context. No new fetch, historical fill, dependency, timer arithmetic or observation selection was introduced.

Four new deterministic store regressions cover repeated exact-context admissions including retained pinned snapshot and receipt/newer stability; changed context key; changed anchor timestamp with the same context key; and uncaptured siblings/reorg rejection with historical candidate facts retained. Existing opportunity capture validation, active/history eviction, frozen pin, generation fencing and independently unknown branches remain exercised by the full suites.

The first real RED was obtained before editing production code: `readmission-red.log`, 1 failed / 72 passed, expected captured facts but received undefined immediately after the first exact-context admission. During development an extra negative assertion initially selected only the historical representative, which legitimately becomes a sibling; it was corrected to inspect the original candidate. Two TypeScript fixture mistakes were caught by check (optional snapshot undefined, then destructuring a nonexistent ReconciledContext member), corrected without bypassing the checker. These are not passing gates.

Final actual Node 22.23.3 commands and logs under `/home/mathias/.cache/observatory-review`:

- Clean `npm ci`: PASS, `readmission-ci.log`.
- `npm run check`: PASS, `readmission-check.log`.
- `npm test`: PASS, 264 tests / 19 files, `readmission-green.log`.
- `npm run build`: PASS Vite 7.3.7, `readmission-build.log`.
- Full Playwright Chromium and Firefox: PASS, 140 tests / 1.6 minutes, `readmission-browser.log`. The isolated temporary configuration changed all three server URL/port/command settings to port 5232, then was removed. Actual production-page coverage is 134 tests, plus 6 legacy fixture tests; 140 is not claimed as production-only.
- `git diff --check`: PASS.

Full browser coverage includes S9 captured historical as-of deadlines and context, missing rights/timing branches, migration, stale body cancellation, applied-versus-selected clocks, pinned phases, source comparisons and reorg/lifecycle cases. Production source was stable for the complete browser run. Generated screenshot artifacts were restored to the base; they are not proposed source changes.

The 38 separate foundation criterion wrapper commands were not rerun here: this is a narrow immutable-record retention correction with no checker, numerical basis, admission validator, protocol parser or acquisition change. The complete unit and both-engine browser gates above are actual execution evidence, not a substitute claim that all 38 wrappers ran. Independent review and QA remain required; this report makes no deployment or full V3 acceptance claim.

Integration note: Astra may later add optional matching-producer evidence to this record type. That does not exist in this source; any later admission-copy preservation rule for that evidence must follow its own authority/context contract rather than an unconditional spread.
