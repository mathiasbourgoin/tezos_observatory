# Independent complete S4 review — INTERIM

Final reviewed revision: **`31c2119cc2135b7d96f600e3bde0764915dd728c`**, with full implementation scope compared against `33599973788d016098a28b8d8ba04dbbf4855d25`. Initial complete-S4 freeze `1ca36e34e0957ebeacabf7ddc984d6fa11a86109` was reviewed independently and required a correction. Separate detached worktrees: `/tmp/observatory-s4-complete-review-1ca36e3` and `/tmp/observatory-s4-final-review-31c2119`. Date: 2026-10-15.

**Recommendation: approve the corrected S4 checkpoint as INTERIM evidence.** No unresolved high/critical S4 finding remains from this review. This is not parent review GO, whole-contract completion, deployment/publication approval, or closure of later history, complete snapshot zero, comparison, events and opportunity requirements. Root retains integration authority. All10 slices and38 checks remain binding.

## Findings and correction disposition

**High, resolved at31c2119 — current-level validated B candidate stayed unresolved after a coherent proof.** At initial freeze, `src/rpc/networkData.ts:338–343` always replaced a candidate's observer with its verified parent. A B123 candidate received after actual B123 head observation therefore obtained a proof with observer B122. The immutable receipt correctly retained observed B123; `src/monitor/observationStore.ts:169–171` refused that incompatible proof. This stranded valid current-level evidence without power and violated the current/current+1 admission contract (FR027, US3, C9).

Independent actual store/facade reproduction at1ca36e3:

```ts
const current={...head(123),payload_hash:"P"}; installRpc(current);
const store=new ObservationStore<Derived>("mainnet",sources.mainnet);
store.observeHead({...current,evidence:evidence(b)});
const candidate={identity:"B-current-candidate",header:current,
  evidence:{...evidence(b),observedHeadHash:current.hash,observedHeadLevel:123}};
const record=store.addCandidate(candidate)!;
store.accept(await new NetworkData("mainnet").reconcile(
  record.target,new AbortController().signal));
expect(store.target(record.identity)?.admission).toBeDefined();
```

The assertion received undefined (Vitest exit1, actual assertion failure). Separate positive successor-candidate proof with observed B122 passed and kept the original receipt reference.

The production reproduction used actual `/` with A=SmartPy applied120, configured B=TzKT proving current123, one temporary B committee503, then a validated B123 proposal through the configured TzKT proposal stream. It selected that candidate before advancing the controlled monotonic clock and explicitly verified its displayed original `observed head BBlock123`. After cooldown and successful replacement committee response, both Chromium and Firefox still displayed `Unresolved` and unavailable numerical authority. The final assertion `expect(candidateEvidence).not.toContainText("Unresolved")` failed in both engines. This was distinct from earlier fixture/clock setup failures listed below.

The final correction preserves an actual observed same-level B head as observer and retains the verified parent as anchor. When only a parent context is available, successor-candidate admission remains supported. The receipt compatibility guard was unchanged. The exact domain and production reproductions both pass at31c2119. A new exact-source guard also rejects an A observer head injected into a B candidate before provider reads; an independent assertion verified rejection and zero reads. Independent same-parent competing current candidates remain separately accepted with observer H123, anchor H122 and unchanged receipts. Independent activation cases permit execution PActivated against parent PProducing.next=PActivated, for both observed-current and parent-anchored candidate branches; expecting PProducing is rejected.

The three prior findings closed at17abd2a remain closed at final31c2119: ordinary and cached candidate expected execution protocol substitution reject; omitted generation tokens cannot restore pre-pause authority (untouched initial epoch still permits the API's optional tokens); and constants with equal opaque key but contradictory context facts reject. The reviewer repeated these assertions independently rather than relying on owner results.

## Audited boundaries and evidence

Read the accepted spec, plan/addendum, whole implementation/reviewer role, project authority, TypeScript patterns, architecture, reviewer/architect skills and root S4 checklist. The full24-file3359997→1ca36e3 diff and three-file1ca36e3→31c2119 correction were reviewed. Implementation files were read-only; temporary assertions touched only the reviewer's detached test files. No owner or root application files were modified.

| Boundary | Established S4 evidence |
|---|---|
| Canonical store and identities | `observationStore.ts` distinguishes candidate hashes from candidate-free source/context/level/round/payload identities; raw10,000, shared unresolved100 and accepted-candidate100 products remain separately bounded. `networkMonitor.test.ts:439,449` exercises the real shared candidate/instance quarantine and canonical raw cap. Store tests exercise quarantine membership cleanup and accepted-product independence. Claims about full150 historical snapshots/pins remain deferred. |
| Source proof and network identity | Actual pinned/validated B context can establish session network identity without A proof availability or redundant chain_id read. Independent page test made A pinned proof503, then B123 displayed600/30,000, identity sourceB/proven headB122, A applied120, opposite phase unavailable, and no `/chain_id` request. A second page test proved known NetFixture then WrongChainB: raw target/provenance and WrongChain proof remained inspectable, both phase numerical authority unavailable, A120 retained. Both tests passed in both engines. |
| Admission and arithmetic | Native AC3 reaches real `NetworkMonitor`, `NetworkData`, canonical retained raw/targets and accounting, covering B current122/current123 proof for target123, round9 despite A round0/clock, exact D1 membership, power3 and deficit1, same-B reads and original receipt. Production promotion shows600/30,000 (2%) and independent A120; threshold20,000 yields deficit19,400. Two slots on competing payload produce1,200 without replacing selected600. No pooled powers. |
| Reader/provider change | `main.ts:100–219` consumes canonical targets; `main.ts:161` requires store context authorization before legacy derived rights can count. Production A→B operation-provider rotation and retained A/B selections show independently attributed600 and1,200 while applied A120 stays unchanged. The candidate correction test additionally confirms selected current B123 after helper recovery. |
| Failure ownership/replay | Native AC18 reaches actual monitor and real facade with held responses and controlled starts. An additional reviewer actual-monitor assertion fails K1 after observing B122, fails K2, replays K1, stop/starts and replays K1, then supplies a new raw packet for the same failed target: starts remain onlyK1/K2; original raw receipt remains identical. A fresh manual action after cooldown permits exactly one additionalK1 start. Retained-key ownership is supplied by monitor, not an unbounded tombstone index. |
| Coalescing/cooldown/read policy | Native AC18 verifies one active/newest queued, no intermediate K2 execution, 14999/15000 boundaries, failure unresolved/no authority, early manual rejection, fresh permitted retry, source-only request URLs, no permanent reconciliation timer and no forced raw reinsertion. Scheduler unit assertions cover material head/parent/protocol/target keys and receipt-only equality. Configured pool is fixed by monitor inputs and facade reconciliation validation. |
| Reorg/lifecycle | Store and actual monitor tests withdraw old B authority immediately upon observed fork before held replacement helpers resolve/fail; old raw receipt remains retained. Original AC4/20 and production late-body test run both engines: hidden starts none, pause/pagehide/BFCache preserves manual pause, old body ignoring abort cannot authorize after identical-context resume, no resumed automatic reconciliation start. |
| Opposite-phase uncertainty | `main.ts:355–368` supplies a phase gauge only when that phase has received signers. Production positive preattestation observations leave attestation gauge `—`; no complete snapshot zero is claimed by S4. The absence of a positive opposite-phase observation is not a valid source snapshot zero. |
| Architecture/API/dependencies | Canonical raw/target products and separate exact-context proof sidecars preserve original receipts and avoid a second required stored operation for promotion. Scheduler/facade/store lifecycle ownership stays explicit. No new dependency or generic infrastructure was introduced. Reviewer reused existing Vitest, Playwright and test helpers. Overall scoped architecture risk is low after the correction, with later history/coverage work still open. |

Native AC3 and AC18 assertion counts alone are not exhaustive browser certification: their code and actual consumer assertions were inspected, and production scenarios supplied the reader, manual retry and lifecycle evidence. Missing/empty runs are not counted as passes. Historical application-store evidence is deliberately not certified by these domain/production assertions.

## Independent executions

All runtime commands used Node22.23.3 with PATH prefix `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin:/home/mathias/.cargo/bin:/usr/local/bin:/usr/bin:/bin`; shell calls used RTK. No separate lint command exists.

| Command / revision | Exit and actual result |
|---|---|
| `rtk npm ci`, both initial1ca36e3 and final31c2119 | 0;48 packages. npm reported blocked esbuild install script; actual subsequent builds succeeded. |
| `rtk npm run check`, both freezes | 0 |
| `rtk npm test`, untouched initial freeze | 0;120 tests/17 files |
| `rtk npm test`, untouched final freeze | 0;122 tests/17 files |
| `rtk npm run build`, both freezes | 0;16 modules; initial84.20kB JS, final84.47kB JS |
| `rtk npm run test:e2e`, untouched initial freeze | 0;46 Chromium/Firefox tests in19.1s |
| `rtk npm run test:e2e -- --config playwright.review.config.ts`, restored final freeze | 0;46 Chromium/Firefox tests in19.6s |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-1`, both freezes | 0;12 assertion groups |
| same command AC-3, both freezes | 0;23 assertion groups |
| same command AC-9 / AC-10 / AC-11 / AC-12, both freezes | 0 each;12 /7 /9 /29 groups |
| same command AC-18, both freezes | 0;21 groups |
| same command AC-4 `--browsers chromium,firefox`, both freezes | 0;7 groups including actual `/` in both engines |
| same command AC-20 `--browsers chromium,firefox`, both freezes | 0;2 groups including actual `/` in both engines |
| original semantic AC-17 and AC-21, both freezes | **2 each**, unsupported/incomplete original invocation; not behavioral passes |
| `rtk npm test -- --testNamePattern REVIEW`, initial prior-regression assertions | 0;4 reviewer groups (120 frozen tests skipped) |
| same command `"REVIEW admits"`, initial current/future candidate | 1;current admission assertion failure, future positive pass |
| same command `"REVIEW retained"`, initial actual monitor failure ownership | 0;1 group |
| same command REVIEW, final after all variant additions | 0;10 reviewer groups,122 frozen tests skipped (132 total augmented tests) |
| `rtk npm run test:e2e -- --grep REVIEW`, initial B-identity page cases | 0;4 tests, two scenarios in both engines |
| same command with isolated config and `"REVIEW validated current"`, initial fully controlled current-candidate reproduction | 1;the product unresolved assertion failed in both engines |
| same command with isolated config and REVIEW, final | 0;6 tests, all three reviewer page scenarios in both engines |

The temporary `playwright.review.config.ts` imported the project's existing config and changed only server command/port/baseURL to5193. A subsequent run on5173 encountered another process using the shared port; no process was killed or reused. The isolated config ensured the final page belonged to the exact detached worktree. It was removed after verification.

Setup/execution results are disclosed separately. Early production reproduction attempts could not rotate a Mainnet proposal stream to SmartPy because the configured proposal pool contains onlyTzKT, then used an invalid validated-block envelope, then installed the clock after a queued timer was created. Those attempts timed out before reaching the target product assertion and are not findings. A candidate test that did not first assert its original observed context passed; it was insufficiently constrained and not used to contradict the demonstrated store issue. The final reproduction explicitly selected the candidate and verified observedB123 before advancing a clock installed before collection, then failed the intended product assertion in both engines. One run exited1 because5173 was occupied. One test-patch transfer used filtered RTK diff output and `git apply` exited128; it was corrected with raw `rtk proxy git diff`. The attempted empty reviewer filter then reported zero Vitest tests / Playwright `No tests found`; neither was counted as passing evidence. Subsequent positive counts above are actual executed assertions.

Read/navigation operations (`rtk read`, `rtk rg`, `rtk proxy sed`, full/directed `rtk git diff`) succeeded. Detached worktree creation, final diff whitespace check, screenshot SHA256 reads, test/screenshot restore and temporary-config removal succeeded. The scope/check utility was not independently invoked; no deterministic scope pass is inferred from the owner's claim. Diff scope was reviewed directly against the accepted vertical S4 capability. No live-origin probes were performed; fixture/browser success does not establish provider coverage or finality.

## Evidence artifacts and limits

Owner artifacts at the reviewed commits: `briefs/observatory-foundations-slice-4-impl.md` and `briefs/observatory-foundations-slice-4-current-candidate-fix.md`. Frozen S4 screenshot hashes independently match, before the initial test run and after restoring the final worktree:

- Chromium: `b63d38de6f581657459c133ef8c31a51c4f9751df7a4fdb0972e1765bca6f696`.
- Firefox: `e6995ad0dc548f7b7ad27e2ba7a15342d6b551b9c260146f53d5ea3ec4a17d8c`.

These are the original S4 images retained by the correction, not new final-fix screenshots and not substitutes for assertions. Historical S1 image content differs in the full3359997→S4 diff; restoring browser outputs to the frozen commits does not establish equality with the3359997 images. No screenshot-only QA claim is made.

**Deferred, already surfaced warnings outside S4 completion:** `main.ts:331–345` still uses the inherited compact recent-consensus model with zero-initialized opposite-phase peaks and source-free historical keys. The inherited missing-delegate summaries can report absent opposite-phase delegates without complete source snapshot evidence. Root's S4 screenshot inspection observed historical attestation0.0% and missing-attestation50/30,000 despite current attestation unavailable. These remain S5/S6/S7 coverage/history/committee findings, not certification of complete zero, full history or AC27; they were forwarded to the owner. S4's current opposite-phase gauge fix does not close these broader surfaces. Health prediction semantics remain later work. No historical AC16/17, complete-zero AC14/15, comparison-specific AC21, pin/history, crossings/events or opportunity acceptance is asserted here.

All temporary reviewer tests, configs and suite-generated tracked screenshot outputs were restored/removed in both detached worktrees; final `rtk git status --short` returned clean for both. The only root-workspace write is this report. No root/owner implementation edits, commits, pushes, integration, deployment or publication occurred. Open questions for the S4 boundary: none; later contract criteria remain open as described above.
