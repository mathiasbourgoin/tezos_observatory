# Independent opportunity readmission QA

**Verdict: GO — targeted correction passes independent QA.** Exact source `12555656459965996797d0a81fb9245603e4e6c8`. No open product findings.

Detached checkout `/home/mathias/.cache/observatory-review/readmission-qa-1255565`; Node 22.23.3. I read the full author and independent review reports, the three-line production diff, admission/history paths and committed regression scenarios. This QA had no authorship or earlier review role. Only my isolated checkout was temporarily changed; author, Astra and root application source were not modified.

## Actual deterministic gates

Raw evidence directory: `/home/mathias/.cache/observatory-review/readmission-qa-evidence`.

- Clean `npm ci`: exit 0, 1 second (`npm-ci.log`).
- `npm run check`: exit 0, 3 seconds (`npm-run-check.log`).
- Full `npm test`: exit 0, **264 tests / 19 files**, 2 seconds (`npm-test.log`). This ran the exact committed test suite before independent temporary probes.
- Clean, source-stable full `npm run test:e2e`: exit 0, **140 tests**, Chromium and Firefox, 91 seconds (`stable-npm-run-test:e2e.log`). Coverage is 134 actual production-page tests plus 6 legacy fixture-page tests, not 140 production-only tests.
- `npm run build`: exit 0 (`stable-npm-run-build.log`).
- Original `node scripts/check-observatory-foundations.mjs AC-22 --browsers chromium,firefox`: exit 0, **14 assertion groups**, actual production `/` in both engines (`stable-AC-22.log`).
- Original AC-33 command: exit 0, **2 groups**, production `/` in both engines (`stable-AC-33.log`).
- Original AC-34 command: exit 0, **33 groups**, production `/` in both engines (`stable-AC-34.log`).
- `git diff --check HEAD^ HEAD`: exit 0. No separate lint script exists.

All three Playwright server settings were temporarily moved to 5236: base URL, port and dev command with explicit `--port 5236 --strictPort`. The certifying full browser, build and three wrappers ran sequentially in one process, with no concurrent source mutations. All tracked source, test and script hashes captured before that sequence match after it (`source-before.sha256`, `source-after.log`). Store SHA-256 is `c5bc3fcbaec9f0df9f8e35fa271d508f33173d7d2b1d5e316f12f55753943367`. Temporary Playwright configuration and generated S1/S4/S9 PNGs were restored after execution. Final checkout is clean.

## Independent adversarial scenario

A temporary additional test reused the actual store and existing RPC fixture. It captures both branches, pins the exact candidate, creates an uncaptured sibling, submits a coherent snapshot body and then a snapshot error, and checks captured opportunity object identity, byte-identical as-of/deadline/remaining/source/context facts, original receipt identity, sibling non-inheritance and exactly one genuine newer sibling. It then enriches the exact retained capture, re-admits the same context and verifies enrichment survives. Finally it creates 151 histories, verifies the pin becomes frozen, re-admits again and proves the frozen snapshot remains the same object with byte-identical contents and refuses a late historical capture.

This additional test passed: **1 passed / 75 intentionally filtered**, `independent-green-corrected.log`. Restoring only the store to its parent implementation makes the same probe fail with a genuine assertion (`independent-parent-red.log`, exit 1), then the exact committed store was restored. Probe source is preserved in `independent-final-test.patch`; no temporary test remains in the checkout. Existing committed changed-key, same-key changed-anchor timestamp, reorg rejection and sibling isolation regressions all pass in the independent full 264-test run. No current-rights historical fill, timer recalculation, observation selection or provider access was added.

## Non-certifying attempts retained honestly

The first full browser attempt was contaminated by my sequencing error: while its server was active I temporarily restored the parent store for the RED probe, and also attempted AC-22 concurrently. The latter correctly failed setup with exit 2 because port 5236 was occupied, zero assertions, and its temporary source instrumentation disturbed hooks in that initial browser run. Initial browser result was 132 passed / 8 failed (`npm-run-test:e2e.log`), which is **not** used as product evidence. The parent probe and all instrumentation were restored, its handle was awaited to a terminal state, and the full source-stable sequence above then passed all 140 tests. The initial port failure is retained in `AC-22.log` and is not presented as PASS or a product defect.

My first additional probe also mistakenly read the historical representative after creating a sibling, rather than selecting the exact original candidate; that assertion failed (`independent-green.log`). Correcting only the test to select the requested candidate yielded the successful probe described above. No implementation change was made to obtain green.

## Scope

This is fresh targeted QA after the separate targeted reviewer GO. It is not final V3 acceptance, a new full foundation aggregate verdict, a claim that all 38 wrappers were executed, cross-runtime review, fresh-lead approval, deployment or live provider coverage. No canonical aggregate Roster event, normalizer result or convergence verdict was fabricated. No dependency, framework, remote mutation, commit or subagent was introduced. Root coordinates integration and aggregate evidence.
