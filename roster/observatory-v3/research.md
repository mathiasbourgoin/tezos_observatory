# Observatory V3 design research

**Status: ACCEPTED DESIGN-STUDY DIRECTION — intake validated by root; production QA outstanding. Research date: 14 October 2026.**

Choose between a path-first workspace and an inspector-first workspace before implementation. Both preserve the maintainer's branching timeline; the decision concerns where detailed inspection lives, not whether the timeline exists. Root selected the inspector-first composition, with a full-width branching navigator above it: it gives exact evidence and committee inspection more usable space while retaining directional navigation.

## Evidence and limits

This is preparation for a separately specified implementation after the foundations gates. No production files, publication or deployment changed. The current production page was opened in Chromium at 1440 × 1000, identifying revision `631de28`; its actual screenshot was inspected. It has two tall, near-equal network panels. The header mark is recognizable. The repetition of participation, history, opportunities and evidence in each panel makes this a network comparison page rather than a selected-instance investigation workspace. That final judgment is design opinion.

The maintainer's supplied sketch was visually inspected: predecessor left, N/R center, N/R+1 above, N+1/R0 right. The rectangular shapes express relationships; they need not become large cards. The camera travels UP for observed same-level round advancement and RIGHT for observed next-level advancement. A forecast expiry never causes either transition.

The initial claims check returned legacy/no-managed-claims. A subsequent check after foundation specification creation reports stale managed draft projections; KB migration is handling this. Intake cannot use a claim of globally fresh legacy context. Binding V3 requirements now live in `kb/context/v3-contract.md` and `kb/context/required-properties.md`; rerun reconciliation after migration. Foundation behavior remains an accepted contract, not an assertion that the current source implements it. The active implementation must be reread after foundations land.

## External prior art

Links were fetched on the research date. “Documented” means the primary author describes the behavior; “rendered” means this research opened and visually inspected the running page. Adaptations are proposals, not claims that the reference proves usability.

| Reference and evidence | What was actually found | Adaptation and boundary |
|---|---|---|
| [Forky repository](https://github.com/ethpandaops/forky), [live Mainnet](https://forky.mainnet.ethpandaops.io/) — primary source and rendered | Source describes retained fork-choice data; running page shows a spatial block graph, source-specific head hashes, time navigation and a head-focus control. A large floating source table overlaps part of the graph at 1440px. | Give observations spatial continuity and explicit return-to-live. Dock evidence outside the graph. Do not copy Ethereum canonical/finality semantics, server storage, source aggregation or graph styling. |
| [ethPandaOps The Lab introduction](https://ethpandaops.io/posts/the-lab/), [running Lab](https://lab.ethpandaops.io/) — primary documentation; landing DOM inspected | Authors distinguish curated network views from raw Xatu data and document multiple themes. Current navigation exposes consensus, slots, entities and forks. The 2025 post calls several features upcoming; it is not evidence of their later completion. | Use concise operational views with a route to source evidence. Do not import their collector architecture or claim network-wide receipt timing. |
| [mempool.space](https://mempool.space/), [projected-block implementation](https://github.com/mempool/mempool/blob/master/backend/src/api/mempool-blocks.ts) — rendered and source | A top strip visibly separates future projected blocks from numbered mined blocks; future values use approximate time. Backend source constructs projected block sets. | Separate conditional future from received history before presenting metrics. Tezos requires two conditional directions, exact identity and explicit unknowns, not Bitcoin fee ranking or decorative cubes. |
| [Perfetto UI](https://perfetto.dev/docs/visualization/perfetto-ui) — primary documentation | Timeline, searchable/filterable tracks, pinned tracks and a separate detail drawer are documented. Filtering is reversible. | Couple path selection to a stable inspector and searchable committee. “Pin” here freezes a selected observation, unlike Perfetto's track-position pin. Do not transfer its specialist keyboard-only assumptions. |
| [Chrome Performance reference](https://developer.chrome.com/docs/devtools/performance/reference) — primary documentation | Trace overview, detailed selection, range breadcrumbs and linked highlights support inspection at multiple scales. | One bounded overview plus local detail; selection drives context rather than extra independent widgets. Levels/rounds are ordinal coordinates, not elapsed-time distances. No flame-chart bar implies missing receipt timestamps. |
| [100,000 Stars, Google Data Arts Team, November 2012](https://experiments.withgoogle.com/100000-stars) — primary archive | Spatial navigation reveals named stars at closer scales; the author explicitly distinguishes measured star positions from an artistic galaxy representation. | Semantic zoom can reveal hashes and source details as space allows. Always distinguish evidence from illustration. Avoid 3D flight, particles, hidden controls and an astronomy skin merely because the product is an observatory. |
| [Cameron's World](https://www.cameronsworld.net/) — creator's page inspected | The creator assembles linked GeoCities material from 1994–2009 into a continuous authored web collage. | Treat the browser as one composed space with local relationships, rather than repeated product cards. Reject animation overload, tiny targets and collage density for operational data; no borrowed graphics. |
| [Mateusz Sikora's critique](https://sikora.software/blog/ai-website-design) — editorial reference | Critiques repeated cards, rigid symmetry, default indigo/violet and large-screen emptiness. Assertions about identifying AI authorship are unsupported by controlled evidence on the page. | Review the purpose of each region, line and accent. Do not turn punctuation, lack of photography or familiar controls into failures. |
| [Octez consensus documentation](https://octez.tezos.com/docs/active/consensus.html) — primary protocol documentation | Rounds and proposal timing depend on protocol rules and predecessor context. | Protocol calculations explain conditional opportunities; receipts establish observations. Verify active constants/context rather than hard-code durations from a visual mockup. |
| [W3C target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) — normative guidance explanation | Ordinary text generally needs 4.5:1; qualifying large text 3:1; meaningful controls/graphics have applicable 3:1 requirements. Minimum target size has documented exceptions. | Audit actual rendered combinations. Prefer 44px primary touch controls; do not shrink whole graph text to fit a phone. |

Rejected lead: `ethseer.io` now returns a staking/wallet marketing page. It was fetched, but is not used as evidence of a current consensus visualization. Census Population Clock was considered, but its estimate-driven motion does not add enough to this product's observation contract. No source code or assets from external references were copied.

## The real case behind both studies

At the published page's bounded browser check, Shadownet displayed applied level **5,489,251 / round 118**, and successor vote evidence **5,489,252 / round 0**, with **6,689 / 7,000** power in each phase and threshold **4,667**. These are values displayed by the baseline UI, not independently verified vote accounting.

A separate read of [the fixed block header](https://rpc.shadownet.teztnets.com/chains/main/blocks/5489251/header) returned block `BMWESPraYkNHth7nczrq2qcmCuabuCh6DHHUg2S2skEt1qHxwjh`, predecessor `BKjoj7HJESWW4RL949TqYmyTyAFPSRtQXFFQ6xayYCeCEk6mrNi`, timestamp `2026-10-14T19:46:30Z`, and fitness round `0x76 = 118`. The hash and level are real. No block hash was established for the selected successor vote group, so the studies show “proposal hash unavailable.”

Fixed-context RPC baking rights returned `tz1PJfk1LPgKUz8rhkKUYYmzAhqCaQFHhbn2` for 5,489,252/r1 and `tz1TnEtqDV9mZyts2pfMy6Jw1BTPs4LMjL8M` for 5,489,253/r0; both returned estimated time `19:52:36Z`. Constants at that same head returned minimal delay 6 seconds, increment 3 seconds, committee 7,000 and threshold 4,667. Endpoint suffixes were `/helpers/baking_rights?level=5489252&max_round=1`, `/helpers/baking_rights?level=5489253&max_round=0` and `/context/constants`, beneath `/chains/main/blocks/<the fixed block hash>`.

The studies freeze a clock at 19:52:30Z to show both estimates as 6 seconds, and label this explicitly. The successor estimate depends on the hypothetical predecessor and is not an observed deadline. Synthetic disagreement and missing-rights variants are labeled study scenarios, not historical claims. Committee sample rows are illustrative; they are not attributed to named real delegates.

## Composition comparison

Figure 1 is `studies.html?layout=path`: a large path surface is the primary working area; a side inspector holds phase power and evidence, with committee below. Figure 2 is `studies.html?layout=inspector`: a shallow full-width path sits above a reading workspace with session history, selected-instance evidence, committee and source context. They use identical data and colors. These are reviewable native HTML/SVG composition studies, not working app prototypes or accessibility certification.

| Reader task | Path-first | Inspector-first |
|---|---|---|
| Understand up-round/right-level behavior | Most immediate spatial explanation | Compact relationship still visible; fewer historical turns visible initially |
| Compare candidate identities and exact powers | Requires moving between path and narrow inspector | Selected identity and paired phase scales dominate one reading plane |
| Find a delegate and inspect coverage | Committee is lower in the page | Committee is adjacent on desktop; directly follows inspector on phone |
| Read older data while collection continues | Pin must arrest camera while a live indicator remains elsewhere | Stable inspector naturally separates reading position from live navigator |
| Use ultrawide width | Risk of large empty canvas unless more retained path is visible | Additional width reveals history, committee and provenance simultaneously |
| Use 360/390px | Requires local pan or reduced node detail | Compact local path plus vertical evidence order needs less panning |

**Root decision:** inspector-first, preserving the required branching navigator. Expanded-path mode is excluded from this scope. This is a composition choice, not permission to flatten the two-dimensional timeline into a list.

## Timeline and camera contract proposed for specification

Use ordinal level/round coordinates. RIGHT is increasing level; UP is increasing round at the same level. Node placement is not a duration scale. Show observed candidate branches with their identity; same-level/same-round alternatives are adjacent identity choices rather than invented intermediate steps. Distinguish applied, validated proposal and votes-only with visible words and shapes. Solid observation styling does not claim finality or ancestry.

Coherent predecessor links can be solid. If ancestry is unavailable, render an explicit context gap instead of joining unrelated hashes as a verified path. Reorgs or skipped observations never animate through fabricated intermediate nodes. Deduplicate repeat receipts; they do not trigger movement. On observed same-level round advance move viewport focus upward; on observed next-level advance move it right. The underlying scene moves opposite the camera direction; test focus coordinates, not merely CSS transform signs.

On phone keep the selected observation and BOTH conditional target/proposer/timer branches simultaneously visible, with readable abbreviated identities and an adjacent accessible text list. Local panning may serve retained historical detail, never hide a critical future option by default or scroll the document horizontally. Offer Previous observation, Latest observation and Follow live controls; drag/pinch cannot be the only route. Semantic zoom hides secondary metadata before reducing essential type. A bounded overview may reveal the retained path, but must state its retention limit. Do not pretend to retain infinite data.

Pinning prevents automatic camera/selection movement and inspector replacement while collection continues. The newer-items count remains actionable. Following live deliberately restores the live anchor. Pause collection is separate. A historical pin has frozen opportunity assumptions and captured times, not a countdown implying current validity. A retained-history eviction preserves one frozen selected snapshot per network and labels it outside session history.

For long round runs, only a local neighborhood needs full labels. Collapsed older runs disclose actual retained nodes on request; avoid implying every intervening round was observed. Unknown elapsed timing uses words, never a plausible zero. At countdown expiry say “scheduled time passed; awaiting observation.” Keep both future branches present with expected proposer and conditional timer when coherent; independently show rights/timing unavailable when not.

## Visual system hypothesis

Use near-white mineral surfaces, dark evergreen ink and burnt-copper emphasis in light mode; near-black green surfaces, pale sage ink and pale terracotta in dark mode. The reviewed forest/ivory Observatory mark remains the brand asset. Network labels include explicit names; phase names and line treatment carry meaning without color. Copper is not simultaneously network identity, alert and active selection.

One sans-serif family handles labels and prose; tabular numerals align powers, levels and times; a monospace role identifies hashes. Avoid decorative oversized metrics. Exact numerator/denominator and quorum deficit remain readable, with the two phases sharing a scale. Use spacing and shared baselines to group information; boundaries mark evidence/source distinctions rather than wrapping every value.

Motion proposal: a brief camera transition only for coherent observed progress while following live; coalesce rapid arrivals; no decorative pulse. Reduced-motion mode snaps to the new view and announces meaningful state changes without narrating every vote. New observations never move DOM focus or document scroll. The studies contain no automatic motion.

## Contradictions and decisions required

| Tension | Proposed resolution / decision owner |
|---|---|
| Conceptually infinite path vs finite data | Infinite navigational model; explicitly bounded retained observations. Accepted foundations retain 150 full instances, 100 accepted candidates, 100 unresolved candidates per network and one frozen pin. |
| Both future timers vs unobserved successor predecessor | Conditional RPC estimate with context/assumptions; unavailable if not defensible. Root agreed this interpretation during research. |
| Applied round 118 vs successor observed round 0 vs future estimated round | Three explicit contexts. Never use the largest round or clock estimate as selected observed identity. |
| Solid observed path vs unknown ancestry | Solid node means observation; solid edge requires coherent relationship. Explicit gap otherwise. Accepted by root. |
| Useful wide workspace vs bounded readable text | Reveal separate meaningful regions as width grows; expand visible path history and table columns before increasing prose measure. No central maximum-width app shell. |
| Accessibility vs spatial novelty | Native focusable candidate controls, DOM text equivalent and keyboard navigation; graph is not the only access path. |
| Optional receipt charts/celebration vs incomplete timestamps | Recommend no receipt chart, watched filter or recovery celebration in this V3; core directional motion already explains real progress. Root accepted exclusion. |
| Future implementation vs changing foundation source | Rebase research anchors after foundations GO; do not implement against stale selection/cache contracts. |

## Required implementation evidence

Actual renders at 360, 390, 768, 1440, 1920, 2560, 3440 and 5120 CSS pixels in both themes. Include useful viewport heights and geometry checks for overlap, clipped values and touch controls. At ultrawide, record meaningful region bounds and critique empty space; zero document overflow is necessary but insufficient.

State matrix: loading, observed available, measured zero with justified coverage, unavailable, partial, stale, failure, competing candidates including shared payload, source divergence, ahead-of-head evidence, pinned, frozen-evicted pin, paused, hidden/resumed, countdown expired, missing rights and missing timing. Exercise theme choice/system/storage failure, hover/focus/selection/disabled controls, tooltips and disclosures, long aliases/full hashes, reduced motion and keyboard/touch paths. Text contrast and control/graphic contrast are measured from actual rendered surfaces.

Independent review and QA must run Node 22 checks, unit tests, Chromium/Firefox production-page tests and build. A browser screenshot or mock proves neither network-wide truth nor provider coverage. Bounded origin checks and revision verification remain separate. Publication/deployment require maintainer approval.

## Study verification and remaining design work

Two compositions were rendered at 390, 1440 and 3440 CSS pixels, each in light and dark themes; screenshot files are under `renders/`. Initial 390px checks exposed a 2px overflow from the scenario selector, corrected before the final capture. Local path navigation, scenario and theme selection, committee filtering and native disclosures were exercised in Chromium. These checks cover the study controls, not production camera/pin behavior or the complete release matrix.

The clock-ahead variant explicitly holds observed successor round 0 while an illustrative protocol estimate has reached rounds 6→7; expired r1 and successor opportunities remain predictions. It creates no solid rounds 1–6 and no camera movement. This is the required semantics for the maintainer's long-round case. The earlier maintainer snapshot had applied round 117; this bounded research read independently returned round 118. They are distinct observations, not interchangeable fixture values.

Rendered critique: the inspector-first study uses ultrawide space more productively than the path-first study, but three sample committee rows and only one selected group cannot establish density quality under a real 150-instance history. The path-first view has excessive empty canvas in this sparse case. On phone, local panning and the text equivalent preserve readability, but a production semantic-zoom junction should improve simultaneous visibility of both future branches without shrinking essential text. These are explicit refinement tasks before visual acceptance, not a claim of polished completion.

Final study checks are recorded in `renders/checks.json`: all 12 composition/width/theme combinations have no document overflow or JavaScript runtime error. Native disclosure opened, participant search left one matching row, and button-driven local path pan worked. Computed token contrasts against the paper surface were 6.24:1 or greater for text roles in light mode and 8.03:1 or greater in dark mode; line roles were 3.88:1 and 3.97:1 respectively. This is a limited token-on-paper check, not the required complete rendered contrast audit across every production state/surface.

## Coordinator refinement: compact visible junction

**Decision:** root selected inspector-first and accepted Type feature / Trust boundary yes, verified solid relationships with explicit unknown gaps, and exclusion of optional receipt charts, watched filters, celebration and expanded-path mode. Design-study direction is accepted by root; production visual acceptance remains outstanding. The branching navigator itself is mandatory. Root rejected the first study's marketing slogan, tall sparse desktop canvas and phone pan requirement for seeing the right future option.

The refined study removes the slogan, uses compact product identity, and keeps all four local nodes visible at 360/390px. Each future node shows its own level, round, abbreviated RPC proposer and timer/status. The center remains observed r0 in the clock-ahead variant; future nodes say “Passed / not observed.” No tiny scaled SVG text or sideways scrolling is required. Levels are 14px, round/proposer/state labels 12px, and timers 17px on phone. Full fixed block/proposer values remain available through the selected evidence disclosure; desktop also displays them beside the navigator. Short identities are display abbreviations, never fake future hashes.

Desktop nodes have bounded widths rather than filling equal fractions of an ultrawide surface. The spare navigator width contains applied context and conditional rights. Its normal-state height is **284px** at both 1440 and 3440, down from the earlier roughly 400px region. The diagram itself is 206px. This leaves selected-instance evidence and committee rows in the same desktop viewport. On phones, the normal navigator is 445px at 360 and 436px at 390, including native controls, four legible nodes, disclosure and legend; the local diagram is 286px. Study scenario/composition controls above the app are review scaffolding, not proposed production chrome.

| Width | Main meaningful regions (CSS pixels) | Spacing/density judgment |
|---|---|---|
| 360 | Navigator 336; inspector 336; committee 336, vertically ordered | 12px page gutters; 102px nodes; 10px round separation. Both future options visible together. Long labels wrap deliberately. |
| 390 | Navigator 366; inspector 366; committee 366 | 112px nodes; same essential text sizes. No graph pan needed. |
| 1440 | History 190; inspector 533; committee 613; navigator 1384 | 28px page gutters and 24px region gaps. Navigator graph 720px; its remaining width holds fixed-context details. |
| 3440 | History 320; inspector 950; committee 1235; provenance 760 | 28px page gutters and 40px region gaps. Navigator graph 1100px; full hashes and rights occupy the rest. Prose retains bounded line lengths. |

Actual evidence is in `refined-renders/`: 360/390/1440/3440 × light/dark × normal/clock-ahead/missing-rights/disagreement, **32 screenshots**. `geometry-and-contrast.json` records no document overflow, no intersecting node rectangles, and no sampled text contrast failure. Visible direct text was checked using computed foreground and nearest opaque ancestor surface; minimum ratio 5.23:1 in light and 6.33:1 in dark. The check does not constitute full WCAG certification: native select popups, all browser/OS fonts, every interactive state, graphics and production-only cases still require the complete implementation audit. Fill/remaining tracks now contrast through a paper background and boundary; threshold markers use a two-tone line so neither filled nor unfilled segments hide the marker.

Self-review of actual renders: the junction now conveys the branching model at phone size and avoids the first study's clipped future. Exact powers remain paired and legible. The 3440 layout exposes four useful regions; its sparse three-row sample still does not prove dense-session quality. Production must exercise 150 retained instances, many committee rows, competing candidates, expanded details and pinned updates before this can be called finished. The study's simple node locator controls are review aids; they do not implement collection, follow mode or observed camera transitions. Full hashes and both fixed proposers were read in the desktop context and mobile disclosure. No extra decorative assets are needed to explain this case.

Claims migration has now completed. A fresh check returned digest `df956427d1682044239f38a92ca709c4e916d8790b615436699c6e60555549d7`; the exact managed context is preserved in `context.manifest.json`. Binding V3 doctrine remains separate from generated foundations views. Root subsequently inspected refined 390px dark, 1440px light and 3440px dark renders and explicitly validated the intake/design-study direction. This is not production visual QA. Current local HEAD at intake finalization is `371a20e` with concurrent uncommitted KB/specification changes; `631de28` identifies only the earlier observed public UI baseline.
