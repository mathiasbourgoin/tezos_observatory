# Independent whole-foundations review — NO-GO

Frozen revision: `69dacc8f9d3fc0f49092174df2a3c80ad852ff16`. Detached checkout: `/tmp/observatory-foundations-whole-review-69dacc8`; browser port 5212; Node v22.23.3. This is a review of the complete accepted foundations contract, not QA, Astra visual acceptance, publication or deployment. No application change was made. After restoring the temporary port configuration and six generated screenshots, the detached checkout has a clean tracked/untracked status; only this authorized uncommitted report is added in root. Owner correction `1d9d4ca6a16ca34e2efd0f5458d76ea7f15f97de` has not been reviewed or accepted here.

Two independently reproduced HIGH defects block approval despite passing committed checks. Root has received both findings and owns correction coordination.

## HIGH 1 — Retired observed quorum can append its original event again

Location: `src/monitor/observationStore.ts:445–454`, particularly line 452. When a phase is absent from bounded history, `!old && firstQuorum` permits a new observed-quorum event even when history loss makes first-ever observation unknowable. The retained twelve-event list cannot deduplicate an event already evicted from that list.

Reproduction uses the real ObservationStore and NetworkData reconciliation: committee D1=3, D2=2, total5, threshold4; record a complete preattestation for payload P, then 151 later payloads, then 10000 unrelated raw records. Replay the original operation with a new receipt. The original P event is appended again with the same phase identity despite explicit crossing-history uncertainty. This violates C24/FR081 and the accepted AC32 replay requirement, including the assignment's explicit prohibition on a restored observed-quorum duplicate. FR092 permits uncertain reconstructed positive power/quorum state; it does not establish a new first-ever event.

Patch: `/home/mathias/whole-review-69dacc8-evidence/retired-observed-quorum.patch`. Apply only in an isolated checkout, then run under Node22:

```sh
rtk proxy npx vitest run tests/unit/observationStore.test.ts -t 'independent whole review'
```

Result: one executed test with a completed assertion failure, not a runtime failure; other tests intentionally filtered. An initial probe reused the old receipt and was immediately evicted, so it did not reproduce the defect; the preserved reproduction uses a new transport receipt. Do not replace bounded storage with unbounded tombstones. Preserve positive as-of power and uncertainty while withholding an unprovable new event.

## HIGH 2 — Valid autonomous source B is hidden while source A has no applied snapshot

Location: `src/main.ts:143–160`. The early return for `!view || !snapshot` precedes retained-source selection and rendering. Its primary applied-head requirement hides independently validated observer B evidence.

Production `/` reproduction starts hidden, resumes with A's head stream silent and its first head/header request held, allows operations to rotate to B, and supplies actual B head122, pinned protocol/parent/rights proof for target123 and one slot0 preattestation. A read-only hook around the real store accept verifies Mainnet pre power600 has actually been admitted. The page nevertheless shows `Voting power unavailable` and `Operations unavailable`, and provides no usable B selection. Expected: B's source-local 600/30000 remains inspectable without fabricating an A applied head. This breaches intake item6 and the autonomous observer obligations in FR025–028/AC3.

Patch: `/home/mathias/whole-review-69dacc8-evidence/autonomous-b.patch`; actual JSON: `autonomous-b.json` in that directory.

```sh
rtk proxy npx playwright test tests/e2e/dashboard.spec.ts --grep 'independent whole review B' --project chromium --project firefox --reporter=json
```

Result: two completed behavior assertion failures, Chromium and Firefox; zero skips, no runtime/page error. The read-only hook records actual accepted Mainnet power, not merely a requested URL or a different network's admission.

## Fresh verification

All results below are my own baseline execution. The source/test/checker/package/config diff against accepted app revision `b964fed57cacbc3c33174f4a4e00755a9c6f94bf` is empty. Source SHA256 entries in `roster/observatory-foundations/final-checks.json` were independently recomputed with no mismatch after temporary tests were restored.

| Command | Actual result |
| --- | --- |
| `npm ci` | clean rerun exit0, 48 packages, zero vulnerabilities |
| `npm run check` | exit0 |
| `npm test` | exit0, 258 tests in19 files |
| `npm run test:e2e` | exit0, 136 passed across Chromium/Firefox |
| `npm run build` | exit0, 18 modules, JS145.06kB/gzip41.56kB |
| `node scripts/review-bundle-verify.js` | exit0, bundle1.8.0, 28 SHA matches |
| `node .harness/bin/claims-reconcile.js check` | exit0, current323 mandatory claims |

Every shell command was routed through RTK. Browser configuration was temporarily assigned strict port5212; no product source was changed. Dependency installation initially encountered ENOSPC; one nominal exit0 containing TAR_ENTRY_ERROR was rejected as evidence. Root freed space and a clean installation was executed. The initial AC batch mistakenly overlapped the running full browser gate: affected browser cases returned setup ERROR2. Those results remain preserved under the evidence directory; they have not been relabelled. After the full gate completed and released the port, all38 commands were executed sequentially and completed successfully below.

Current managed context is `roster/observatory-v3/context.manifest.json`, 323 claims (170 foundations +153 V3), model `5c03c7a62d889f67edfaa3ade81eca950351071ecd7a1ac2da7ecb0f2ebca532`, freshness `ceb740eb6e894bacaa792db0bb79070c521775172cb2391a01c5f3bb1bed51fc`. The historical170-claim foundations manifest was not substituted for it.

### All original CHECK commands

The following exact specification commands ran under Node22. Logs and machine-readable command/exit records are preserved in `/home/mathias/whole-review-69dacc8-evidence/sequential/`. Counts are checker completed assertions, not independent proof of every requirement. Native-spelled16/17/19/23 also ran both engines internally.

| AC | Exact command | Exit | Assertions |
| --- | --- | --- | --- |
| 1 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-1` | 0 | 12 |
| 2 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-2` | 0 | 11 |
| 3 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-3` | 0 | 23 |
| 4 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-4 --browsers chromium,firefox` | 0 | 7 |
| 5 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-5 --browsers chromium,firefox` | 0 | 2 |
| 6 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-6 --browsers chromium,firefox` | 0 | 2 |
| 7 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-7 --browsers chromium,firefox` | 0 | 13 |
| 8 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-8 --browsers chromium,firefox` | 0 | 2 |
| 9 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-9` | 0 | 12 |
| 10 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-10` | 0 | 7 |
| 11 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-11` | 0 | 9 |
| 12 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-12` | 0 | 29 |
| 13 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-13 --browsers chromium,firefox` | 0 | 2 |
| 14 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-14` | 0 | 32 |
| 15 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-15 --browsers chromium,firefox` | 0 | 2 |
| 16 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-16` | 0 | 13 |
| 17 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-17` | 0 | 25 |
| 18 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-18` | 0 | 21 |
| 19 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-19` | 0 | 19 |
| 20 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-20 --browsers chromium,firefox` | 0 | 2 |
| 21 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-21 --browsers chromium,firefox` | 0 | 7 |
| 22 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-22 --browsers chromium,firefox` | 0 | 14 |
| 23 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-23` | 0 | 9 |
| 24 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-24 --browsers chromium,firefox` | 0 | 10 |
| 25 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-25 --browsers chromium,firefox` | 0 | 15 |
| 26 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-26 --browsers chromium,firefox` | 0 | 2 |
| 27 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-27 --browsers chromium,firefox` | 0 | 2 |
| 28 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-28 --browsers chromium,firefox` | 0 | 13 |
| 29 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-29 --browsers chromium,firefox` | 0 | 13 |
| 30 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-30 --browsers chromium,firefox` | 0 | 20 |
| 31 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-31 --browsers chromium,firefox` | 0 | 33 |
| 32 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-32 --browsers chromium,firefox` | 0 | 12 |
| 33 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-33 --browsers chromium,firefox` | 0 | 2 |
| 34 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-34 --browsers chromium,firefox` | 0 | 33 |
| 35 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-35 --browsers chromium,firefox` | 0 | 13 |
| 36 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-36 --browsers chromium,firefox` | 0 | 13 |
| 37 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-37 --browsers chromium,firefox` | 0 | 13 |
| 38 | `rtk proxy node scripts/check-observatory-foundations.mjs AC-38 --browsers chromium,firefox` | 0 | 13 |

Mixed engine failure classification was independently exercised through the actual checker in both orderings: Chromium assertion/Firefox runtime, then Chromium runtime/Firefox assertion. Both returned2 with the injected runtime error preserved (`mixed-correct-*.log`, `mixed-correct-results.json`). An initial attempt redirected child JSON away from checker stdout and correctly produced missing-report ERROR2; those setup results are preserved separately and are not mixed-priority proof. Existing checkRunner tests also pass, but are supplementary to the actual runner exercise. Temporary test injections were restored.

## Independent arithmetic and consumer proof

The independent oracle `/home/mathias/whole-review-69dacc8-evidence/numerical.mjs` imports actual production modules through existing Vite and compares their output against separately declared exact BigInt sums. It passed. No additional framework was built.

- D1=3/D2=2 gives total5 and threshold4. Individual plus overlapping aggregate replay remains Ppre3; Qpre2 independently. Deficits are1 and2. A conflicting D1 vote makes Qpre5 while Ppre stays3 and marks the conflicting delegate. Attestation D2 power2 remains phase independent.
- Independent powers3/1/1 exercise threshold−1, threshold, threshold+1: powers3/4/5, deficits1/0/0, shares60/80/100 percent. A malformed aggregate containing a negative slot is rejected atomically. Unsafe MAX_SAFE_INTEGER+1 is rejected; a safe exact cumulative boundary is accepted.
- An additional real retained-store test passed: pre600/30000 retains captured threshold20000 after supporting raw eviction; new att600 uses corrected threshold600. Pre deficit is19400; att may be reached. Maximum committee bases independently remain30000, while their captured thresholds remain20000 and600 respectively. Patch `numeric-asymmetric.patch` preserves this executed probe.
- The committed production-reader regression at `tests/e2e/dashboard.spec.ts:924–936` passed in both engines in my full136 run: actual retained pre reader shows deficit19400 rather than reached; att600/600 is independently reached. Thus store arithmetic and actual reader were both covered.
- Timing oracle checked pre-anchor, tiny elapsed and exact first boundary for positive minimum1 and increments2/3/20, plus selected round2 timestamp27000/minimum6/increment3 endpoint39000. Results remained finite. Selected-relative branches, independent clock estimates, unavailable migration/parent/overflow and captured historical timing were traced through actual production consumers and their committed browser cases.

## Saved public-origin evidence and protocol limits

I read the exact response/adjudication artifacts associated with origin commit `811c7f6d13cda3d77cfb082bab68a98734db9986`, checked their hashes and independently recomputed saved arithmetic. Response hash: `17e4be3502f7ba75ad21c5651136801f2ea4db2141d6dbfac58fc692d762c731`; adjudication hash: `c6090252b1ef407080d059d9762cb9774a3491679716f389cb341560c5808c41`.

The bounded sample is 2026-10-15 03:57:55.588–03:58:00.553 UTC, 26 GETs across two real-origin browsers with application assets blocked, no retries/fallback/polling. Mainnet rights403 leaves that helper unavailable. Shadownet has25 unique delegates/slots, exactly7000 power, threshold4667, including one valid zero-power delegate; 4667/7000 is66.6714285714%. Header round182 with minimum6/increment3 and timestamp03:51:18 yields conditional endpoint04:00:30 UTC. Both engine samples agree. No pending operations, votes or baking rights were read. This cannot establish phase zero, signers, producer, finality, current provider completeness or deployed S9 rendering. No external RPC sampling was repeated.

Protocol applicability was checked against immutable primary Tezos source at revision `5c73fc9ae945fa222307de01c22403526ce197ee`: round cumulative duration and timestamp arithmetic, header timestamp validation, fitness decoding, context preparation, and application validation's incoming predecessor-round/context constants. Relevant source: [round_repr.ml](https://raw.githubusercontent.com/tezos/tezos-mirror/5c73fc9ae945fa222307de01c22403526ce197ee/src/proto_025_PsUshuai/lib_protocol/round_repr.ml). Saved arithmetic is a conditional consistency check, not evidence that an unobserved block happened.

## Complete contract coverage disposition

All94 FR,38 AC,11 intake items and29 clarifications were read and reconciled against production owners, actual reader and test assertions. The full accepted wording, rather than slice numbering or inventory count, governed review. Findings above prevent whole acceptance: FR025–028/AC3/intake6 for autonomous B; C24/FR081/AC32 for retired event replay. Other reviewed clauses have no additional confirmed blocker, subject to the finite fixture and saved-origin limits stated here. Passing CHECK3/CHECK32 do not discharge the broader independently failing interactions.

Coverage across the complete contract includes operation/committee atomic guards and exact power, delegate replay/conflicts and separate phase/source/payload identities; full-versus-partial snapshot zero authority and signer coverage; actual observer chain/parent/execution protocol and responder receipts; initial hidden/manual pause/BFCache and late generation/body fences; per-source scheduling/coalescing/manual retry and bounded eligibility; distinct full/accepted/unresolved/fact/shared-raw bounds; retained and frozen pin selection, Latest/Follow/newer counts and UI state; immutable events, current and maximum captured bases; full committee and alias exclusion/order; immutable independent comparison facts and budgets without union; both selected-relative opportunity branches and separate applied-head clock. Cross-interaction evidence includes raw loss plus quorum correction plus retained rendering, full identity retirement plus event replay, and autonomous B admission plus the no-primary-head production reader.

Explicit accepted-ID inventory (reviewed, not blanket PASS):

FR: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, FR-019, FR-020, FR-021, FR-022, FR-023, FR-024, FR-025, FR-026, FR-027, FR-028, FR-029, FR-030, FR-031, FR-032, FR-033, FR-034, FR-035, FR-036, FR-037, FR-038, FR-039, FR-040, FR-041, FR-042, FR-043, FR-044, FR-045, FR-046, FR-047, FR-048, FR-049, FR-050, FR-051, FR-052, FR-053, FR-054, FR-055, FR-056, FR-057, FR-058, FR-059, FR-060, FR-061, FR-062, FR-063, FR-064, FR-065, FR-066, FR-067, FR-068, FR-069, FR-070, FR-071, FR-072, FR-073, FR-074, FR-075, FR-076, FR-077, FR-078, FR-079, FR-080, FR-081, FR-082, FR-083, FR-084, FR-085, FR-086, FR-087, FR-088, FR-089, FR-090, FR-091, FR-092, FR-093, FR-094.

AC: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18, AC-19, AC-20, AC-21, AC-22, AC-23, AC-24, AC-25, AC-26, AC-27, AC-28, AC-29, AC-30, AC-31, AC-32, AC-33, AC-34, AC-35, AC-36, AC-37, AC-38.

Intake: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11. Clarifications: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29.

## Read ledger

All repository reads below use frozen69dacc8 unless explicitly identified as external or origin evidence. Truncated responses were reread in smaller chunks; a summary was not substituted for the mandatory contract.

| Material | Complete read ranges / method |
| --- | --- |
| Assignment | `briefs/observatory-foundations-fresh-whole-reviewer.md`, entire file |
| Instructions | supplied AGENTS instructions; `/home/mathias/.codex/RTK.md`; reviewer, roster-review (1–220,221–450,451–619,620–744), architect and code-quality-auditor skills; all applicable `.harness/rules/` project-authority, typescript-patterns, code-quality, escalation, human-validation and sycophancy files |
| Mandatory briefs | final-review-preparation1–17; reviewer1–173; plan1–142; qa-scope1–125,126–232; impl1–44; contract-parity1–110,111–219; glossary-addendum1–31 |
| Full accepted spec | `specs/observatory-foundations.md`1–160,161–320,321–470,471–607, with390–430 reread to recover truncated command text |
| KB | README1–13; properties1–51,52–72,73–90; glossary1–95; risks1–28; architecture1–18; context/v3-contract1–18; required-properties1–21 |
| Managed evidence | complete current323 manifest normalized JSON; current model/freshness verification; historical170 metadata distinguished; final-checks.json1–165,166–330,331–481 |
| Slice history | all nine implementation reports S1–S9; S1 architecture/w1-disposition; S2/S3 reviews; S4 domain-interim/domain-review/domain-review-fixes/complete-review/current-candidate-fix; S5/S6/S7 complete-reviews; S8 complete-review/review-fixes; S9 complete-review/review-fixes/computed-clock-fixes/review-preparation, all entire files with smaller rereads after truncation |
| Origin | live-origin brief1–46; every26 response receipt and both13-URL ledgers, every unique full response body by duplicate SHA mapping, complete adjudication; immutable protocol sources as above |
| Domain and authority | all models, guards, phaseEvidence, operationStore, headGeneration, observerReconciliation; observationStore1–160,161–320,321–465; networkData1–120,121–260,261–380,381–485 |
| Lifecycle/consumer | networkMonitor1–160,161–320,321–460,461–583; main1–150,151–290,291–430,431–562; dashboardView1–160,161–270,271–351; complete roundSchedule/opportunityFacts/streamTransport/jsonStream |
| Checker | complete597 lines in bounded85/110/105/120/90/87-line chunks; complete checkRunner tests; package and Vite/Playwright configuration |
| Actual production tests | complete dashboard.spec.ts1–1016 in bounded overlapping chunks, including explicit371–395 and644–689 rereads; targeted observationStore test definitions and real executed probes |

The explicit assignment overrides generic roster-review auto-fix, delegation, trace/ledger writes and convergence workflow. No subagent, owner fix, automatic QA ledger GO or additional root artifact was created. Existing slice reports and owner's later fix results are historical/inherited evidence only; they do not count toward any execution above.

## Disposition

**NO-GO for the whole accepted foundations contract at69dacc8.** Route both HIGH findings to the existing owner. Independently review the corrected frozen source and rerun both counterexamples, affected complete criteria and required gates before reconsidering whole approval. This review grants no QA, Astra or deployment acceptance.
