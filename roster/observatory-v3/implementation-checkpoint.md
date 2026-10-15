# Observatory V3 combined implementation checkpoint

This author checkpoint delivers the observation workspace, source-qualified consensus navigation and the three empirical block-interval windows for independent review. It is not a deployment or an independent review/QA verdict. The exact revision is the commit containing this report; final source/build fingerprints and artifacts are produced by `sourceBindings()` after the source is frozen.

## Product changes to inspect

| Area | Implementation and user effect | Review focus |
| --- | --- | --- |
| Observation workspace | `src/dashboardView.ts`, `src/dashboard.css`, native SVG mark: previous LEFT, selected CENTER, conditional same-level round UP, conditional next-level RIGHT; useful desktop and ultrawide regions; simultaneous phone branches | Actual states, composed colors, font/target sizes, useful space, exact known/unknown labels |
| Navigation and motion | `src/main.ts`, authoritative retained selectable-unit projection, observed navigator and session controls | Candidate selection pins; Previous preserves promotions and sibling receipts; only genuine adjacent observations animate; frozen pins and reduced motion |
| Source-qualified meaning | `src/observationMeaning.ts`, four-line monitor view projection, dashboard labels | Exact source/chain/header/tuple/hash compatibility. Already-applied votes never imply next-level progress. Age uses the actual material proven receipt, preserves duplicate identity, and advances on A→B→A even when context is cached |
| Phase coverage and producer | Previously independently scoped corrections and their current consumers remain integrated | Per-phase qualified zero, partial-positive manual retry, retained/frozen behavior; real block baker metadata remains distinct from expected proposer and shared payload |
| Block intervals | `src/rpc/blockIntervals.ts` copied unchanged from reviewed metric runtime; main lifecycle/render/current derived-context hunks; compact interval region | Initial expected chain is only association. Current snapshot observer proof authorizes triggers. Three windows retain exact coverage seconds and readable duration; no inferred chain health |
| Production verification | Vite shared inspection ESM entry; production-default Playwright; ordinary versus release discovery | Same live classes, side-effect-free import, all browser tests served from dist; no dev fallback or fake fixture renderer |
| Evidence consumers | `scripts/v3-evidence-contract.mjs`, package script, V3/metric guarded commands and inventories | Exhaustive source/build/contract hashes, all70×36 cells, actual native observations, independent actor receipts, missing/runtime ERROR precedence |

The metric port preserves the reviewed current `derived.contexts` admission predicate rather than substituting the new readonly `appliedProof` field. The latter is used solely for the qualified UI meaning and session-observed age. No new network read was added for that projection. Source/chain mismatch or missing matching proof gives unknown age and unknown relationship.

## Test adaptation register

| Scenario family | Necessary precondition adaptation | Assertions retained |
| --- | --- | --- |
| Candidate inspection previously implicit LIVE | Explicit Follow where a scenario needs ongoing live capture; establish actual candidate-specific known facts before pin where historical known facts are required | Exact values, phase thresholds, source/context/identity, historical deadlines and provenance |
| S9 delayed pending body | Claim the delay gate only after the matching response body is ready and not already aborted | Real AbortSignal, late poisoning cannot replace selected candidate, B unknown versus Follow live versus historical pin |
| S9 missing rights / activation | Await actual known current candidate timing before Inspect; complementary early-pin test holds the body and proves unknown remains unknown | Original post-pin timing/rights/migration assertions, abort/no retroactive enrichment, independent vote enrichment |
| AC13 settled/rapid bursts | Separate actual settled initial focus/scroll from uninterrupted rapid accepted arrivals | Exact destination, UP/RIGHT axes, Y stability, one animation, ≤200ms final settlement, ≤1px scroll and preserved focus |
| AC07 focused corrected alias | Establish the focused pending-exclusion state after each matrix cell's Appearance interaction | Focused nonmatch remains pending until blur; then excluded and recoverable by clearing search |
| Metric reader boundary | Anchor59s to the actual first request's monotonic receipt, pause only for the exact boundary observation and resume rendering afterward | Disabled before60s, enabled afterward, original read counts, lifecycle cancellation, retained evidence and reader state |

The last row corrects an unanchored development fixture. The initial combined run had22 passed,2 reader failures,1 obsolete-combobox matrix timeout and21 unexecuted tests. An isolated instrumented run passed and does not retrospectively prove those failures' cause. The subsequent anchored reader passed both engines. All failed and interrupted development reports are retained.

## Author evidence and its limits

Development evidence resides in the authorized private local directory `/var/tmp/tezos-observatory-evidence-cg92wqle`. It remains available to reviewers; paths are not public deployment assets. The final bundle will contain exhaustive relative artifact links and SHA256 values, with the production build and source inventory checked again at consumption. Large images remain outside Git; small source-bound manifests and reproducible native tests remain in Git.

- `applied-semantics-red.json` establishes the missing misleading applied/next-level distinction; `applied-semantics-green03.json` passed both real engines before the metric port. Later combined test strengthened transient-unknown preconditions by requiring a strictly newer numeric proof receipt before checking duplicate stability.
- `combined-all-units02.log`:353 author unit tests pass, including source-meaning/cache-return, actual discovery difference, native physical-window missing-both RED→GREEN and V3 malformed-summary RED→GREEN.
- `combined-metrics-browser02.json`:44 passed,2 reader timeouts during fixture clock consolidation; all11 metric matrix states passed both engines. These are development captures, not final signed acceptance.
- `native-combined02.json`:actual browser Ctrl+plus zoom passed both engines after distinguishing the real Chromium scrollbar from horizontal overflow. The normal base matrix retains exact viewport-width checks; native zoom requires document width no greater than the inner viewport and all meaningful region bounds.
- `native-combined01.json`:both native tooltip tests passed; actual isolated short-phone glyph crops were visually inspected by the author. Final36-cell tooltip capture and independent interpretation remain mandatory.
- `final-targeted-development01.json`:18/18 passed across both engines, including the corrected AC07 matrix, applied-tuple/duplicate scenario, anchored metric reader and nine additional metric surfaces. `codecomplete-preview-development01.json`:6/6 passed with current metric values, real lifecycle request/abort receipts and actual system-preference transitions.
- `missing-release-guard.log`:official AC25 without the release bundle returns ERROR2, with its raw two-engine report preserved.

The full original production regression, all38 foundation commands, all37 automatic V3 commands, manual CHECK38, all20 metric commands, final70×36 matrix and fresh independent whole-source review/QA remain required on the frozen combined candidate. Scoped earlier approvals are retained as history and do not substitute for these gates. Historical AC34 missing progression, navigation timeout and225.5ms burst measurements remain disclosed watchpoints until final source verification; missing historical frame data is not reconstructed or waived.

## CI and release scopes

`npm run test:e2e` runs ordinary actual-product specs in both engines. `playwright.v3.config.ts` additionally discovers the five tests in `v3Release.ts` that require complete source-bound release evidence and independent receipts. The official37 command interfaces and criterion mappings are unchanged. No conditional skip or author-created GO file exists. Independent reviewer/QA sub-receipts can be issued before the aggregate release verdict; their absence remains execution ERROR.

The shared source inventory includes `src/`, `tests/`, `scripts/`, package manifests, README, tsconfig, Vite/Playwright configs, both V3 inventories and both metric inventories. Contracts bind all three task specs and the authority map. Production binds every emitted dist file. Mutation of an actual consumer, compiler input or render inventory therefore invalidates the final receipts.

## Independent clean-checkout correction

Independent review found that dc89's discovery regression eagerly evaluated production bindings while listing tests, before CI built `dist`. Existing author build output had concealed the failure. The author reproduced it with `dist` genuinely absent (`clean-discovery-red.log`), then moved binding acquisition into actual capture execution in the three capture helpers. Listing does not inspect or synthesize build evidence; real captures still call the unchanged strict `sourceBindings()` and require actual assets.

The exact clean order `npm ci → npm run check → npm test → npm run build` now passes (`clean-ci-green.log`,353 units). The dc89 matrix was interrupted with exit130 and explicitly marked `INTERRUPTED_NOT_RELEASE_EVIDENCE`; its partial cells will not be reused for the corrected source. Independent review must renew this finding on the new immutable checkpoint.


## Independent review correction batch after f75

The current source is the commit containing this report, on top of `f75cfe64c836a9e1efe620861184e75dc7bd2f2d`. No final acceptance is asserted. The root-generated active context manifest was copied verbatim at393 obligations; original contract prose is unchanged.

- **FR005 phase provenance.** `src/phaseProvenance.ts` formats each actual phase receipt, observer/context and separate rights-helper receipt. `main.ts` uses deduplicated Group.preEvidence/attEvidence for positive LIVE phases and the real snapshot receipt for qualified zero. Each gauge exposes its own receipt time and monotonic age in a native disclosure. Retained/frozen rendering uses the captured current receipt, not the selected-record first receipt or the maximum receipt. The only domain delta is readonly `AcceptedPhase.currentEvidence`, assigned the evidence already calculated by `refreshAcceptedPhases`; first and peak meanings, power, admission, collection and network reads are unchanged. A rights-basis change does not invent a new vote receipt. Equal-power membership replacement can update the real receipt. The existing expanded-provenance matrix now opens these disclosures too.
- **Exhaustive production binding.** `productionFiles()` is shared by binding generation and the real loader. The loader requires exact dist file keys before hashing each asset. Synthetic native-loader fixtures explicitly identify themselves as unit inputs, not UI or independent receipts. An omitted imported asset, mutation of that unbound asset and an extra declared asset all produce execution errors.
- **Causal settlement bound.** The test records the first coherent acceptance of the exact final candidate, then measures to the first settled destination frame. Missing coherent admission or sufficient frame evidence is execution ERROR. The0ms admission/80ms first frame/240ms settled counterexample now measures240ms and violates200ms; it no longer passes as160ms. Production animation code is unchanged.

Retained evidence in the private evidence root: `phase-receipts-red.json` (two actual engines missing phase observable), `phase-receipts-green02.json` (two stagger/replay/pin passes), `phase-domain-red.log` / `phase-domain-green.log` (current receipt absent versus implemented; decrease/basis/replay/frozen and equal-power replacement), `production-inventory-red.log` / `production-inventory-green.log` (actual loader), and `burst-origin-red.log` / `burst-origin-green.log` (causal counterexample). `review-batch-browser02.json` passes10 actual-production scenarios across both engines: staggered receipts with visible independent ages and freeze, reciprocal zero phases and settled/rapid bursts. The previous `review-batch-browser01.json` also retains all raw admission/frame traces; its causal durations were184.9/180.7ms Chromium and169/163ms Firefox. These are author correction proofs, not independent final QA.

The dc89 interrupted matrix remains archived with explicit `INTERRUPTED_NOT_RELEASE_EVIDENCE`; all failed intermediate reports remain available. No full matrix is restarted during the review batch. Final clean CI/product regression, foundation38, V3 automatic37, metrics20, complete matrix/native surfaces, independent receipts and manual38 remain outstanding on the eventual immutable source. The prior medium function-size findings are disclosed; the cohesive phase formatter was extracted without rewriting the reviewed interval collector or broadly refactoring the dashboard.

## Maintainer delivery scope amendment

The maintainer's latest instruction, “sois pragmatique, le mieux est l’ennemi du bien”, supersedes the exhaustive delivery sequence above. This delivery closes exactly the three confirmed HIGH findings, then uses independent focused correction review, the core ordinary regression suite, essential390-short/1440/3440 light/dark captures in both engines, and actual live interval/source validation. The70×36 matrix and broader exhaustive acceptance obligations are deferred for this delivery, not reported PASS or silently removed from their registered contracts. No further enhancement or broad refactoring is included. Author358 units passed with dist absent; final check and build passed. Independent correction review and the reduced delivery checks still require their own evidence.


## Pragmatic causal animation correction

Fresh independent ordinary QA on47848a5 measured226.9ms and212.5ms admission-to-settlement, preserving the strict200ms requirement. The old renderer started a new160ms animation only after deferred view rendering. An author adversarial case adds70ms of synchronous view work after acceptance; the unchanged product failed319.5ms Chromium/259ms Firefox (`camera-budget-red.json`).

The minimal correction captures `NetworkMonitorView.emittedMonotonic` before view construction. Main retains one UI timing owner for the coherent followed destination; duplicate/power updates retain its first emission, while A→B→A receives a new emission. This is explicitly UI delivery timing, never chain or vote evidence. The navigator preserves WAAPI duration160ms but assigns a document-timeline start time advanced by the elapsed delivery age. Expired, negative or absent timing snaps; gap/reorg/reduced-motion cancellation and anchor logic are unchanged. No acquisition, admission, numerical or collection semantics changed.

An intermediate currentTime-only attempt remained insufficient because pending playback deferred the effective start; its three Chromium failures are retained in `camera-budget-green01.json`. The explicit startTime correction passed six actual-production cases (`camera-budget-green02.json`): original settled/rapid plus injected render delay in both engines, measured110.6–184ms.360 units pass (`camera-budget-units.log`), including duplicate owner, A→B→A, negative/nonfinite and exhausted budget cases. Final targeted verification additionally includes UP/duplicate stability and immediate reduced-motion cancellation. All raw frame/admission receipts are preserved; no threshold, arrival wait or assertion was relaxed. Independent focused review and integrated delivery QA must renew this timing-only delta.
