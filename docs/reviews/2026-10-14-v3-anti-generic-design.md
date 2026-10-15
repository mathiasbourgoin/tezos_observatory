# Observatory V3: avoid generic composition through real observer tasks

ASTRA should create a beautiful, practical interface whose structure grows from consensus observation: identify the instance, understand the evidence, inspect the participants, and keep reading while the chain advances. This is proposed design guidance, researched on 14 October 2026, for the V3 implementation and its independent review.

## What the evidence supports

[InterfaceKit's critique](https://blog.interfacekit.io/why-ai-generated-websites-all-look-the-same) is explicitly an editorial model: unspecified hierarchy, density and states encourage familiar page structures. It argues for product-specific composition and complete states, rather than treating a different accent colour as originality. This supports asking why each region exists; it does not establish prevalence or model causality.

[Joshua Snoddy's July 2026 essay](https://www.joshuasnoddy.com/blog/why-ai-websites-look-the-same/) describes recurring centred heroes, glass cards, gradients and stock components from his practice. These are useful prompts for critique, not validated authorship indicators. His training-data and trust explanations are opinions without controlled evidence presented on the page. Do not adopt his commercial aesthetic score as a release gate.

The maintainer supplied [Mateusz Sikora's design critique](https://sikora.software/blog/ai-website-design). Its observations about repetitive cards, decorative borders, rigid symmetry and generous padding on large displays are useful review prompts. Its claim of identifying AI authorship from appearance is not a validated detector. Punctuation and absence of photography do not become acceptance failures for a consensus tool; the relevant question is whether its visual structure serves real observations and screen space.

[Designpixil's September study](https://designpixil.com/blog/vibe-coded-apps-design-study) reports a one-day HTML/CSS comparison of 409 analysable Lovable-showcase homepages and 423 YC-company homepages. Its [aggregate CSV](https://designpixil.com/research/vibe-coded-design-study-2026.csv) is available and was inspected; it contains percentages and significance labels, but no per-site observations, extraction implementation or random-sampling seed. The cohorts differ in funding and selection, YC sites may use AI, and layout and usability were not measured. Treat it as a self-reported observational comparison, not AI-versus-human proof or causal evidence. No population percentages from it are required for this brief.

Accessibility remains a constraint on experimentation: [W3C's colour guidance](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) calls for additional visible cues when colour conveys meaning, and [its auto-update guidance](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) requires user control in the applicable cases. Familiar controls, readable fonts and semantic colours are useful tools, not aesthetic defects.

## Anti-checklist for this product

The following alternatives are project-specific proposals derived from the repository's README and [comparative review](2026-10-14-explorus-teztale.md), not findings from the external studies.

| Avoid accepting this default | Design around this observer task instead | Review evidence |
| --- | --- | --- |
| Large slogan/hero before useful data | Put network progress and source coverage in a compact opening, with the selected instance immediately readable | First viewport identifies network, level, round, payload and age without opening a disclosure |
| Equal cards for every metric | Give the selected consensus instance the dominant area; place related phases on shared scales and secondary context nearby | Reviewer can explain the hierarchy from importance, rather than from available components |
| A fresh card for every new feature | Use relationships: session history selects the inspector; the inspector filters the committee; opportunities retain their separate assumptions | Selecting a historical row changes the intended context coherently |
| A narrow central column on a large display, or a stretched phone layout | Use the available width for meaningful simultaneous context, with deliberate changes in composition and density | Desktop and ultrawide screenshots show useful regions across the workspace, readable line lengths and efficient access to evidence |
| Large decorative borders and padding used as visual structure | Establish groups through alignment, typography, rhythm and relationships; use framing when it explains an actual boundary | Reviewer can explain each boundary and space allocation from a user task |
| A green health badge summarising everything | Distinguish chain progression, source connectivity and observation coverage, with plain state labels | Connected-but-stale, reconnecting-but-progressing and unknown coverage remain distinguishable |
| Decorative sparklines or invented activity | Show an evidence-backed phase progression or timeline only when its data and receipt timestamps exist | No graph invents arrival times, finality or propagation latency |
| Generic icons and labels | Name the actual action: inspect payload, follow live, stop following, pause collection, filter unobserved votes | Controls perform distinct actions and keep visible state |
| Auto-sorting, animated replacements and constant pulse | Keep selection, focus and scroll stable; announce new items without stealing the reading position | Pinned inspection survives multiple live transitions |
| Ideal-state-only screenshots | Design unknown rights, zero observed votes, source failure, competing payloads, long aliases and empty history as first-class states | Same hierarchy remains legible across deterministic fixtures |
| Palette/font swap presented as a redesign | Change composition, information relationships and interaction intentionally; retain any existing typography or colour that still serves them | Before/after rationale identifies structural and behavioural improvements |

These motifs do not prove authorship or justify rejecting useful conventions. A card can group a real object, and a neutral typeface can make dense values readable. This project's maintainer explicitly requires an original colour direction rather than blue/violet defaults. Reject unreasoned repetition and misleading hierarchy. Replacing everything with beige editorial panels, brutalism or a terminal would merely establish another template.

## Maintainer design requirements

The V3 must look fresh, distinctive and professionally designed while remaining lean and practical. The designer must spend the necessary time researching references, developing a coherent direction, creating purposeful assets when needed and iterating on real renders. Include references from earlier inventive web design and from professional information tools, with a written explanation of what each contributes. Design consistency and practical task completion are acceptance criteria.

- **Phone through ultrawide:** design compositions for touch and for dense desktop observation. Verify representative widths of 360, 390, 768, 1440, 1920, 2560, 3440 and 5120 CSS pixels, including portrait and relevant wide-screen heights. The app workspace uses the browser width with justified gutters; the main view must not remain trapped in a capped central column. Added width exposes useful context, rather than stretching text, metrics or empty surfaces. Record actual desktop/ultrawide screenshots and region bounds; absence of horizontal overflow alone does not establish a good layout.
- **Original palette:** propose a distinctive palette with coherent network, phase, status and interactive-state roles. Blue/violet must not define the brand accents. Network identities and uncertainty remain distinguishable in both themes without relying on colour alone.
- **Light and dark choice:** expose a persistent explicit theme choice and sensible system preference behavior. Exercise both themes across loading, available, empty, unavailable, stale, failure and competing-candidate states. Inspect controls, tables, disclosures, tooltips, focus, hover and selection. White-on-white or dark-on-dark text, low-contrast muted labels and theme-inconsistent assets are delivery blockers.
- **Contrast evidence:** audit rendered foreground/background combinations as well as screenshots. Use the [WCAG text thresholds](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) of 4.5:1 for ordinary text and 3:1 for qualifying large text, and the applicable [non-text contrast requirements](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) for meaningful controls and graphics. Contrast evaluation must consider the actual surfaces behind text, including overlays and state changes.
- **Restrained animation:** motion clarifies a meaningful transition or action. Avoid persistent decorative movement, focus/scroll displacement and distracting live-update choreography. Test reduced-motion behavior and preserve an understandable static state, consistent with [W3C interaction-animation guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).
- **Assets and consistency:** use custom graphics, diagrams or generated imagery only when they strengthen the chosen direction or explain the data. Audit typography, spacing, colours, strokes, icon language, states and motion across the entire app, including both themes and dense/wide layouts. Assets must not introduce fictitious evidence or hide unknown observations.

This matrix is part of independent review and QA, not a substitute for the separately required consensus-correctness tests or live provider checks.

## Branching consensus timeline

The maintainer's sketch places the previous block to the left of the observed proposal at level N, round R. Two possible continuations branch from it: another round at the same level (N, R+1) above, and the following level (N+1, round 0) to the right. Integrate this into the workspace above or beside the selected consensus view. The timeline follows actual observed transitions, with restrained movement and an equivalent reduced-motion presentation.

Observed blocks show their block hashes. Each future branch shows its target level and round, expected proposer from context-coherent RPC baking rights, and a clearly identified protocol countdown. Future branches remain conditional and visually distinct from observations; they have no invented block hash. Unknown rights or timing are displayed as unavailable. A countdown reaching zero does not turn a prediction into an observed proposal. Explain the two branches without conflating the applied head with a successor-level observation or the estimated current round.

## Give ASTRA room to design, then verify the result

Before high-fidelity implementation, compare at least two structurally different compositions using the same realistic data. One could centre a selected-instance workspace with linked session history; another could centre chronological observation with an expandable inspector. These are starting hypotheses, not required templates. Choose using the same tasks: distinguish two payloads, find an unobserved participant, inspect an older instance while updates continue, and explain a source outage without calling the chain stalled.

Record the chosen layout's hierarchy, density, typography roles, state vocabulary and motion purpose. Explain what each reference contributes and how it was adapted; do not clone a reference screenshot or use decorative complexity to simulate originality.

Independent review should inspect actual desktop and narrow-screen renders, long aliases, keyboard focus, readable exact quorum/deficit values, reduced motion and transitions between live and pinned inspection. Test the complete task paths and incomplete-data states. A passing build proves implementation health; originality and beauty require a reasoned visual critique, and usefulness requires observing task completion. No detector score substitutes for either.

Status: research draft; design direction and implementation remain to be validated through the Roster pipeline.
