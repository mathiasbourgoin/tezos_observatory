# Preliminary V3 navigation precheck

Read-only targeted feedback during implementation; **not a final review, QA gate, or acceptance verdict**. No application files or tests were changed. Astra remains the sole application author.

Captured WIP at 2026-10-15T05:32:42.533197Z, branch base `bf0f2d5c395ecdcf155064ba56f1577bfb73cc4c`. Immutable copies, diff and per-file SHA-256 are in `/home/mathias/.cache/observatory-review/v3-navigation-precheck/`; `capture.json` is authoritative. Captured main.ts SHA-256 `f86eb828c60efe0ab85f461da26bf22dcad87bf09e4552a5a1bded629c40ddfd`; dashboardView.ts `b7ca9e6e43641e18fec9c0b82e790df2cb3ecedc0d4d72ce452581009682f1d6`. Findings apply to these copies, not an assertion that the moving author tree still contains them.

## Findings

### Medium — history dropdown selection disables valid Previous navigation

Captured `src/main.ts:118–122`, `src/dashboardView.ts:293` and `:350`. Session history options emit `snapshot.identity`. `onSelect` preserves that identity. However `sessionModel` constructs Previous choices from each candidate's `record.identity` when the instance has candidates, and searches those choices using the selected instance identity. The index is -1, so Previous is disabled even when older observations remain.

Concrete pure counterexample: two retained snapshots `instance-new` / `instance-old`, carrying `candidate-new` at monotonic20 and `candidate-old` at10. Select `instance-new` through the dropdown: no Previous. Select `candidate-new` with identical retained data: Previous is correctly `candidate-old`. This violates FR-031/034's usable retained-instance receipt navigation and can strand readers after an ordinary history action. Resolve instance selection into its actual selected/representative selectable identity consistently, preserving explicitly chosen sibling hashes. Add the eventual production regression after choosing the history dropdown, not only after clicking candidate controls.

### Medium — first candidate promotion moves an existing receipt-navigation unit

Captured `src/main.ts:120`. Sorting choices by candidate record evidence alone does not preserve the earlier candidate-free unit receipt on first-hash promotion, as explicitly required by C-9 / FR-035 and the receipt traversal policy FR-034.

Concrete pure counterexample: candidate-free P-instance accepted at10, distinct Q at20, then first hash H promotes P at30. Store capture preserves P snapshot evidence10 (`src/monitor/observationStore.ts:413`); its candidate H's authentic evidence remains30. Current choices instead sort H30 before Q20. Previous from Q becomes unavailable, although the preserved P/H unit is older. A later sibling hash must remain a genuinely new unit with its own receipt, so changing all candidate proof timestamps or assigning all siblings snapshot receipt is unsafe. Project explicit navigation unit receipt/promotion identity while keeping original hash evidence intact.

## Evidence and limits

Read reviewer skill, TypeScript rules, project authority, relevant accepted V3 selection/navigation/camera requirements and C-1–C-12 clarifications, foundation interface handoff, complete observation-store selection/history/capture logic, and relevant new main/dashboard projections. The known author fixes can supersede this snapshot.

`session-probe.cjs` mechanically extracts captured `sessionModel`, removes only its two TypeScript annotations, and exercises both counterexamples against explicit immutable-shaped data. `node /home/mathias/.cache/observatory-review/v3-navigation-precheck/session-probe.cjs` executed exit0; output is `session-probe.log`. Exit0 here means both reported problematic results and their candidate-selection control were reproduced, **not acceptance success**. Python capture/probe-generation commands and all read-only cat/rg/sed/git commands exited0. One large read was output-truncated and the targeted source ranges were reread separately; no truncated output is used as completeness evidence.

No clean install/check/unit/full-browser/build gates were run: root explicitly assigned a read-only preliminary WIP check rather than final review, forbidding author-tree UI testing and mutations. No synthetic application acceptance, no child agents, no remotes. Remaining incomplete camera features are not findings. No further objective defect was established in the targeted predecessor relation, source-local B admission projection, or captured historical opportunity selection: the latter two preserve the foundation's domain-owned interfaces in this captured projection. This does not certify their complete final behavior or the entire epic.

Both findings were sent directly to root and Astra with exact captured-source qualification. Final independent whole-feature review and QA remain mandatory.

Root adoption: read the complete report, extracted probe source and raw output, then independently executed the same immutable-snapshot probe at 05:34 UTC. Both counterexamples reproduced with exit0 as defined above. Accepted as findings against the captured WIP only; author correction and final production regressions remain outstanding.

## Corrective targeted verification — 2026-10-15T05:37:18.578667Z

Astra explicitly signalled the three corrected locations were coherent and would remain unchanged during capture; this was not inferred from an in-progress diff. New copies and hashes are isolated in `v3-navigation-precheck/correction/`. main.ts SHA-256 `bb29e4b58babc5e4b9e96aa48dd22350b4213c5f15d9f3b8b1493949a254548c`; observationStore.ts `4a4a7a0ef7d7176c1d347835558fb335eeb3833e885a2678d062a15165049ea5`; networkMonitor.ts `1ce9f179bee7be533c4e786d78182e4141795024e4a4953da75f367dc63b26f2`.

**Both preliminary findings are corrected in this captured projection.** `onSelect` now resolves a history instance to its retained first candidate, or its votes-only record. Candidate-hash selections remain exact. `sessionModel` consumes the domain's explicit navigation-unit sequences; the first promoted unit inherits the snapshot's first receipt while later siblings retain authentic hash receipts. `ObservationStore.navigationUnits()` returns a detached frozen array of frozen identity/sequence pairs from the existing bounded bookkeeping, and `NetworkMonitorView` exposes that immutable copy. No original hash receipt is rewritten.

The important cap100 case is also handled by this projection: when the original promoted hash leaves retained candidate history, `pruneSelectableUnits()` removes its navigation unit. The surviving sibling's sequence differs from `snapshot.acceptedSequence`; it therefore keeps its own later receipt instead of being incorrectly assigned the original instance receipt. Snapshot partial-retention handling and existing pinned-fact protection remain domain-owned.

Actual isolated command `node /home/mathias/.cache/observatory-review/v3-navigation-precheck/correction/corrective-probe.cjs` exited0. It extracts corrected `sessionModel` and checks dropdown normalization, preserved promotion receipt, distinct sibling receipt, first-hash eviction with 100 remaining siblings, oldest/frozen Previous boundaries, and detached immutable domain projection semantics. Output is preserved in `corrective-probe.log`. The eviction probe supplies explicit domain-unit output; it is a focused projection assertion, **not a new full ObservationStore integration or application/browser test**. The added author unit test was inspected (promotion plus101siblings and immutable copy), but its reported execution was not independently rerun or claimed here.

No final-review or QA verdict is issued. No author code/test mutation, no application gates against WIP, no remote calls, no child agents. Final independent production regression must still exercise the complete event path and rendered navigation on the completed feature.
