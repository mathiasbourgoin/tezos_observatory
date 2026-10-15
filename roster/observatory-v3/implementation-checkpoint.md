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
