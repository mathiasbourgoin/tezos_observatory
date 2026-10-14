# QA Brief — header-layout-hotfix

**Date:** 2026-10-14T19:41:27.045989+00:00
**Status:** GO ✅
**Round:** 1 (qualifying0/5)

## Round state

Fresh cycle1, round1; installed canonical QA convergence gate exit0, no warnings/violations. Review GO read in full; scope hashes match review and still match root after QA. Claims check legacy/no-managed-claims fresh:true.

## Quality Gates

Actual Node22.23.3, isolated clone `/tmp/observatory-header-qa-huqix2aw/repo`, npm10.9.9 direct CLI; subprocess PATH Node22 then /usr/bin.

| Gate | Command | Result | Duration | Raw evidence |
|---|---|---|---|---|
| install | `npm ci` | PASS exit0 | 0.624s | [install log](/tmp/observatory-header-qa-huqix2aw/install.log) |
| build | `npm run build` | PASS exit0 | 0.395s | [build log](/tmp/observatory-header-qa-huqix2aw/build.log) |
| typecheck | `npm run check` | PASS exit0 | 2.484s | [typecheck log](/tmp/observatory-header-qa-huqix2aw/typecheck.log) |
| unit | `npm test` | PASS exit0 | 0.492s | [unit log](/tmp/observatory-header-qa-huqix2aw/unit.log) |
| browser | `npm run test:e2e` | PASS exit0 | 8.043s | [browser log](/tmp/observatory-header-qa-huqix2aw/browser.log) |

Scoped git diff whitespace check exit0. No independent formatter/linter configured; strict typecheck passes.38unit tests/13files and30Chromium/Firefox E2E cases pass.

## Behavior and visual checks

Header assertions cover360,390,768,1440,1920,3440,5120px: title stays one line, no viewport/document overflow, icon does not intersect text/controls, monitoring/eyebrow rendered ranges do not overlap.240px optional header containment passes; full-dashboard overflow there remains outside supported scope. Pause/Resume and Reconnect keyboard controls pass. Both approved SVG assets load successfully at production paths.

Visually inspected actual integration Chromium390 screenshot and Firefox1440 screenshot:40px Tezos/telescope mark present, single-line Live consensus, separate readable monitoring/control rows on mobile, no previous collision. Screenshots at390/1440/3440 exist in both browsers under `/tmp/observatory-header-qa-huqix2aw/repo/test-results/header-production-header-s-edc0c-mark-and-no-text-collisions-{chromium,firefox}/header-<width>.png`. Domain screenshots and tests still confirm stalled applied5489251/r101 with unavailable gauges.

Exact new monitoring fixture passes in both browsers: applied5489251/r114 primary, payload-bound observed votes5489252/r0 labeled Observed votes, power600/30000 retained, calculated estimate round6 and Next scheduled proposal5489252/r7, Following level conditional5489253/r0. No Current round claim conflates observed votes with schedule. This fixture proves wording distinctions under controlled real production-page monitoring paths; it is not live chain evidence.

## Provenance

HEAD`6c2d7fdccc0bce30cb3f5bb4883dba20222000b7` plus exact seven reviewed file contents. Combined sorted file-hash manifest SHA256`2ac1a532d563ec84994f76a4e20c696edb2f190f2cc677078f3a33e0a4849e87`; individual hashes in qa.json. Root file hashes rechecked unchanged after tests. Local build revision string reflects base HEAD, not a publication claim.

## Conditional gates and limitations

Spec skipped FAST/no task spec; TUI skipped browser app; code-intel actual resolver`SKIP: no code-intel block`/`RESULT: skip`. Root explicitly waived extra urgent-lane cross-runtime/specialist fanout consistent prior hotfix; recorded as skipped, not PASS. No task context manifest or custom QA skill hooks present. Mocked RPCs do not establish live-provider coverage. No commits or deployment by QA.

## Verdict

**GO** — root may proceed to concrete reviewed delivery decision under retained maintainer publication authority.
