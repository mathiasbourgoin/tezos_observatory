# Block-interval metrics: isolated integration checkpoint

Integrate the bounded collector and its small view/lifecycle seams into Astra's current V3 source. Preserve Astra's layout, native appearance controls, compiled inspection entry and production-default test configuration. This checkpoint is author evidence for isolated integration; the Full implementation phase remains OPEN and final combined approval is not established.

## Production changes to port

The application comparison base is `49c74935ae82f5ff0f48dc50b9ace6c76caf4dd0`. Task contracts and baseline repairs predate the feature; do not replace current V3 files with this older checkout.

| File | Minimal integration action |
| --- | --- |
| `src/rpc/blockIntervals.ts` | Add the self-contained bounded collector/controller unchanged from the reviewed `4cf199c58be940eed2a5de8fbd9ff3b7fce92714` runtime. No dependencies or monitor semantics changed. |
| `src/main.ts` | Add the `BlockIntervals` import, `Runtime.intervals`, constructor callback, native refresh callback and lifecycle enable/disable calls. Decorate every dashboard render path with `blockIntervals: runtime.intervals.view()` through the small `updateDashboard` helper. |
| `src/main.ts` monitor callback | Port the current accepted observer proof selection and `intervals.appliedHead` call immediately after assigning `runtime.view`. Match snapshot current head via `observedHeaderMatches`, configured source/network and initialized chain. `view.networkIdentity` supplies ONLY initialized chain association, never the current header. |
| `src/dashboardView.ts` | Add the optional interval model/callback, `blockIntervalRegion` and persistent region update. Place the region compactly in current V3; preserve all current V3 DOM and controls. |
| `src/dashboard.css` | Port only the interval selectors listed below. Critical interval text is explicitly 14px and expanded source evidence 12px; prior rem sizing produced actual 10.5px at the existing product root. |
| `src/rpc/networkData.ts` | Already independently reviewed shared-context cancellation repair from `97eca770e3b1bd7969e5334bef393a919c60063f`; avoid duplicating or reverting it in Astra, where it is already integrated. |

To inspect precise runtime insertion hunks, run `rtk git diff 49c74935ae82f5ff0f48dc50b9ace6c76caf4dd0 HEAD -- src/main.ts src/dashboardView.ts src/dashboard.css src/rpc/blockIntervals.ts`. Runtime/main have not changed since 4cf during subsequent independent review/QA; the later production delta is interval typography only.

The scoped CSS selectors are `.block-intervals`, `.interval-header` (including its button), `.interval-windows`, `.interval-window`, `.interval-mean`, `.interval-coverage`, `.interval-endpoints`, `.interval-note`, `.interval-status`, `.interval-evidence`, `.interval-details summary`, and the <=600px `.interval-windows` stacking rule. Use current theme tokens. No masthead, navigator, radio or global selector replacement is needed.

## Actual author verification

All exact spec CHECK-1 through CHECK-20 native commands executed on one frozen source tree. The official metric runner source fingerprint was `d9b4f878b6de048b241a8f962a427f079e4d4fed000d30c4f977be9130555a43`. Nineteen returned exit0; CHECK-15 returned ERROR2 because the isolated checkout intentionally lacks the pending shared `v3-evidence-contract.mjs` and final independent bundle. No receipt was authored to turn that error green. The sequential native results are `/var/tmp/block-intervals-official-all.json`; individual logs are `/var/tmp/block-intervals-official-AC-N.log`. Every executed native run has its own source-hashed `evidence.json`, raw subprocess logs and native reports. Each nonvisual check executed all42 feature unit cases with139 measured native assertions; CHECK-16 additionally executed7 documentation assertions and actual fresh managed-claims verification. Required reader checks additionally executed28 actual served-dist Chromium/Firefox scenarios, including the two inherited burst cases in both engines.

The isolated author matrix passed22 scenarios: 11 actual states ×9 viewports ×2 themes ×2 engines =396 cells. `/var/tmp/block-intervals-matrix-preflight-qualified` contains396 screenshots,396 composed-color/overflow measurements and396 metric DOM sidecars; all396 render statuses are PASS. `/var/tmp/block-intervals-matrix-all.json` is the native terminal report. The capture helper source fingerprint is `a59271ed1efcd43c1aadb27ce355b2ae3afb0cf36eac5ecd6c49f9c6bdf1bbff`; this helper's inherited source selection is narrower than the official metric runner's source binding. These are development preflight artifacts, not retrospectively signed final combined captures.

Final author TypeScript checking, all339 unit tests and the production build passed on this checkpoint source.

The actual 10.5px evidence-font defect had a genuine production RED in both engines before the scoped 12px/14px correction, then GREEN in both: `/var/tmp/block-intervals-font-red.json` and `/var/tmp/block-intervals-font-green.json`. This author correction still requires fresh source-bound independent QA in the combined UI.

The former main-listener defect, its independent production RED and minimal correction are documented in `applied-listener-fix.md`. The initial network identity retained the first applied header, so later accepted heads were skipped; actual current snapshot observer proofs now reach the metric controller. Do not reinstate the original header-equality check while merging.

## Test and evidence integration

Keep `tests/unit/blockIntervals.test.ts`, `tests/e2e/blockIntervals.spec.ts` and `scripts/check-observatory-block-intervals.mjs`. The official runner checks native result inventories, actual assertion counts, both real engines, no skips/retries and runtime-error precedence; it is not a separate implementation of the metrics. Preserve existing V3 test fixtures and their independently corrected known-before-pin/S9 body ownership preconditions. The isolated `OBSERVATORY_TEST_PRODUCTION=1` opt-in in `playwright.config.ts` exists only for development against49c. Final combined configuration must retain Astra's production-default build/preview and compiled inspection entry. Adapt the few metric Appearance `selectOption` calls to Astra's existing native radio helper; do not reintroduce the select UI.

The metric rendering inventory is `roster/observatory-block-intervals/render-variants.json`; execution inventory is `check-coverage.json`. The11 variants are `metric-values`, `metric-partial`, `metric-insufficient`, `metric-window-unavailable`, `metric-no-prior-unavailable`, `metric-loading`, `metric-refreshing-retained`, `metric-stale-retained`, `metric-whole-failure-retained`, `metric-long-details`, `metric-prohibited-not-collected`. Each requires36 distinct cells.

The10 additional surfaces are `metric-system-light`, `metric-system-dark`, `metric-storage-missing`, `metric-storage-corrupt`, `metric-storage-denied`, `metric-zoom-200`, `metric-refresh-focus`, `metric-refresh-disabled`, `metric-details-open`, `metric-reader-preservation`. Their final actual native records have not been produced by this checkpoint. In particular author matrix screenshots do not replace native browser zoom or independent visual judgment.

A following checkpoint will strengthen the existing AC-15 consumer to validate metric DOM sidecars against the shared parent render, its screenshot SHA256 and the exact source/contract/production bindings. Shared `surfaceEvidence['observatory-block-intervals/'+variant]` will link36 hashed metric records per state. It must additionally require all10 measured native surfaces and distinct fresh reviewer/QA visual receipts for `observatory-block-intervals/AC-15`. Existing final V3-only evidence cannot satisfy the metric contract. Final shared source selection must include both metric inventory files so changing an inventory invalidates independent receipts. No new generic receipt framework is needed.

## Open acceptance boundary

Root owns combined integration, fresh independent review/QA, the original38 foundation checks, all37 automatic V3 checks plus manual CHECK38, all20 metric checks including AC-15, authoritative393 managed claims and final publication. The earlier225.5ms burst watchpoint and qualified baseline history remain in `implementation-interface-handoff.md`; source changes do not erase failed or interrupted runs. Root has separately recorded the independent DEV regression FAIL and causal fixture investigations; this checkpoint does not override their verdicts. Final acceptance must use the actual combined revision and build.
