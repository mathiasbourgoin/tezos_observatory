# Independent bounded block-interval QA at 4cf

**Result: FAIL for the frozen candidate's executed regression gate; the bounded production arithmetic/transport/controller/applied-listener checks passed.** This report does not approve the candidate while deterministic regression failures remain. Root can carry the verified runtime forward into the separately pending UI integration, then obtain fresh combined review and QA. No whole-metric, whole-V3, all20-criterion, manual/matrix, provider-coverage or publication GO is issued.

QA ran on 15 October 2026 in independent detached checkout `/var/tmp/observatory-interval-qa-4cf`, exact commit `4cf199c58be940eed2a5de8fbd9ff3b7fce92714`, Node `v22.23.3` selected through `/tmp/context-review-node22-bin`. No production source, dependency manifest, Playwright configuration, author/Astra checkout, remote or global configuration was changed. The original98 review NO-GO remains intact. This report is the sole root-checkout write and is not committed.

## Failures requiring integration follow-up

The complete configured E2E command exited1: **202 passed, 16 failed, zero skipped/flaky, 218 total**, duration182.7s. This configuration serves **Vite development mode** unless `OBSERVATORY_TEST_PRODUCTION=1`; neither its test titles containing “production” nor the fixture filename changes that fact. The total includes eight added reviewer/QA engine cases. The 210 frozen authored cases contribute195 passes/15 failures; added cases contribute7 passes/1 failure.

1. **MEDIUM — metric evidence text violates the accepted minimum size.** Fourteen failures are seven existing V3 matrix scenarios in each engine, each stopping at its first360x800/light cell. Actual computed `pre.interval-evidence` size is10.5px against the12px minimum. Contrast in those measurements is10.9944:1 and passes; the failure is size. Cases include initially hidden text `No completed indexed history batch.` and unavailable failure receipts. Source `src/dashboard.css:144` uses `.75rem` under a14px root. This is a metric UI integration defect under FR-027/AC-15, outside the bounded transport source correction. Root and author were notified during execution; the author acknowledged a separate UI fix, which this QA did not inspect or accept. No completed matrix is claimed because each scenario stopped at its first failing cell.
2. **OPEN — Chromium S9 activation timing scenario.** `tests/e2e/dashboard.spec.ts:883` expected deadline `2026-10-15T08:26:04.259Z`; the next-round row showed `Baking rights unavailable` / `Timer unavailable`. This is one actual failed assertion. No baseline comparison or root-cause reproduction was performed, so its origin is undetermined; it cannot be dismissed as preexisting or treated as passed.
3. **OPEN — Firefox copied reviewer counterexample in the broad DEV run.** `blockIntervals.counter.review.spec.ts:4` expected `Observed same-level round advance`; raw applied108/round1 appeared, but accepted progression did not, and the metric remained refreshing/nonstale. The test checks raw `.applied-context` after gap108 before sending its fork; that alone does not establish that gap108's observer proof completed. Consequently this failure does not establish the production listener incorrectly ignored a proven replacement. The unchanged test passed both engines in the separate actual production run below. The DEV failure is retained, has not been retried, and requires examination of proof synchronization before final combined acceptance.

Full DEV JSON: `/var/tmp/interval-qa-4cf-configured-dev.json`. All sixteen failures, full messages and engine attribution: `/var/tmp/interval-qa-4cf-dev-failures.json`. Fourteen durable failed DOM measurements: `/var/tmp/interval-qa-4cf-dev-matrix-failures.json`; original screenshot/measurement pairs remain under the isolated checkout's `test-results/*/matrix/`. The seven failing matrix scenarios are AC06 initial/empty/partial/quorum, AC06 source zero/stale/failure, AC06 dense retained pin, AC07 focus/search, AC06 loading/gaps/reorg/visibility, AC09 producers and AC10 phase thresholds, in both engines.

## Passing bounded production and consumer evidence

Clean install/typecheck/original333 unit tests/build passed. After adding QA probes and copying the reviewer's real-consumer probes unchanged, all351 tests in24 files passed:333 authored +13 reviewer +5 newly authored QA. These counts identify executions, not coverage of all criterion obligations.

The actual production feature suite passed22/22 in Chromium and Firefox. It executes the real built page, including means, metadata, per-network refresh,59/60 cooldown,119.999/120 freshness, wall jumps, retained failures, partial/insufficient/unavailable states, hidden/manual pause/BFCache, ordinary accepted forward progress, duplicate suppression, unqualified raw replacement and the author's port of the independent matching-E same-level reorg probe. It has page-error hooks. This independently executes the author's tests; it is not new independent test authorship.

I added three actual-main cases, each run in both production engines, all6/6 passed:

- Accepted same-source rollback100→99 during held mandatory fixed-E verification immediately stale/fences retained data. Matching E released afterward cannot replace the original batch.
- Accepted adjacent101 whose proven predecessor differs from prior100 has the same immediate fencing and sticky retention behavior.
- A raw101 header whose RPC observer header differs by one second produces `Observer context does not match observed header`; it cannot fence the pending historical span. Releasing matching E completes normally.

Each case also advances quiet time60s without any new metric read and records empty page-error lists. In rollback/wrong-parent cases, the original as-of note is unchanged; attached status before release shows fetch age60s/stale, and after release plus quiet time shows original age119–120s/stale. The header-mismatch negative remains nonstale after successful completion, with a separate endpoint age122s. Counts15 in these attachments include both networks' initial5 reads plus Mainnet's second5; they are not15 reads in one attempt.

The reviewer's unchanged proposal/vote/gap/no-committee probe was copied from the canonical frozen re-review checkout and independently executed against this checkout's built production assets:2/2 passed. It verifies proposal/vote nontriggers; an accepted gap105 starts5 reads despite rights/constants503; duplicates do not; gap108 during held verification does not fence; accepted same-level108 replacement does fence despite those unavailable helper resources. This supplements, and does not replace, my three separately authored cases.

My five new native Vitest probes invoke the actual collector/controller and passed:

- Held streamed bodies keep both floor slots occupied until EOF; a malformed UTF-8 week body remains window-local, supported siblings still verify, and peak concurrency is2.
- EOF at7999ms succeeds; at8000ms the complete read fails and no floor starts; timers are cleaned.
- A redirect on shared earliest lookup is shared fatal even with an independently valid hour; no verification or partial commit follows.
- A mandatory fixed-E response ignoring abort times out after8s, retains the original batch plus failure receipt, and cannot commit when its agreeing reply arrives late; view/quiet time starts no retry.

The thirteen unchanged reviewer tests independently executed here additionally establish exact cutoff/normalized equality, six-read shared fallback and dependent contradictions, wrong populated URLs at shared stages,16384/16385 byte boundaries, preabort zero reads/timers, shared-identity cancellation of a held sibling body, active branch fencing, complete-body concurrency, initial-only metadata and local malformed/selection failures. The authored suite independently exercises the24s whole deadline, completion-at-deadline rejection, ignored-abort fetch/body, partial fallback atomicity, metadata independence, generation/lifecycle fencing, completion freshness versus E age, cooldown/one queue/drop behavior and source rotation. No production dependency or generic test framework was added; existing Vitest/Playwright/native Response/streams were reused after checking the library index's actual `data/INDEX.md` location. No indexed library was selected, so no library-index update was triggered.

## Commands and durable results

Every shell command was RTK-prefixed. All npm commands below used `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH`; paths are relative to the independent checkout unless absolute. Browser commands used at most2 workers, configured Chromium+Firefox, no retries and no timeout relaxation.

| Command after the common prefix | Exit | Result/evidence |
|---|---:|---|
| `npm ci` | 0 | Clean48-package install, zero reported vulnerabilities |
| `npm run check` | 0 | Frozen authored source typecheck |
| `npm test` | 0 | Original333 tests/22 files |
| `npm run build` | 0 | Production build; repeated after regression also0 |
| `OBSERVATORY_TEST_PRODUCTION=1 OBSERVATORY_TEST_PORT=5411 PLAYWRIGHT_JSON_OUTPUT_NAME=/var/tmp/interval-qa-4cf-feature.json npm run test:e2e -- tests/e2e/blockIntervals.spec.ts --workers=2 --reporter=json` | 0 |22 production passes,0 skipped/flaky/unexpected |
| `npm test -- tests/unit/blockIntervals.qa.test.ts --reporter=json --outputFile=/var/tmp/interval-qa-4cf-own-units.json` | 0 |5 new QA consumer passes |
| `OBSERVATORY_TEST_PRODUCTION=1 OBSERVATORY_TEST_PORT=5413 PLAYWRIGHT_JSON_OUTPUT_NAME=/var/tmp/interval-qa-4cf-own-main.json npm run test:e2e -- tests/e2e/blockIntervals.qa.spec.ts --workers=2 --reporter=json` | 0 |6 new QA production passes |
| `npm test -- --reporter=json --outputFile=/var/tmp/interval-qa-4cf-all-units.json` | 0 |351 tests/24 files |
| `OBSERVATORY_TEST_PRODUCTION=1 OBSERVATORY_TEST_PORT=5414 PLAYWRIGHT_JSON_OUTPUT_NAME=/var/tmp/interval-qa-4cf-review-counters.json npm run test:e2e -- tests/e2e/blockIntervals.counter.review.spec.ts --workers=2 --reporter=json` | 0 |2 copied reviewer production passes |
| `OBSERVATORY_TEST_PORT=5415 PLAYWRIGHT_JSON_OUTPUT_NAME=/var/tmp/interval-qa-4cf-configured-dev.json npm run test:e2e -- --workers=2 --reporter=json` | 1 |Configured DEV regression202/218 passed,16 failed |
| `npm run check` after probe typing correction | 0 |All final isolated probe types checked |

Three QA-fixture errors are disclosed separately, not product RED: initial own-unit run exit1 closed an already canceled native stream at8000ms; fixture cancellation bookkeeping was corrected without changing the boundary assertion, and `/var/tmp/interval-qa-4cf-own-units-fixture-error.json` retains that run. Initial own-browser port5412 run exit1 had4 passes/2 failures because the negative probe expected invented text `disagrees` rather than the actual `Observer context does not match observed header`; only that prerequisite assertion was corrected; `/var/tmp/interval-qa-4cf-own-main-fixture-error.json` retains it. A later check exited2 because my new Window cast lacked a global type declaration; adding that declaration alone restored check0. Production source was unchanged throughout. Final executed browser probe source is retained at `/var/tmp/interval-qa-4cf-own-main.executed.ts` (hash below); the isolated test subsequently gained only that erased TypeScript declaration.

The combined decoded production attachments, engine/status inventory and source/dist hashes are durable at `/var/tmp/interval-qa-4cf-decoded-evidence.json`. Qualified browser JSONs contain original inline attachments. My probe source files remain isolated at `tests/e2e/blockIntervals.qa.spec.ts` and `tests/unit/blockIntervals.qa.test.ts`; copied reviewer probes retain their original attribution. No prior reviewer run is used as my independent execution proof.

| Frozen/runtime artifact | SHA256 |
|---|---|
| `src/main.ts` | `e5776adf41fce20bb50b98246d6135382266825d1293a6d00c3b333271b06f18` |
| `src/rpc/blockIntervals.ts` | `1e5242ae319008703db1f874d387f8d5595b1f48510ac493ca042385119c6f3e` |
| `src/dashboardView.ts` | `f65041b1fcf51fa802afc0f442efa5f8e442b57b19e5bec68edd6e3df4c7af2a` |
| `src/dashboard.css` | `0a6a10999f2c9029ae0e8a9b10493da250bf9bc9ceafc3b47b419335c285bd97` |
| Served `dist/assets/index-Cs_wBeIA.js` | `7897701de22e731d897a576a6eff7cde1549323e7d9b7727693385655ad57c61` |
| Served `dist/assets/index-BtJToDP8.css` | `7de081ff7d21fb919784e7ee9e47c07db2d44cd9a684bc3ef144573c4c489a55` |
| Executed QA browser probe | `b002324f4f27398bf79f9ffbe13aa3abe223786872d3bc0b141fc9a6d07ca9ae` |
| Final probe with type declaration | `2df067b186f5c4f5e90f33e8b94eb470c557fc5880c71dab8cfd66087277ed9d` |
| QA unit probes | `49406bf4d92ee8d5cf08925320edfd3a7373cdb3ebcdd88ef0fca46312c2c415` |

## Authority and acceptance limits

Applied QA/project-authority/TypeScript/RTK instructions and technical-document-writing report guidance. Read the full active30FR/20AC/70claim metric contract, required KB properties, implementer brief/current integration handoff, original98 review, corrected4cf re-review and author-owned applied-listener-fix handoff. Inspected production collector/controller/main listener, actual fixture/config and tests. Source diff confirms collector byte-identical to98 and only the six-line applied-context correction in main. Current derived observer/head/network/source/full-header matching supplies proof; initial network identity supplies only chain association. No raw/proposal fallback or committee prerequisite was added.

Read/copy/hash/revision/diff commands exited0 except the disclosed initial bundled read of absent `vitest.config.ts` (exit1); the project's actual configured Vitest runs above succeeded. The user-visible library path has moved: repository README identifies `data/INDEX.md`, which was checked. `git diff --quiet -- src package.json package-lock.json playwright.config.ts` exited0. Full configured tests wrote six existing foundation screenshots inside the isolated checkout; four added probe files are untracked there. Root application/generated KB and other agents' work were not touched.

All393 mandatory claims remain binding. All20 official metric interfaces, original38 foundation interfaces,37 executable V3 interfaces plus fresh manual CHECK38, final combined production regression and complete state/viewport/theme/engine/composed-contrast matrix remain required after integration. No complete full-production regression was attempted at4cf: its five legacy private-import tests require the later compiled-fixture integration; DEV results are not relabelled production. The prior AC34 skip of unknown cause,30s goto timeout and225.5ms lost-frame watchpoints remain open whole-V3 context; green individual checks here do not close them. Final managed claims/context checks were not run as this bounded phase is not final combined acceptance. Any future runtime revision needs new source-bound evidence; the separate author UI fix is unverified by this report.
