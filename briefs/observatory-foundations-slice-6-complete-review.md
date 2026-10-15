# Foundations S6 — independent complete-slice review

**APPROVE — INTERIM S6 only**, at `9a9529fb4b3f45ce72f6cb0ae67e4f5485f8c2eb` (parent `9291d40f11b9c84066080082cbf4d73e6e5ed67d`). Four independently reproduced reader/accounting defects are corrected and independently revalidated. No unresolved blocking S6 finding remains. The ten-slice foundation programme and its later criteria remain open.

Review date: 2026-10-15. Final independent detached worktree: `/tmp/observatory-s6-review-9a9529f`. Final HEAD was checked and all four reviewer worktrees restored clean. No owner S7 WIP was inspected. No implementation edit, integration, commit, push or deployment was performed; this report is the sole root-workspace write.

## Authority and reviewed scope

Reviewed the accepted foundations specification, its entities and full relevant acceptance clauses, validated `briefs/observatory-foundations-plan.md`, root `briefs/observatory-foundations-slice-6-review-preparation.md`, S5 limits, project authority/TypeScript rules and reviewer/architect skills. The accepted V3 FR-030–036 and AC-04 distinguish one-shot Latest from continuing Follow; neither may substitute historical evidence for unavailable LIVE selection.

The complete aggregate S6 diff from `84f4e6de0127f4c23d0673754c7870fa86b1e6ce` contains eight files, 564 insertions and 35 deletions. It covers the actual store, monitor, production main/reader, semantic checker and consumer tests. No dependency, framework or new infrastructure was introduced. The owner’s frozen `briefs/observatory-foundations-slice-6-impl.md` was read as implementation evidence, then checked against code and reviewer executions rather than accepted as certification.

## Findings closed at the final revision

Severity below describes the former demonstrated impact. Each finding was sent promptly to the owner and root with the exact reproduction. None is waived as a timing flake.

| ID | Former severity and frozen RED | Actual reproduction / failure | Final result |
|---|---|---|---|
| S6-R1 | Medium, `ab57c0e` | Accept a candidate-free instance, pin it, then accept its first candidate hash. Actual store and production page incremented newer items 0→1 although this only represented the existing unit. Existing AC25 covered promotion only after the instance itself arrived after the pin baseline. | `captureHistory` retains the represented unit’s original sequence and increments only for a genuinely distinct unit. Own store and both-page regressions pass. Second distinct hash increments once; replay and post-baseline instance-to-first-candidate representation do not double count. FR-054 / V3 FR-035. |
| S6-R2 | Medium, `1843e57` | After same-height reorg leaves no eligible LIVE item, invoke Latest while paused, then wait two animation frames for its actual render. The store switched to Follow/unavailable, but main’s separate selection flag stayed false: the explicit unavailable message disappeared and the reader substituted an old context-invalid target. Numeric gauges remained unavailable. Full suite first exposed this as 77 PASS / 1 Chromium FAIL; the own completed-render repro failed in both engines. | Main synchronizes its selection intent with the actual Latest result. Own both-engine completed-render checks pass with explicit unavailable, unchanged pause and no additional reads. The original immediate assertion could pass by reading the previous frame; the frozen original AC25 now waits for the action’s render. FR-055 / V3 FR-032. |
| S6-R3 | Medium, `810efc2` | Following reorg/unavailable, cause a real head-stream interruption. One captured `.network-notice` contained the attributed transport error but omitted LIVE unavailable because `model.error` displaced `model.note`. Independently reproduced in both engines. Sequential polling of separate messages was insufficient evidence because it could observe different frames. | The attributed error includes the same unavailable qualification. Own regression asserts both facts in one captured notice, then checks paused Latest/Follow without reads; both engines pass. Numeric authority stays unavailable. |
| S6-R4 | Medium, `810efc2` | Extend real AC22 after history eviction freezes the selected snapshot: click its already selected `BPinProtected` candidate button and wait two animation frames. Both engines discarded the frozen inspection and entered Follow because `pin()` searched retained history only and main treated failure as Follow. No new identity or Follow action was requested. | Existing frozen facts resolve before retained-history lookup. Reselect preserves the same immutable copy/baseline/count; a visible sibling is locally inspectable in that copy; a retained new pin replaces it. Explicit Latest separately clears the old frozen owner and selects coherent current evidence, and Follow remains an explicit exit. Own store regression and completed original AC22 in both engines pass. FR-051/053 / AC22. |

The final independent store scenario checks the important R4 boundary: frozen power 3 stays static while a still-LIVE same-instance owner reaches 5. Ordinary frozen reselect/sibling inspection retains the exact old snapshot object; Latest and Follow expose current power 5 instead of borrowing the frozen copy. Selecting a retained new pin replaces the frozen copy without reinserting the old history entry. The owner additionally recorded a genuine RED for this explicit-Latest boundary before freezing the correction; reviewer final verification independently passes it.

Independent temporary regressions are preserved outside the repository at `/tmp/observatory-s6-9a9529f-independent-regressions.patch`. Earlier RED patches are also outside the repository. Temporary tests/configuration and generated tracked screenshots were removed/restored before final clean status.

## Contract and architecture assessment

The six prepared design risks were checked at their real consumer boundaries:

| Risk / contract | Reviewed implementation and observed evidence |
|---|---|
| Latest must choose an actually LIVE candidate | `observationStore.ts` `liveSelection()` filters actual accepted records by contextual authority before selecting by original receipt; it does not choose an eligible instance and then borrow an inactive historical child. Store tests, original AC25, unavailable reorg cases and final explicit-Latest boundary pass. |
| Historical maxima retain their captured basis and committee | Full snapshots separate current phase committees from maximum committees and preserve maximum basis, denominator, threshold and original evidence. Own additional test replaces D1/power 3 with another delegate/power 2 under the same coherent context: current signer/committee changes, but the old maximum remains 3 with D1, original basis and receipt; the old snapshot stays unchanged. |
| Unique facts stay bounded across raw turnovers | Raw operations remain capped at 10,000; full history at 150; active accepted candidates and unresolved identities independently at 100 each; candidate facts at 100 per snapshot with pin protection. Unique historical signer/unknown-slot/conflict sets are bounded and visibly partial. Actual two-turnover and 10,000-distinct-payload consumer assertions pass; supporting memberships/selectable owners are pruned at bounded mutation boundaries. |
| Instance partial overrides candidate complete coverage | `captureHistory()` qualifies representative and candidate coverage and active publications when candidate/unique-fact retention is partial. The complete-snapshot-after-101-candidates case cannot regain measured zero through a candidate path; native AC24 and corresponding store checks pass. |
| Delayed admission retains earliest original receipt | The instance evidence takes the earliest admitted original monotonic receipt while candidate evidence remains separately original. Delayed earlier-body evidence joining a later admitted candidate preserves both receipts. Tie/replay/huge-level eviction checks use original monotonic order plus stable lexical identity, not admission time or claimed level. |
| Failed Latest explicitly unavailable | R2 and R3 close the actual application-state and error-priority failures, including completed rendering, interruption coexistence and paused no-read actions. |

`src/monitor/observationStore.ts` owns full immutable session snapshots separately from LIVE indexes and raw retention. `pin()`, `latest()`, `inspection()` and `captureHistory()` implement the distinct lifetimes; active-index eviction alone preserves historical candidate inspection. Only history-entry eviction freezes the selected snapshot. Retained same-identity facts may enrich before that boundary; later facts cannot modify the frozen copy. One frozen copy is retained per network and replaced on a new pin. No age-based pin expiry is introduced.

Newer-item accounting uses bounded retained identity owners and preserves proven counts/baselines while those owners remain. After all bounded owners are lost, it explicitly reports an “at least” count and partial first-arrival history: uncertain replay or an unprovably new identity does not become definitely new. This conservative limit is visible and tested; no infinite tombstone set is required or introduced.

Retained history supplies precise phase state when reconstructing active phase accounting. A retained event owns its exact phase identity, preventing an observed-quorum event beside an already retained crossing for that phase. The event list remains capped at twelve independently of history; selection, replay, resume, source/context changes and proven reorg return do not invent another crossing. This preserves S5’s distinction between actual admitted-history loss and unrelated/unadmitted raw loss.

Production `main.ts` renders stored historical provenance, phase signer/committee evidence, captured coverage and exact peaks. Unsupported historical eligibility/opportunities stay explicitly unavailable rather than borrowing current helper facts. `dashboardView.ts` uses monotonic elapsed age while retaining original wall receipts. Browser checks exercise provider switch, wall-clock jump, H1→same-height H2 plus delayed obsolete body, paused local inspection, focus/disclosure/nested scroll stability, pin enrichment, frozen replacement, distinct observers and unknown-hash promotion. Receipt navigation does not claim ancestry. Session history is explicitly browser-session/nonarchival and resets on reload.

No additional structural blocker was found. The principal regression risk is synchronizing the store’s inspection state with main’s reader intent, illustrated by R2/R4; final tests now wait for the resulting application render and assert the real selected state. Separate lifetime bounds and supporting-map pruning remain explicit; this review does not replace those bounds with a new retention product or budget.

## Independent execution ledger

All shell commands used RTK. Runtime was independently checked as Node **22.23.3** from `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin/node`, first on PATH. Final gates ran on detached exact `9a9529fb`, after restoring temporary tests. Browser isolation changed only detached Playwright server port/base URL to 5201, then restored it; frozen application code and original assertions were used for the complete suite and wrappers.

| Final command / check | Reviewer result | Exit |
|---|---|---|
| `rtk npm ci` | Clean install, 48 packages | 0 |
| `rtk npm run check` | Type check passes | 0 |
| `rtk npm test` | **159 tests / 17 files**, frozen suite | 0 |
| `rtk npm run build` | 16 modules; JS 111.63 kB, gzip 32.35 kB | 0 |
| `rtk npm test -- --testNamePattern REVIEW` | **3 unique independent groups PASS**, 159 frozen skipped; promotions/replays, maximum committee replacement, frozen versus live transitions | 0 |
| `rtk npm run test:e2e -- --grep REVIEW` | **4/4**, two own production scenarios × Chromium/Firefox, 2.8 s | 0 |
| `rtk npm run test:e2e` | **78/78**, Chromium/Firefox, 43.6 s | 0 |
| Imported browser-report classifier probes | **8 groups PASS**: proper completion, empty/missing engine/marker, skipped/runtime/assertion/mixed failure | 0 |
| `rtk git diff --check`; final HEAD/status checks | Exact final SHA; clean | 0 |

Native invocations were `rtk proxy node scripts/check-observatory-foundations.mjs AC-N`. Every implemented entry below was independently rerun on the final SHA and exited 0:

| AC | 1 | 2 | 3 | 9 | 10 | 11 | 12 | 14 | 18 | 19 |
|---|---|---|---|---|---|---|---|---|---|---|
| Assertion groups | 12 | 11 | 23 | 12 | 7 | 9 | 29 | 32 | 21 | 17 |

Original no-flag AC16, AC17 and AC23 internally require both production engines. Independently observed final groups: **13 / 25 / 9**, respectively; all exit 0. There is no native-only bypass for these original interfaces.

The explicit command suffix for the remaining browser wrappers was `--browsers chromium,firefox`; each completed both engines and exited 0:

| AC | 4 | 5 | 8 | 13 | 20 | 22 | 24 | 25 | 31 | 32 |
|---|---|---|---|---|---|---|---|---|---|---|
| Assertion groups | 7 | 2 | 2 | 2 | 2 | 14 | 10 | 15 | 33 | 12 |

Original AC15, AC21, AC30, AC35, AC36, AC37 and AC38 were individually invoked and each returned **ERROR / exit 2, incomplete**. Their future clauses were not replaced by passing subsets. In particular, a passing paused-inspection browser scenario does not close the original AC21 cancelled-comparison criterion.

Checkpoint evidence is preserved: initial `ab57c0e` independently passed clean check/build, 157 unit tests and 78 browsers in 45.2 s, yet R1 failed in store and both browsers. `1843e57` passed 158 units/check/build and the R1 regression but its full suite returned **77 PASS / 1 FAIL**; R2 subsequently failed deterministically in both engines after render completion. `810efc2` independently passed 158 units/check/build, all 78 browsers in 44.1 s and all implemented exact wrappers, yet own R3 and R4 extensions each failed in both engines. No broad rerun of superseded `9291d40` was counted. The final approval uses final exact-SHA execution, not those earlier green suites.

Execution qualifications: one reviewer accidentally overlapped a browser regression with AC16 on the same isolated port; AC16 correctly returned ERROR2 for the occupied port, then passed sequentially. A final temporary patch failed to apply because owner test context had changed; it was reconstructed as temporary consumer tests and rerun with nonempty completed counts. One intermediate temporary run duplicated a promotion test; it was removed, and the final result above counts only the three unique groups. These setup issues are neither product findings nor acceptance evidence. Reads/diffs/setup/restores completed successfully otherwise. The npm blocked-install-script warning was recorded; the actual production build succeeded. No separate lint command exists.

## Limits retained after S6 approval

S7 complete committee search/sort and its full control inventory remain open; S6 verifies the controls currently implemented and does not invent future controls. S8 comparison and cancellation, S9 historical opportunity/timing/predictive clauses, final programme closure and later ASTRA work remain open. Nonarchival disclosure alone does not close original AC37’s entire later contract. No whole-38-check GO, live-provider completeness/finality claim, public-origin certification, aesthetic acceptance or deployment approval is issued.

The conservative partial newer-history and real admitted-crossing-history limits remain visible after bounded identity loss. Historical missing scheduling/eligibility remains unavailable. The owner’s batching speed measurements were not independently benchmarked; passing semantic stress cases and bounded ownership were checked without machine-dependent performance thresholds. No coverage percentage is claimed. Generated historical S1/S4 PNGs were restored to their frozen versions and are not new S6 screenshot evidence.

All reviewer detached worktrees are clean. The root may accept this corrected **interim S6** revision while retaining the later-slice obligations above.
