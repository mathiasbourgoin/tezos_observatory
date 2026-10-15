# Implementation Brief — header-layout-hotfix

**Date:** 2026-10-14
**Mode:** fast
**Status:** COMPLETED

## Modified files

| File | Type of change | Reason |
|---|---|---|
| `src/dashboardView.ts` | modification | Replace old floated icon with approved Tezos/telescope mark in a dedicated40px flex slot and separate brand text container. |
| `src/dashboard.css` | modification | Give brand usable flexible width, allow header wrapping, stack mobile controls, remove conflicting mobile width caps and let monitoring text reflow. |
| `tests/e2e/header.spec.ts` | addition | Actual production-page approved SVG loading, icon/text containment, header geometry and keyboard-control regressions across Chromium and Firefox. |
| `src/public/observatory-mark.svg` | addition | Root-reviewed refined classic Tezos/telescope header mark. |
| `src/public/favicon.svg` | modification | Root-reviewed micro silhouette for16px/favicon use. |
| `src/main.ts` | modification | Name observed vote level/round explicitly and label unavailable vote coverage against the scheduled estimate. |
| `tests/e2e/dashboard.spec.ts` | modification | Assert scheduled/conditional opportunity targets and observed-versus-estimated round distinction through production monitoring. |

## Decisions made

Root delegated FAST implementation and prohibited commits/push/deployment; root owns independent review, QA and release. Root visually reviewed the refined header and micro favicon at16/32/40/64px on light/dark surfaces and explicitly approved integrating them. Product SVG titles contain only Tezos Observatory.

Cause: the floated 40px icon with 12px right margin consumed 52px of the brand's first text line. The unclassified brand had intrinsic width influenced by its eyebrow, while mobile control blocks imposed conflicting 170px and 165px!important caps. The header's fixed two-sibling arrangement left text competing for width. Replacing the icon alone is insufficient for mobile collisions.

The explicit `.header-brand` uses a flexible basis and `min-width:0`, plus a nonshrinking40px mark and separate text container; desktop header siblings can wrap when the available width needs it. At mobile widths, the brand and controls occupy separate rows; the monitoring label occupies a full-width line, with Pause/Reconnect below. Monitoring text may wrap naturally at narrow widths/zoom, and its dot cannot shrink. No title nowrap rule, whole-app palette redesign or domain selection/calculation changes introduced. The approved mark uses forest/ivory/sage without affecting app surfaces.

## Quality Gates

Node22 PATH: `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin`.

- [x] Baseline: `npm run check`, `npm test` (38 tests), `npm run build` passed before production edits.
- [x] Red: new actual-page fixture failed in Chromium and Firefox because header contained the unwanted image.
- [x] `npm run check` passed.
- [x] `npm test`: 13 files, 38 tests passed.
- [x] `npm run test:e2e`: 30 cases passed across Chromium and Firefox (four new cases in this combined followup, including exact screenshot-level/round distinction).
- [x] `npm run build` passed.
- [x] `git diff --check` for owned files passed.
- Format: no formatter configured; existing conventions retained.

Final integrated-logo gates completed at 2026-10-14 21:34 local time. The test waits for document fonts and measures rendered Range rectangles, icon-versus-title/eyebrow/controls containment and intersection, title height versus computed line height, header client/scroll width and viewport/document widths. No collisions or full-page horizontal overflow at360,390,768,1440,1920,3440,5120px. Live consensus stays on one line at every required width. A240px optional probe verifies header text containment/reflow only. Keyboard Enter toggles Pause→Resume→Pause and invokes Reconnect while preserving focus.

Screenshots in `test-results/header-production-header-s-edc0c-mark-and-no-text-collisions-{chromium,firefox}/header-{390,1440,3440}.png`. Desktop1440, mobile390 and ultrawide3440 integrated Chromium screenshots visually inspected: approved icon clearly visible, title one line, readable distinct controls. Firefox counterparts captured.

## Points of attention for review

Review responsive brand/controls sizing and Range-based text collision checks. Header tests abort external HTTPS so they validate the actual application under deterministic provider unavailability; domain/network behavior remains covered by the existing E2E suite.

## Identified out-of-scope

Optional240px probe revealed existing whole-dashboard overflow292px from non-header content; header remains contained. Domain layout at that width was not modified. Broader V3 redesign remains separate.


## Approved asset provenance

Root approved the refined oval-objective telescope composition and simplified micro variant after actual-size render review. Telescope paths are custom geometry informed by the user-provided circular telescope reference; the classic Tezos path is preserved with scale/placement/fill adjustment. Both SVGs are self-contained and contain no private reference paths, scripts, external assets or model names.

Classic path retrieved from [Tezos SVG mirror](https://static.cdnlogo.com/logos/t/33/tezos.svg). Independent attribution: [Wikimedia classic Tezos logo](https://commons.wikimedia.org/wiki/File:Tezos_logo.svg) identifies tezos.com as source, Arthur Breitman as author and marks its classic SVG CC0. The designer checked [official visual identity](https://tezos.com/visual-identity/) and [official media center](https://tezos.com/media-center/) but did not retrieve a verified original brand package; the mirrored download is not represented as an official-download artifact. Source/provenance evidence comes from the scoped specialist's review.txt; root owns public documentation separately.


## Opportunity and vote wording followup

Visible cards now read Next scheduled proposal and Following level · conditional. Existing identity keys, target level/round calculations and retained vote selection are unchanged. The notice names Observed votes · levelN · roundR when valid selected observations exist; otherwise it names matching votes unavailable and the scheduled level/estimated round. It no longer implies an observed round is the clock's current scheduled round.

Expanded production fixture reproduces applied5489251/r114, successor5489252 votes/r0, calculated schedule6, upcoming successor/r7 and conditional5489253/r0. Actual power600/30000 stays available, proving this presentation followup retains defensible observed votes. Existing stalled predecessor/r101 scenario additionally asserts upcoming5489252/r38 and conditional5489253/r0. New note expectations were verified red in both browsers against previous Current round/waiting wording before implementation.
