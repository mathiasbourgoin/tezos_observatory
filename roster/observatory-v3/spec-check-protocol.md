# Planned production check protocol — observatory-v3

Specification preparation, 14 October 2026. This is the accepted check/evidence protocol for the forthcoming implementation, not an implemented runner or a passing-test report. Reuse existing TypeScript/native DOM/SVG and Playwright. No generic test infrastructure or library is selected by this document.

## Authentic consumer and exit classification

V3 automated acceptance runs the actual production entrypoint `/` with deterministic source/RPC streams; component-only fixtures, study pages and directly injected view models cannot substitute. Assertions exercise received observations through normal production assembly, DOM controls and rendered geometry. Include authentic-success-path and fail-closed-path cases: coherent actual observations succeed; unknown/incoherent/missing context remains visibly unavailable and cannot become observed motion, power or future certainty.

Use a self-contained builtin Node guarded loader for each planned acceptance command:

```bash
rtk proxy node --input-type=module -e 'try { const m = await import("./scripts/check-observatory-v3.mjs"); if (typeof m.run !== "function") throw new Error("check runner export missing"); const code = await m.run(process.argv.slice(1)); if (![0, 1, 2].includes(code)) throw new Error("invalid check result"); process.exitCode = code; } catch (error) { console.error(error); process.exitCode = 2; }' AC-N --browsers chromium,firefox
```

The planned domain-specific runner exports `run(args)` returning0 only after that acceptance criterion actually runs and passes,1 only for its behavioral assertion,2 for execution errors. Entrypoint existence/syntax, browser binaries, fixture/source setup and required evidence paths are preflighted before any red comparison. Import/compile/runtime failures, browser launch failures, missing/malformed fixture/report and unsupported AC arguments are errors; never downgrade or skip them into PASS. A test framework's generic exit1 and Node's missing-file exit1 are not behavioral evidence. The guard itself classifies missing/import errors as2 today; the absent runner means no V3 acceptance is currently executable or passed.

The foundation38 command interfaces remain unchanged. Their orchestrator preflights entrypoint existence/syntax and required execution environment before interpreting red evidence; a missing runner cannot be counted as an assertion. Preserve current94FR/38AC semantics including FR-091–094, not the earlier90FR projection. Complete Node22 install/check/unit/Chromium+Firefox production-e2e/build gates remain additional release obligations. No separate lint command exists.

## Full mapped rendered matrix

Required bases are360×800,390×844,768×1024,1440×900,1920×1080,2560×1440,3440×1440,5120×1440, additionally390×568. Each runs light and dark in Chromium and Firefox. Each named applicable component/state variant below has actual screenshot, geometry and contrast evidence at every base. Mutually exclusive states are individually exercised; irrelevant exponential incompatible-state combinations are not required. The report enumerates rows with exact state/interaction, engine, width/height, theme, source revision, artifact path, measurement and PASS/FAIL/ERROR. Untested/missing data never become PASS.

- Loading and empty/unknown observations; observed block available; votes-only no-hash; accepted ahead-of-applied observation; unresolved ahead context.
- Each phase's measured source-snapshot zero, partial positive, unavailable, stale/invalidated, just-below threshold, at threshold and full power. Include threshold markers on filled and empty backgrounds and exact deficit/signers.
- Competing same-round candidates, shared payload, separate payload, producer unavailable/matching evidence, source divergence and independent comparison agreement(head only)/partial/unavailable/unknown-power/stale.
- Retained pin with same-identity vote enrichment and fixed captured opportunities; active candidate-index eviction with historical facts retained;100 candidate-fact truncation with explicit partial qualification/pin protection; frozen history-evicted pin; newer count and no coherent LIVE selection.
- Manual pause, initially hidden, hidden/resumed/pagehide/BFCache and cancelled late work states; actual gap/reorg; coalesced live advancement; duplicate/clock-only unchanged anchor; reduced-motion static destination.
- Expired prediction awaiting observation; independent branch missing/conflicting rights; independent branch unavailable timing/hypothetical predecessor; historical missing capture that remains unavailable.
- Dense150-instance history, many committee rows, long aliases, full hashes/addresses expanded, phase search empty/no-match/corrected focused pending-exclusion; source/context/age disclosure.
- Explicit light/dark/system, system preference change, missing/corrupt storage and denied write with session-only notice.
- Applicable default/hover/focus/selected/disabled controls, open disclosures/tooltips, native controls/popups, search/sort and keyboard/touch routes.

Geometry records critical overview current/both-future rectangles, whole-document overflow, clipping/overlap/long values, target dimensions and meaningful navigator/history/inspector/committee/provenance region bounds. At360/390 and short-height, ordinary vertical scroll may reach the intact overview; critical targets/proposers/timers/status need no local pan or disclosure and must remain together at readable size. Target values≥14px; metadata/proposer/state≥12px; primary touchcontrols≥44px; other applicable targets≥24px or documented spacing/individual exceptions. Optional local historical pan/semantic zoom preserves essential overview; keyboard/text controls reach identical evidence.

Rendered contrast uses actual foreground/background compositing or justified pixel/manual measurement where CSS inspection alone cannot establish the surface. Audit ordinary text4.5:1, qualifying large text3:1, applicable meaningful control/graphic boundaries/focus3:1, fill/empty threshold marker, placeholders, native controls and all above interaction states. Document legitimate exemptions individually. Nearest opaque ancestor token ratios and study contrast samples cannot establish production completeness or WCAG certification.

## Independent evidence and manual judgment

Automated assertion/geometry/contrast evidence does not prove original composition. A fresh independent reviewer inspects actual normal and dense-state production renders, particularly360/390/1440/3440/5120 in both themes/engines, and writes a reasoned GO/NO-GO critique tied to screenshots: selected-instance hierarchy, exact paired phase evidence, meaningful wide regions, coherent typography/strokes/icons/reviewed mark, original non-blue/violet palette, absence of generic repeated cards/capped workspace/marketing decoration, readable long values and usable keyboard/touch/state cues. Sparse study resemblance, screenshot existence and zero overflow alone cannot pass this gate; unsupported AI-authorship attribution is excluded.

Fresh independent QA verifies the complete deterministic and mapped evidence matrix, closes or explicitly records accepted critical findings under root authority, and distinguishes source-bound live-origin checks from synthetic coverage. ASTRA directly implements after foundations/spec/plan approval and cannot review its own implementation. Maintainer retains separate publication/deployment authority over the concrete reviewed result.
