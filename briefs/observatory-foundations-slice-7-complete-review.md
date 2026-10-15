# Foundations S7 — independent complete-slice review

**APPROVE — INTERIM S7 only**, at `4a310c7249fe792b8b6b38f3a2c8f51bda1b13f1` (parent `3a683ae1901cc3df46ff277569d090a41ad87267`). Both independently reproduced S7 defects are corrected and independently revalidated. No unresolved blocking S7 finding remains. This is not whole-foundations or ASTRA approval.

Reviewed on 2026-10-15 in detached worktrees, finally `/tmp/observatory-s7-review-4a310c7`. Exact final HEAD and clean status were checked. No mutable owner/S8 implementation was inspected; no root application edit, integration, commit, push or deployment was performed. This report is the sole root-workspace write.

## Authority and scope

Read the accepted foundations spec/plan, relevant entities and full AC5/6/26/27 clauses, root `briefs/observatory-foundations-slices-7-8-review-preparation.md`, accepted V3 FR-043–046, S6 limits, project authority/TypeScript rules and applicable reviewer/architect guidance. The frozen `briefs/observatory-foundations-slice-7-impl.md` was checked against actual code and independent execution.

The complete S7 diff from `9a9529fb4b3f45ce72f6cb0ae67e4f5485f8c2eb` changes five files, 160 insertions and 21 deletions: main, dashboard view, checker, production browser tests and implementation evidence. It introduces no dependency, infrastructure, framework, CSS/header/logo or comparison/opportunity implementation.

## Findings closed

Both were medium correctness findings against frozen `3a683ae`. Exact reproductions were sent to the owner and root; both failed through the actual production `/` reader in Chromium and Firefox despite a green original suite.

| ID | Actual RED and consequence | Final correction / independent result |
|---|---|---|
| S7-R1 — known historical committee share disappears without votes | Prepare validated rights D1=3/D2=2, no votes, and a validated candidate. The current committee displays power 3/share 60.00%. Pin that candidate: power stays 3 but share becomes `—`. `renderPinned()` supplied the denominator only while rendering an observed phase fact, although the captured committee was already validated. This fails FR-059’s exact power/share requirement; unknown phase observation does not make known committee share unknown. | Main validates the captured committee independently and supplies a separate `committeeTotal`. Own two-engine repro now retains 3/5=60.00% through Pin; both phase columns remain partial/unavailable and both power gauges unavailable. No phase zero or receipt is fabricated to obtain the denominator. Strengthened original AC6 also passes. |
| S7-R2 — focused exclusion has no visible indication | A focused row ceasing to match remained correctly focused with `data-pending-exclusion=true`, but no text, accessibility indication or CSS consumed that attribute. The initial existing-AC26 receipt-filter extension exposed the renderer gap. The exact alias case was then independently reproduced: search Alpha, focus D1’s copy control, correct the raw alias return to Gamma at the existing `NetworkData.alias` consumer boundary, and deliver an operation to trigger real main/view rendering. Gamma stays focused/nonmatching with no visible pending indication. This violates accepted V3 FR-045; the finding does not infer an alias rule solely from receipt filtering. | The existing row now visibly says “Pending exclusion until focus leaves”. Own exact alias correction passes in both engines: focus and the updated Gamma copy label survive, pending status is visible, and blur removes the nonmatching row. Original AC26 additionally checks this exact correction and the receipt-filter path. Matching and sorting still use the raw alias, not the appended indication or attribution. |

The alias regression deliberately controls the existing alias API’s returned value on the real page. It proves the production reader’s correction behavior, not a new public-network alias-refresh workflow. No replacement dashboard, duplicate committee model or implementation edit was used.

Final own browser regressions are preserved outside the repository at `/tmp/observatory-s7-4a310c7-independent-regressions.patch`; the initial RED patch is `/tmp/observatory-s7-3a683ae-independent-regressions.patch`. Temporary tests were restored before the complete frozen gates. Both reviewer worktrees are clean.

## Contract and architecture assessment

`src/dashboardView.ts`, `delegateList()`, maintains existing row nodes and address order. Query matching trims and lowercases, then evaluates raw alias OR address separately. Displayed TzKT attribution, context text and text spanning alias/address do not match. Explicit address/alias/power sorting uses address ties; prefix aliases sort by raw alias. Incoming aliases/receipts preserve existing matching order, append newly matching rows and require explicit resort to reorder. Unfocused nonmatches disappear; focused nonmatches remain marked until blur, then leave without automatic resort.

Original AC26 exercises delayed once-fetched aliases, new-match append, explicit resort/ties, raw-field negative queries, prefix aliases, focus/scroll/disclosure stability, receipt changes, exact alias correction and paused local controls. Search/sort/filter actions only render stored data; their paused request ledger stays unchanged and collection stays paused. The row map drops removed rows; the added view state is bounded by the current validated committee rather than an accumulating alias/event history.

`src/main.ts` builds committee rows from validated current rights or the selected captured historical committee. It separates the observer from the original rights responder and preserves chain/head/target/protocol context. Historical eligibility explicitly stays uncaptured/unavailable instead of borrowing current helper state. Mainnet’s unavailable eligibility is displayed honestly; this review does not demand fabricated eligibility or extra Mainnet fanout.

Each phase independently reports received, absent in a usable selected-source snapshot, or partial/unavailable. Validated committee membership/share is independent from receiving a vote. Unknown-rights raw signer slots remain separately inspectable with unknown power and actual source attribution; they do not become committee delegates. A positive preattestation does not create an attestation zero. A later coherent full snapshot can justify source-qualified absence; interruption removes that current absence claim. Missing rights preserve attributed raw observations while both numerical gauges and committee authority remain unavailable.

The corrected historical `committeeTotal` is deliberately separate from phase gauge facts. It preserves the captured committee basis while permitting both phase observations to remain unknown. It does not reprice historical maxima or replace captured rights with current data. Existing S6 pin/frozen-copy/Latest/Follow, provenance, receipt ordering, independent retention bounds and event-retirement tests all remain in the independently executed full suite and exact wrappers.

Extended original AC5 now exercises actual committee query, explicit alias sort, row ordering, search focus and nested committee scroll through pinned same-identity evidence updates, alongside identity, captured receipts, phase committee, peaks, provenance, coverage, newer count and pause/Follow behavior. This closes the S6 control-inventory limitation for these implemented S7 controls; it does not close later comparison/timing or ASTRA controls.

No additional structural or security blocker was found. DOM content is assigned as text, and existing validated domain data supplies the view. The change remains in the established main/view ownership boundaries; it does not introduce another RPC or collection owner.

## Independent execution ledger

All shell commands used RTK. Node was independently checked as **22.23.3**, from `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin/node`, first on PATH. Final executions used detached exact `4a310c7`. Browser isolation changed only the detached Playwright port/base URL to 5203, then restored it. Frozen application and original tests were used for the full suite and semantic wrappers.

| Final command / check | Reviewer result | Exit |
|---|---|---|
| `rtk npm ci` | Clean install, 48 packages | 0 |
| `rtk npm run check` | Type check passes | 0 |
| `rtk npm test` | **159 tests / 17 files** | 0 |
| `rtk npm run build` | 16 modules; JS 116.98 kB, gzip 33.88 kB | 0 |
| `rtk npm run test:e2e -- --grep REVIEW` | **4/4** own production regressions, Chromium/Firefox, 2.9 s, including copy-label and unknown-phase positives | 0 |
| `rtk npm run test:e2e` after restoring temporary tests | **84/84**, Chromium/Firefox, 49.1 s | 0 |
| Imported browser classifier adversaries | **8 groups PASS**: completion, empty/missing engine/marker, skipped/runtime/assertion/mixed failures | 0 |
| `rtk git diff --check`; final HEAD/status checks | Exact final SHA; clean | 0 |

Native invocations were `rtk proxy node scripts/check-observatory-foundations.mjs AC-N`; all final entries below exited 0:

| AC | 1 | 2 | 3 | 9 | 10 | 11 | 12 | 14 | 18 | 19 |
|---|---|---|---|---|---|---|---|---|---|---|
| Assertion groups | 12 | 11 | 23 | 12 | 7 | 9 | 29 | 32 | 21 | 17 |

Original no-flag AC16/17/23 internally require both production engines; independently observed final counts were **13 / 25 / 9**, all exit 0. The other browser invocations used `--browsers chromium,firefox`; every entry completed both engines and exited 0:

| AC | 4 | 5 | 6 | 8 | 13 | 20 | 22 | 24 | 25 | 26 | 27 | 31 | 32 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Assertion groups | 7 | 2 | 2 | 2 | 2 | 2 | 14 | 10 | 15 | 2 | 2 | 33 | 12 |

Original AC15/21/30/35/36/37/38 were individually invoked and each returned **ERROR / exit 2, incomplete**. Passing local inspection, alias or source-qualification subsets do not close those original later criteria. AC7/28/29/33/34 remain later-slice obligations and were not acceptance-tested in this S7 review. No whole-38-check claim is made.

Initial `3a683ae` independently passed 159 units, check/build, all **84 browsers in 49.0 s**, and exact original AC5/6/26/27 (two completed engine groups each). The own candidate-only share and pending-indication extensions then returned four real browser assertion failures; the exact raw-alias correction separately returned two real assertion failures. Those green original runs did not override the adversarial REDs. The owner’s earlier 82/2 fixture diagnostics are preserved in its artifact; they were not reproduced or recast here as independent product findings.

One exploratory read referenced V3 paths absent from the detached foundations snapshot and returned exit 2; the accepted root V3 contract had already been read directly. This was a read/setup error, not a product or semantic-run failure. Temporary correction assertions accept the visible marker appended to the alias cell while still requiring the raw alias and updated accessible copy label. No tests with missing scenarios or completion evidence were counted as passing. All other setup, read/diff, patch/save and restore commands completed successfully. The npm blocked-install-script warning was recorded; the actual build succeeded. No separate lint command or coverage percentage exists/is claimed.

## Limits retained

S8 independent comparison, its cancellation/read budgets and full shared source-qualification criteria remain open. S9 historical opportunity/timing and predictive clauses remain open. Final full-foundations independent review/QA and later ASTRA composition/accessibility/rendered-matrix acceptance remain required. This report certifies no live-provider completeness, finality, public-origin behavior, archive completeness, aesthetic acceptance or deployment.

S5/S6 conservative uncertainty after real bounded history loss remains visible; S7 does not turn it into exact cumulative history. Historical uncaptured eligibility/opportunities stay unavailable. No new S7 screenshot certification is claimed: generated historical S1/S4 PNGs were restored to their frozen versions. Both detached reviewer worktrees are clean, and the root may accept this corrected **interim S7** revision with the later obligations above intact.
