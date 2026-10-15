# Independent whole-foundations QA — GO

**GO for the complete accepted Foundations contract at QA_SHA `8eb15c4558ae6062a6a66e8ea49804381f16ad4c`.** This new QA role is independent of the implementation author and whole reviewer. All 94 requirements, 38 acceptance criteria, 11 intake acceptance items and 29 clarifications remain in scope. No confirmed critical/high product defect or unexecuted original criterion remains. This is Foundations QA acceptance only; Astra implementation and its visual/accessibility/motion acceptance, publication and deployment remain separate.

The historical [69dacc8 NO-GO](observatory-foundations-whole-review.md), [correction disposition](observatory-foundations-whole-review-corrections.md) and [final independent whole-review GO](observatory-foundations-whole-review-final.md) retain their original revision and execution meanings. Their passing checks are inherited evidence, not counted as my execution below. The two original HIGH findings were independently replayed in this QA checkout.

## Revision, environment and source integrity

Detached worktree `/home/mathias/.cache/observatory-review/observatory-foundations-qa-8eb15c4`, HEAD exactly QA_SHA above; Node v22.23.3 from `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin`; task-owned TMPDIR `/home/mathias/.cache/observatory-review/qa-8eb15c4-tmp`; isolated browser port 5220. Every shell invocation used RTK. Temporary Playwright configuration changed only baseURL, webServer port and `npm run dev -- --port 5220 --strictPort`. Browser suites and the 38 standalone commands were run sequentially, without browser-port overlap.

The committed app/tests/checker/spec/glossary diff from reviewed root `89f1bd102089e41cef3c597b8be9048322b35953` to QA_SHA is empty. I recomputed all 50 actual `sourceSha256` entries from `roster/observatory-foundations/final-checks.json`; all match, and matched again after restoring probes/configuration/screenshots. Full values are in the own evidence directory below. Key hashes: main `daa5e0885ddb87e460b66f20aab0f74ff3ce561415890fc03c1e4a2094cc0d47`; store `bea4da8aac5bf6b5b4b1d1e4c6004815f687c0017770113bbc5aefef911f5437`; renderer `23b442db253bff8fa54264f347d2d50d3c5613c2085c98bb4a7715c574d0454b`; checker `ca0782ed94d5bf91eb26b14e3cab351bb785ecb8325de4864617ac5c43fdd1db`.

Native `rtk proxy node .harness/bin/claims-reconcile.js check` returned exit 0 and fresh for all three projections. The actual combined manifest `roster/observatory-v3/context.manifest.json` contains 323 mandatory claims: 170 Foundations and 153 V3; model `5c03c7a62d889f67edfaa3ade81eca950351071ecd7a1ac2da7ecb0f2ebca532`, freshness `ceb740eb6e894bacaa792db0bb79070c521775172cb2391a01c5f3bb1bed51fc`. The historical Foundations-only manifest remains 170 with freshness `113f75b401e86d28db76e2179c62d2a2323e83ab3f7d718f327edc60ccca8512`; it was not substituted for the current combined context. Generated normative KB was not edited.

Own reproducible evidence is `/home/mathias/.cache/observatory-review/qa-8eb15c4-evidence/`: original command logs and `original-results.json`, `source-hashes.json`, `numeric-oracle.mjs`, `targeted-replays.py`, `qa-targeted-probes.patch`, classifier injection scripts/patches/logs and classifier result JSON. These local evidence paths are operational provenance, not publication artifacts.

## Own ordinary gate execution

| Command | Actual result |
| --- | --- |
| `rtk proxy npm ci` | Exit 0, clean 48-package install, 0 vulnerabilities; no extraction/corruption errors |
| `rtk proxy npm run check` | Exit 0, TypeScript `tsc --noEmit` |
| `rtk proxy npm test` | Exit 0, 260 tests / 19 files, no skipped full-suite cases; observed completion terminal 98374 |
| `rtk proxy npm run test:e2e` | Corrected isolated run terminal 8820: exit 0, all 140 scenarios passed in Chromium and Firefox, 1.6 minutes |
| `rtk proxy npm run build` | Exit 0, 18 modules, JS 145.48 kB / gzip 41.64 kB; final restored-probe build also exit 0 |

Full browser-suite composition is **134 actual production `/` cases** (132 dashboard and 2 header) plus 6 existing legacy fixture-page cases (missingDelegates 2, nextOpportunities 4). Those six are regression coverage, not substitutes for any required production criterion. All 30 browser-required acceptance commands below independently completed the real production `/` scenario in both engines. The original native spelling of AC3/16/17/19/23 internally required both engines too. No lint script exists.

The first E2E attempt, terminal **61284**, changed baseURL/expected port without changing the Vite launch command; it completed exit 1 with `Timed out waiting 60000ms from config.webServer`, zero scenarios/assertions. I waited for that process to finish, corrected my local configuration, and then launched 8820. This is a preserved setup failure, neither product behavior RED nor passing evidence. Installation warned that esbuild's postinstall was blocked by the environment's allowScripts policy; the installed platform binary worked in the actual check/unit/browser/build executions. No permission policy was changed. The first build finished while the end of 8820 was still awaiting terminal observation; the final build was rerun after all browser/probe processes completed, with the same successful result.

## Original commands: all 38 newly executed at QA_SHA

Terminal **38416** completed exit 0. Commands were mechanically extracted from the accepted spec, not rewritten from the owner report. Every row below is a separate completed own execution with exit 0 and nonzero assertions, totaling 494 assertion groups. “Both” means the actual required Chromium and Firefox production scenarios finished and supplied the criterion completion annotation; “Native” means actual non-browser admission/accounting consumers.

| AC | Exact executed command | Exit | Groups | Engines |
| --- | --- | --- | --- | --- |
| AC-1 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-1` | 0 | 12 | Native |
| AC-2 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-2` | 0 | 11 | Native |
| AC-3 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-3` | 0 | 25 | Both |
| AC-4 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-4 --browsers chromium,firefox` | 0 | 7 | Both |
| AC-5 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-5 --browsers chromium,firefox` | 0 | 2 | Both |
| AC-6 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-6 --browsers chromium,firefox` | 0 | 2 | Both |
| AC-7 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-7 --browsers chromium,firefox` | 0 | 13 | Both |
| AC-8 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-8 --browsers chromium,firefox` | 0 | 2 | Both |
| AC-9 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-9` | 0 | 12 | Native |
| AC-10 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-10` | 0 | 7 | Native |
| AC-11 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-11` | 0 | 9 | Native |
| AC-12 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-12` | 0 | 29 | Native |
| AC-13 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-13 --browsers chromium,firefox` | 0 | 2 | Both |
| AC-14 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-14` | 0 | 32 | Native |
| AC-15 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-15 --browsers chromium,firefox` | 0 | 2 | Both |
| AC-16 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-16` | 0 | 13 | Both |
| AC-17 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-17` | 0 | 25 | Both |
| AC-18 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-18` | 0 | 21 | Native |
| AC-19 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-19` | 0 | 19 | Both |
| AC-20 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-20 --browsers chromium,firefox` | 0 | 2 | Both |
| AC-21 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-21 --browsers chromium,firefox` | 0 | 7 | Both |
| AC-22 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-22 --browsers chromium,firefox` | 0 | 14 | Both |
| AC-23 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-23` | 0 | 9 | Both |
| AC-24 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-24 --browsers chromium,firefox` | 0 | 10 | Both |
| AC-25 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-25 --browsers chromium,firefox` | 0 | 15 | Both |
| AC-26 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-26 --browsers chromium,firefox` | 0 | 2 | Both |
| AC-27 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-27 --browsers chromium,firefox` | 0 | 2 | Both |
| AC-28 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-28 --browsers chromium,firefox` | 0 | 13 | Both |
| AC-29 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-29 --browsers chromium,firefox` | 0 | 13 | Both |
| AC-30 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-30 --browsers chromium,firefox` | 0 | 20 | Both |
| AC-31 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-31 --browsers chromium,firefox` | 0 | 40 | Both |
| AC-32 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-32 --browsers chromium,firefox` | 0 | 15 | Both |
| AC-33 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-33 --browsers chromium,firefox` | 0 | 2 | Both |
| AC-34 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-34 --browsers chromium,firefox` | 0 | 33 | Both |
| AC-35 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-35 --browsers chromium,firefox` | 0 | 13 | Both |
| AC-36 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-36 --browsers chromium,firefox` | 0 | 13 | Both |
| AC-37 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-37 --browsers chromium,firefox` | 0 | 13 | Both |
| AC-38 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-38 --browsers chromium,firefox` | 0 | 13 | Both |

## Independent targeted reproductions and numerical proof

**Original retired observed-quorum counterexample: PASS.** I reinjected the preserved reviewer reproduction into the existing test file with a distinct QA title, not a new test framework. Actual `ObservationStore` plus `NetworkData.reconcile` admitted D1=3/D2=2, total 5, threshold 4 and emitted the original first observed-quorum event. The test then really removed the original history/event owners through 151 subsequent payloads, removed its raw operation through 10000 unrelated entries, and replayed the exact operation with receipt 20000. The assertion confirms no original phase event is appended. My full 260 suite, full browser suite and fresh AC31/32 additionally executed the stronger committed assertions: reconstructed power/maximum 5, threshold 4, quorumObserved and uncertainty true, original B provenance/new as-of receipt, independent 10000 raw / 150 history / 500 phase / 12 event bounds and unchanged retained sibling events. The real page shows 5/5 and threshold 4 after replay without a duplicate event. AC31/32 also completed true below-to-crossing, true first-quorum, separate fresh-source B and unrelated-raw-loss controls; these are not inferred from the absence of a duplicate alone.

**Original autonomous B counterexample plus own lifecycle extension: PASS in both engines.** I reinjected the original browser reproduction: initial hidden state, no A head stream message, A's first head request held, actual B head 122 and rights/context for target 123. Its read-only hook around the actual store accept confirmed admitted Mainnet pre power 600 before the production assertion. The page shows 600/30000, deficit 19400, opposite phase unavailable, exact B context 122/target 123, primary applied data unavailable and independent applied clock unavailable. The existing strengthened AC3 assertions also passed separately. My added assertions pin the admitted B identity, pause, search its actual committee address and verify Received versus Partial / unavailable phase states. Pagehide/pageshow plus hidden/visible restoration preserve manual pause and retained power; Latest and Follow remain local. The exact recorded request count remains unchanged through these paused actions. This proves a real source-local production consumer, not a mocked view model or asserted URL alone.

**Asymmetric phase basis: PASS at real retained-store and real reader.** I separately reinjected the preserved numeric retained-store reproduction: 50 rights of power 600, pre600/30000 at threshold20000, supporting raw eviction, a corrected threshold600 and a new attestation600. Independent BigInt deficit is 20000−600=19400; pre retains threshold20000 while att uses600. Captured maximum committees sum independently to30000 with maximum thresholds20000/600 respectively. The actual production reader regression completed in both engines during my full suite and shows the same distinct captions/gauges. The targeted unit invocation completed 2 tests, with the other 71 intentionally filtered; this is additional focused evidence, not a substitute for the unfiltered260 gate. Targeted terminal **41295** returned0; its browser JSON has expected2/unexpected0/skipped0/flaky0 and runtime/import fences remained enabled.

**New own exact-integer oracle: PASS, 127 assertions.** `numeric-oracle.mjs` uses existing Vite to import the actual production guards, phase accounting and timing modules. Expected power comes from independently declared BigInt delegate weights and unique membership sets. It checks individual/overlapping aggregate replay, conflict attribution without source/payload union, separate pre/att membership, powers3/4/5 around threshold4, deficits1/0/0 and shares60/80/100; atomic malformed aggregate rejection; cumulative safe boundary9007199254740991 and unsafe successor, negative/fractional/nonfinite values. Timing expectations independently sum round durations for six rounds at minimum1 and increments2/3/20 and compare start/end boundaries, both conditional branches, selected-relative starts and calendar extrema. These finite cases supplement, rather than reimplement, the actual product consumers. No new dependency or generic test infrastructure was selected; the canonical library index was checked and the existing project modules/Vitest/Playwright/Vite were reused.

## Actual checker failure classification

I read the complete checker and existing classifier tests, then injected faults into the actual AC3 production scenario and invoked the **original no-flags CLI**, sequentially at terminal68202. The original file was restored in a finally block.

| Deliberate execution | Actual exit | Interpretation |
| --- | --- | --- |
| Chromium matcher failure + Firefox runtime error | 2 | Runtime fault outranks behavior assertion |
| Firefox matcher failure + Chromium runtime error | 2 | Same priority in reverse engine ordering |
| Firefox skipped | 2 | Required engine not completed |
| Both scenarios skipped | 2 | No completed assertion execution |
| Chromium matcher assertion only; Firefox complete | 1 | Genuine specified behavior assertion RED |
| Required scenario renamed away from grep | 2 | Missing scenario/report execution |
| Unmodified original AC3 | 0 | 25 completed groups, both engines; own original-command run |

The runtime logs preserve `QA injected runtime before completed assertions`; they are not JSON-capture/setup failures mislabelled as priority proof. A separate own invocation of the real exported classifier completed ten cases: undefined/null/missing/empty report, empty tests, either missing engine, skipped result, empty results, absent completion annotation all raise execution errors; two completed verified engines return2 completed assertions. These deliberate failures are checker proofs, not unresolved application defects. The full260 suite also exercised wrong criterion, repeated/missing results and runner-status inconsistency.

## Complete contract reconciliation

I read the full accepted wording, including all94FR/38AC/11intake items/29clarifications, then reconciled it with actual source and the executed assertions. Count/hash parity alone did not decide the verdict. The following rows state the material behaviors actually exercised; every linked AC was newly executed above.

| Accepted scope | Own executed evidence and result |
| --- | --- |
| FR001–012; intake1/4; C1–4 | AC1/9/10/11/12 plus own BigInt oracle: distinct shared-payload candidates, no inferred producer/signature, exact unique phase/payload powers and conflicts, whole-operation rejection, contradictory/incomplete committee withdrawal, safe arithmetic and strict timezone/calendar guards PASS |
| FR013–024; intake2/3; C5–8/28 | AC2/13/14/15/16/36 and full-page cases: coherent post-establishment validated-category zero versus earlier/omitted/truncated/malformed/oversized/context-spanning inputs; source-scoped partial positives, interrupted live zero, retained receipts, monotonic age and independent observed progress versus transport/prediction PASS |
| FR025–038; intake5/6; C9–11/27 | AC3/17/18/19/23/30/35: own-observer current/current+1 admission, absent-primary B replay, exact chain/head/parent/execution context, delayed H1 rejection/reorg withdrawal, coherent cache reuse,15s boundary/coalescing/manual retry, configured provider pool,3workers/no Mainnet fanout PASS |
| FR039–044; intake7; C12/13 | AC4/20/21 plus own B extension and full-page delayed-body cases: initially hidden0reads; pause/hidden/pagehide cancel stream/helper/alias/comparison work; manual pause survives pageshow/BFCache event restoration; fresh generations reject late same-context bodies; local inspection starts no reads PASS |
| FR045–057/091/093; intake9; C14–17/29 | AC5/22/23/24/25/37: independent150history/100active/100unresolved/100facts/10000raw bounds, lexical first-receipt ties, no replay refresh or huge-height priority, promotion dedup, protected retained pin/enrichment, static history-eviction freeze, newer first-arrival units, Latest versus Follow, explicit no-live result and nonarchival reload loss PASS |
| FR058–063; intake10; C18/19 | AC6/26/27 and own paused B committee: trimmed alias OR address substring, validated-rights membership, received/absent/unknown phase distinctions, exact share and context/eligibility, raw unknown signers, explicit address/alias/power tie order, append/pending exclusion and stable focus/scroll/disclosure/search PASS |
| FR064–076/090/094; intake11; C20–22/27 | AC7/28/29/30/35/38: exact head-only agreement/divergence/historical partial, independently captured source/rights provenance, identity→head→pending default read order,3reads/8s full body/24s/second-click bound, redirect rejection, malformed bodies, shared raw retention/as-of positive facts, no union/retry/cascade/poll, sticky60s staleness and synchronous context/pause cancellation PASS |
| FR077–081/092; intake8; C23/24 | AC8/31/32, original retired-event replay and stronger page/store controls: actual below-to-threshold crossing versus first quorum, phase/source/context separation, immutable exact maxima and original event objects,12event independence, retired replay/reorg return without duplicate or unprovable crossing PASS |
| FR082–089; intake2/4/8; C25/26 | AC33/34 and full S9 cases: actual applied level/round/time/hash versus selected candidate and future hash unknown; both selected-relative branches coexist with independently proven proposer/timer or unavailable state, missing/conflicting rights/timing, migration uncertainty, finite/calendar guards, captured historical deadline/remaining/provenance, expiry without observed transition, actual same-level/next-level/reorg/skipped transitions PASS |

The critical cross-interactions were observed together, including supported raw loss plus asymmetric retained phase rendering; full event/history/phase/raw retirement plus exact operation replay; source/provider/reorg changes plus historical pin and late bodies; source-local B admission with no primary snapshot plus paused committee/lifecycle actions; and comparison shared capacity/cancelled bodies with unchanged LIVE power/events. This is finite controlled-fixture evidence, not a claim that every possible provider/protocol input was enumerated.

## Saved actual-origin facts and limits

I inspected the saved `811c7f6d13cda3d77cfb082bab68a98734db9986` report, response structures and complete adjudication, verified their SHA256 values, and recomputed supported response facts in my own oracle. Responses SHA is `17e4be3502f7ba75ad21c5651136801f2ea4db2141d6dbfac58fc692d762c731`; adjudication SHA is `c6090252b1ef407080d059d9762cb9774a3491679716f389cb341560c5808c41`. No new public RPC GET was made.

The saved26GET sample is limited to2026-10-15 03:57:55.588–03:58:00.553UTC with app assets blocked. My oracle parsed all14headers through the actual guard, checked both13read ledgers, reconstructed Shadownet25unique delegates/slots,7000power, threshold4667 and1zero-power delegate; Mainnet rights403 remains unknown. Independent exact arithmetic gives `03:51:18 + (6+182×3)s = 04:00:30UTC`, matching the saved estimated_time. No pending/vote/baking reads occurred: these saved facts establish no phase zero, actual signers, proposer, crossing, finality, provider completeness or deployed timer. I did not independently re-fetch immutable Octez sources; the protocol applicability source review remains attributed to the prior independent whole reviewer, while my own controlled tests verify the accepted product contract and arithmetic on final source.

## Read scope and final restoration

Own reads include the entire fresh-QA assignment and qa skill, supplied AGENTS/RTK, project authority and TypeScript patterns; full607-line accepted specification (smaller overlapping rereads recovered truncated challenge/story output), full232-line QA scope including intake and all29decisions; whole implementation/parity reports; current human glossary; historical NO-GO, complete correction disposition, final whole GO and integration disposition; saved-origin report/adjudication and machine-parsed response facts; all original checker branches and complete classifier tests; package/Vite/Playwright configuration. The report follows the technical-document-writing skill and project glossary.

Actual production source was inspected directly: complete `main.ts`, `dashboardView.ts`, `observationStore.ts`, `phaseEvidence.ts`, `roundSchedule.ts`, `opportunityFacts.ts`, `observerReconciliation.ts`, `headGeneration.ts`, `guards.ts`, `sourceComparison.ts`; `networkData.ts`160–end covering lifecycle, contexts, rights/constants, complete-body requests, pending, derive/reconcile, aliases/baking/eligibility; `networkMonitor.ts`130–445 covering stream entrypoints, lifecycle, admission, progression and local controls. Browser test setup and all required named acceptance scenarios were inspected directly, with narrow rereads for long lines; unit test fixtures/original-event/asymmetric/opportunity consumers were inspected where used. Unchanged unrelated source files were executed in the full suites and source-hashed, not claimed fully line-reviewed. This QA does not inherit the whole reviewer's longer code-read ledger as its own.

Own tests and fault injections were restored, configuration and six generated tracked PNGs restored, exact QA_SHA reconfirmed and `git status --porcelain` empty. All50 source hashes were rechecked after restoration. Repro scripts and patches remain only in the separate own evidence directory. The sole authorized root write is this report, without commit; no owner/root application edits, generated-KB edits, subagent, automatic GO ledger, Astra call, push or deployment occurred.

No required Foundations gate remains inconclusive after the completed corrected executions. The initial setup timeout remains accurately recorded above. Later Astra theme/viewport/contrast/motion/manual visual review, publication/GitHub Pages execution and deployed-asset verification were not performed and are not granted by this GO.
