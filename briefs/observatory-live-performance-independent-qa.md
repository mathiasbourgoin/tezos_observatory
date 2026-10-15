Independent review and focused QA

Separate frozen-f11aded CSS peer review completed: compatibility agent APPROVE/no findings. The62px summary slot preserves two21px lines plus padding/border, scrollable full text and native keyboard/focus behavior. No additional tests/probes were run for peer review.

Latest committee CI blocker follow-up — f11aded18f0567b328557f3b3078648fa1fde486: the formerly causal-unknown mobile failure is now diagnosed from CI38743861197 raw frames (311passed/3failed). Only session-rail shrank18px as its retained-selector summary changed from wrapped label to Unavailable; committee/viewport were unchanged. This reviewer implemented the delegated narrow fixed-height/scrollable native-summary slot and strengthened the mobile fixture with a51-character payload label. The original source reproduced SourcesY−39px locally; after the fix, Node22 check/build and all4Chromium/Firefox1440/390committee cases PASS, all5frame deltas exactly0, with existing scroll/focus/lazy-receipt assertions preserved. No tolerance widening or new RPC behavior. Separate compatibility-agent CSS review is required; this source implementation is not self-independent review. See committee-history-label-fix.md for portable evidence and exact scope. This supersedes the earlier causal-unknown statement only for this now-proven failure. Final CI remains mandatory; no public smoke or new live probe ran.

Final opportunity epoch follow-up — source3b17f83415793bc40be00c79e7c12c714652910a, integrated6a378ba: independent GO. The request key now includes the captured opportunity token's full contextFacts and observer/collection generations, and the request uses that same token. Existing abort, selected-network, lifecycle, current-selection-key and store authority/epoch guards remain intact. A legitimate epoch change schedules the existing load again; unchanged epochs retain deduplication, with no polling added. Own Node22 production build PASS. Exact S9 same-height competing-candidate case PASS in Chromium and Firefox (2/2,9.6s), including no additional baking-rights reads on unchanged-epoch replay, admitted-context identity, independently known conditional timing with unavailable rights, and retained inspection. No other local cases or live probes were rerun.

Final scoped source verdict: GO, with final CI still mandatory. The69request/25.132second real-provider measurement below predates this opportunity-key fix and is historical, not a measurement of the final revision. The user request budget remains not universally solved. The prior single mobile committee CI failure remains causal-unknown/not reproduced; this final follow-up makes no resolution claim. Publication smoke remains prepared and unexecuted.

Latest CI-blocker follow-up: runtime source e2eaf35, equivalent to fc94e89 apart from later fixture-only changes. Pin source344f163 independently reviewed GO; Node22 check/build PASS, and the two original failing Pin/narration and Historical as-of phase cases PASS in Chromium/Firefox (4/4,6.7s). Exact accepted-session lookup preserves full source/context/tuple and both admission-generation fences; frozen captures remain isolated from later power. CSS4cb0986 review GO: the proposal disclosure summary adds min-height44px and vertical padding, retaining native keyboard semantics and existing wrapping without clipping.

Release status remains pending final CI. CI6344c8e had195passed/119failed:64 shared undersized proposal-summary targets,1 mobile committee geometry failure,50 dashboard semantic/locator failures and4 matrix semantic failures. The Pin defect was independently reproduced and is now fixed. The one prior mobile geometry failure remains causal-unknown and was not reproduced by baseline, actual-proof-baseline or held-indexed-callback measurements (all zero deltas); no resolution claim is made. Test-only a885db6 persists raw frame JSON before assertions for the next CI artifact, without changing tolerances. The new final CI remains mandatory. Public smoke is prepared but has not run. No more local tests or live probes followed these four Pin cases.

Current independently reviewed product: 2a80a8f (integrated committee geometry fix). The latest RPC deltas were reviewed and measured on RPC-equivalent predecessor dbc7be2f169ed1ea76f588278d96eca0a883a2d2. Earlier 9d63ec6 and 7e1b0bb evidence below is historical and explicitly scoped to those commits. The final committee commit changes no RPC paths.

Verdict: GO / approve for this bounded independent product review and QA. No remaining concrete source blocker. Final product gates and final picker browser cases pass. Separate compatibility-agent results, CI and publication gates remain the coordinator responsibility; this report does not claim they passed. This is not full formal-contract recertification or publication approval.

Node 22.23.3 on exact final product 9d63ec6:
- rtk npm run check: exit 0.
- rtk npm test: exit 0; 374 tests passed across 26 files.
- rtk npm run build: exit 0.
- Final proposalChoices.spec.ts on 9d63ec6: exit 0; both Chromium / Firefox cases passed, including absent phase shown as —, frozen pin excluding later unrelated phase receipts, and known unvoted captured block correctly labeled Observed proposal.
- proposalChoices.spec.ts and foregroundAuxiliary.spec.ts on RPC-equivalent 7e1b0bb: exit 0; all 6 Chromium / Firefox cases passed. The lifecycle cases prove no hidden requests, aborted inactive monitor streams, explicit paused status, preserved pinned evidence after switching away and back, coherent resumed heads, one explicit eligibility batch, and no automatic repeat on later heads. Picker cases verify supported current-context ranking, closed disclosure, pin stability, unknown attestation power shown as —, and zero-support block exclusion from the active list.

Fresh default-Mainnet live Chromium on RPC-equivalent 7e1b0bb, no clicks:
- Requested a 25-second wait; actual measured window was 27.584 seconds, including browser scheduling delay.
- 67 external requests; 61 external responses; 13 requests in the first 3 seconds.
- Zero requests for the hidden Shadownet network, including all core and auxiliary paths.
- Zero automatic /is_forbidden requests.
- 12 immutable constants / attestation-right response URLs; zero repeated URLs.
- Five of 21 sampled observations qualified. SmartPy selected observations advanced from level 15,383,851 to 15,383,853, with chain NetXdQprcVkpaWU and protocol PsUshuai9QapM5TGj1JpuVGkdxz5GykdnEvS6Rh8SUVrARvZLCY. Preattestation and attestation each reached 7,000 / 7,000 power, then 6,999 / 7,000 on a later level. Applied heads advanced from 15,383,849 through 15,383,854.
- The UI accurately discloses source-local snapshots on proven heads / 6 seconds and a separate raw stream. One TzKT helper HTTP 403 was learned; later retries were suppressed. SmartPy proof failures and aborted obsolete helper reads remain visible as unavailable authority rather than mixed-source numbers. No page runtime errors.
- Hosts: SmartPy 47 requests, TzKT RPC 14, TzKT API 6. No Shadownet host appeared.

| Request category | Count |
| --- | ---: |
| Head streams | 1 |
| Operation streams | 5 |
| Proposal streams | 1 |
| Indexed spans | 5 |
| Alias batch | 1 |
| Mutable head reads | 11 |
| Immutable headers | 10 |
| Immutable protocol identities | 10 |
| Attestation rights | 7 |
| Constants | 7 |
| Baking rights | 6 |
| Pending snapshots | 3 |

Evidence: budget-7e1b0bb.json contains every external request / response, timestamps, failures and sampled source qualification; budget-7e1b0bb.png is the final screenshot. Earlier 166 responses / 17 seconds and intermediate 105 responses / 25.153 seconds were measured at different times. These numbers do not establish an exact causal reduction percentage. The controlled unit regression proves completed immutable helper reuse across derive, reconciliation and head advancement.

Responsiveness limit: a few nominal 1-second live sample intervals had 3–4-second gaps during concurrent browser regression work. This run does not isolate page CPU responsiveness or prove continuous smooth real-provider animation. Deterministic browser frame traces independently prove actual adjacent-slot movement and bounded settlement.

Review coverage: full product diff, correctness, source / chain / protocol segregation, cancellation and generation ownership, bounded caches, stale-body rejection, provider capability negatives, no wallet / signing / node mutation paths, TypeScript patterns and scope. Canonical helper keys contain actual responding source, network, chain, immutable anchor, protocol and path; original receipt times are preserved while consumer context is rebound. Learned 403 restriction is source/session scoped; 404 is exact pinned path and bounded; 429 remains retryable; pause/resume resets learned negatives. Source-local snapshot fallback is bracketed by exact-source before / after head proof, has no overlap and rejects obsolete generation completion. Inactive network lifecycle pauses all collection while preserving history.

Picker review: ranking sums only known phase support within the exact context / level / round, keeps stable ties, and does not pool sources. Unknown phases remain absent for presentation; actual observed zero remains numeric zero. Same-context phase sidecar reuse uses full context plus tuple and does not revive changed-head authority. The final pinned-isolation correction restricts its choices to captured snapshot records and candidates, excluding later live history receipts. Selected proposal-kind labeling reads the actual selected observation hash, independently of its inclusion in the supported picker. Final browser assertions confirm both behaviors.

Carried evidence for unchanged areas:
- Original geometry / motion source: 22 Chromium / Firefox cases plus 2 independent long-content cases passed; actual card transforms and outgoing identity were sampled, four equal fixed slots were checked at 390 / 1440 / 3440 pixels in light / dark, with disclosures, focus / scroll preservation, reduced motion and gap handling. Timing is the explicitly accepted 320 ms movement / 400 ms settlement policy. Two scene screenshots were independently inspected.
- Palette and auxiliary source before selected-only lifecycle change: 10 Chromium / Firefox cases passed for all five palettes, contrast roles, responsive widths, persistence, denied / unknown storage, separate appearance state and explicit eligibility semantics.
- Focused retained-pin foundations AC-22 regression passed once in both engines on the corrected source. The earlier reported red no longer reproduced; assertions were preserved.

Limits: provided shared dependencies were reused, so no clean npm ci was performed. The exhaustive unchanged browser matrix and formal-contract recertification were excluded by the scoped coordinator brief. No publication was performed. This reviewer did not edit product code; diagnostics and evidence are outside the isolated worktree.

Final findings: none remaining in the reviewed product. Open questions: none for the scoped implementation. Recommendation: approve, with the explicitly stated scope and provider / responsiveness limits.

RPC delta review and QA, dbc7be2f169ed1ea76f588278d96eca0a883a2d2:
The later raw-admission and completed snapshot reuse deltas were independently reviewed. No source blocker found: queued proof equivalence requires an owned context and exact source/network/head facts/protocol/tuple/parent/observer and collection generations. Direct snapshots require captured derived/rights/constants object identity, matching context and head facts, matching source, unchanged lifecycle/head generation, and complete same-source before/after proof; the store validates epochs again.
Own Node22 check/build passed (exit0);180 affected units plus9 shared-context cancellation units passed; both-engine exact snapshot-read counter and qualified raw-source cases passed (4 browser cases). No broad unchanged suite was rerun.
One fresh default Mainnet real-provider window on dbc7be2:25.132 seconds,69 external requests,64 responses; first3 seconds33 requests, next22.132 seconds36. Zero hidden-network URLs, zero automatic eligibility,14 immutable helper responses with no duplicate URL, no page errors. Qualified SmartPy observations progressed15,384,149→15,384,153, pre/att6999/7000 then7000/7000; one TzKT403 learned. Evidence budget-dbc7be2.json.
This does not show a lower raw total than the prior67 requests /27.584seconds. Different head cadence, startup latency and successful snapshot opportunities prevent a causal percentage claim. The user request budget is not universally solved: hidden fanout and immutable repeats are removed, but current REST proof needs once-per-new-anchor header/protocol/rights/constants plus the three mutable snapshot bracket reads, before optional proposer/index/alias work and server-driven stream reconnects.
Historical status before committee freeze: independent committee review was pending. This status is superseded by the completed committee GO below.

Final committee GO — integrated 2a80a8f, independently validated after the RPC deltas:
- Overall scoped recommendation: GO / approve. No remaining concrete source blocker in the reviewed product.
- Own Node22 type check and production build both exited0. No further tests beyond the four targeted geometry cases were added for this UI-only delta.
- committeeTransitions.spec.ts:4/4 PASS, exit0, Chromium and Firefox at1440px and390px. Every one of five actual held-rights frames per case had absolute SourcesY delta0, committee-height delta0, fixed viewport480px desktop /560px phone, and a collapsed44px unknown summary.
- Known rows were truthfully removed while rights were unavailable, with the viewport retained. After rights resolved, table scroll200px was restored, search value/focus survived, and following content retained its position.
- Unknown receipts stayed closed with0 rendered rows; explicit opening lazily rendered100 of256 with a clear count/truncation note inside a240px scrollable, keyboard-focusable viewport. Opening issued0 requests. Explicit user expansion is allowed to move content; automatic transition frames did not.
- Final CSS/source review found bounded scrollable status/history/retry slots and no inaccessible clipped evidence or stale rights presented as current.
- Evidence: /var/tmp/observatory-independent-evidence-fdb9347/committee-independent-2a80a8f.json contains all4 outcomes and attached measured frame positions. A concise final report is also available at validated-2a80a8f.md.
- The coordinator separately reports final typecheck and385unit tests passed on2a80a8f; those final385 were not independently repeated by this reviewer after the pureUI delta. Compatibility/CI/publication remain coordinator gates. No more tests or live probes were run.
