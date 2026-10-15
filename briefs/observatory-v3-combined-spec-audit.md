# Combined specification audit — bounded NO-GO

Auditor: fresh independent `/root/v3_combined_spec_audit`, 2026-10-15. This is one specialist invocation with four explicit source scopes, not four independent agents. No publication, deployment, canonical review state, contract or KB mutation was performed.

Candidate `dc89e072406dadd3b23857f8e862f90b0da72f02` has two blocking findings in the accompanying JSON: the missing phase-specific receipt/age observable and the independently reproduced clean unit-before-build failure. The latter duplicates the primary reviewer/root finding. The former is a new product/spec gap. Root was notified immediately after the actual two-engine reproduction. No product fix was made by this reviewer.

## Immutable candidate and environment

Own detached checkout `/var/tmp/observatory-spec-dc89`; private evidence `/var/tmp/observatory-spec-evidence`; TMPDIR `/var/tmp`; Node22.23.3 via `/tmp/context-review-node22-bin`; ordinary served-dist port5856; one browser worker. After removing the private diagnostic test, checkout is clean and official sourceBindings independently reproduces exactly:

- sourceCombined `8e3baa5a013ba1e8409dba9deac05fce1f1117cd2e05651e42183dcec6768c2f`
- contractCombined `d7cbf8eb896bab0f8a7339ce65085ed6c33ad5a72222b995e0ec004aee9e7414`
- productionCombined `365223127df639edc5261d9c4ba34b3c7752c487048bea42907c613c19e818a8`

The foundation and V3 authoritative specs have no diff from accepted basebf0. Scope-diff disposition belongs to the root scope gate. No infrastructure/dependency/framework was introduced or library selected; existing Playwright/native TypeScript consumer and claims tools were reused. A separately queried default-shell node is26.11.1; all actual install/check/unit/build/browser gates explicitly selected Node22.23.3.

## Scope1: foundation source preservation

Reviewed authoritative94FR/38AC/38CHECK obligations with qualified namespace, the accepted implementation handoff, source-local context/admission, immutable receipts, numerical authority, lifecycle, retained/frozen selection, bounded provenance, phase events, conditional opportunities and independent comparison consumers. Whole modified files read include main.ts, dashboardView.ts, observationMeaning.ts, networkMonitor.ts, observationStore.ts, networkData.ts, guards.ts, candidateProducer.ts and blockIntervals.ts; relevant CSS declarations, inspection entry and unchanged phaseEvidence/opportunityFacts/roundSchedule/sourceComparison consumers were also inspected.

Source evidence: ObservationStore.accept/tryAdmission at src/monitor/observationStore.ts:237/286 preserve coherent observer/anchor/protocol/rights authority; pending parser at src/rpc/networkData.ts:350 distinguishes independently complete phases; networkMonitor.ts:470 preserves complete phase facts when the opposite phase fails and retains manual retry. ObservationStore.captureHistory:411 protects selected candidate facts under100 and freezes only150-entry history eviction; refreshAcceptedPhases:447 retains separate maximum basis and bounded events, not render-created crossings. main.ts:86/617 fences all runtime owners on pause/hidden/pagehide. sourceComparison.ts:118 retains identity→head→pending within one bounded workflow and immutable cached-right provenance.

Own actual browser coverage includes promotion receipt navigation, hash-pinned baker attribution, each independently complete zero phase in LIVE/pin, interval unknown-proof/reorg isolation, applied tuple and duplicate/A→B→A semantics. These targeted passes do not certify all foundation38 interfaces or reproduce the whole accepted baseline review. No new foundation source contradiction was established outside the linked V3 phase-provenance gap.

## Scope2: V3 implementation

Reviewed main selection/model assembly before dashboard reader/camera. main.ts:127 derives receipt Previous from authoritative navigationUnits; one-off Latest and ongoing Follow stay distinct. dashboardView.ts:362 cancels/replaces one160ms animation, keeps literal UP/RIGHT axes, static gap/source/candidate replacement and reduced-motion cancellation. navigatorObservation at main.ts:144 distinguishes context-only versus actual candidate ancestry. Captured opportunities retain independent proposer/timing qualification and token-fenced immutable historical facts through main.ts:514 and opportunityFacts.ts:14. Native disclosure/radio theme controls use optional storage and explicit session notice, stable keyed committee rows and focused pending exclusion.

Confirmed missing requirement: specs/observatory-v3.md:169 FR-005 requires each phase receipt/age. VoteView has no evidence fields. main.ts:337 obtains one selected record receipt; :390 uses it for snapshot age; :471 emits phase values without preEvidence/attEvidence. gauge():99 cannot expose either independent receipt. In the private diagnostic, a preattestation first arrives at12:00:30 and a different phase attestation arrives five seconds later. Both have600/30000. All disclosures are opened. Both gauges omit receipt/age and full panel still exposes only selected first receipt12:00:30/age5s; no12:00:35 phase receipt is available. Two-engine inverse assertions pass, proving the missing observable rather than accepting the contract. Original probe attempts01/02 failed on diagnostic selectors and are preserved; only exact selectors changed, no timeout relaxation. Diagnostic source is retained privately and removed from checkout before final binding.

Actual selected source-meaning scenario proves authentic material proof receipt, duplicate identity stability and cached A→B→A advancement; readonly appliedProof is not used to replace metric admission. No consensus authority or network request was added by observationMeaning. Producer metadata remains hash-pinned and separate from expected proposer; unsupported/failed evidence remains unknown.

## Scope3: interval metrics

Reviewed all30FR/20AC/20CHECK declarations against feature collector/controller and integrated consumers. src/rpc/blockIntervals.ts:35 parses only0/1 rows; :39 computes true elapsed/span denominator; :102 allows exact floor equality, local floor failures and one shared earliest for empty floors; :118 rechecks fixed E atomically. :61/read enforces6 reads, streamed16KiB cap,8s full-body and24s whole deadline with abort-independent settlement. Two workers bound concurrency. Metadata is initial-response-only; fetch freshness is completion-monotonic while indexed endpoint age retains capturedT. BlockIntervals:138 keeps60s start spacing, drops ineligible triggers, fences generations and retains sticky stale evidence. main.ts:584 uses current derived observer proof matching actual applied head and expected chain, not initial network association alone. dashboardView.ts:68 displays explicit qualification/coverage/endpoints and stable native network-associated refresh/details. Actual two-engine probes pass ordinary means and qualified versus unqualified applied replacement fences.

No additional metric arithmetic/acquisition/controller divergence was found in this source audit. MetricAC15/full matrix/native independent judgment is explicitly unexecuted here; no historical bounded approval is promoted to whole feature acceptance.

## Scope4: KB projection and check binding

Fresh bundle preflight independently verifies28 files at1.9.0. Official claims check exits0 with current digest050df4d86fc51e3551f09ecd2b698f505c70db869bb425f9d897e21fe1e1f2d8, and kb/index.md, kb/properties.md and kb/spec.md are fresh. Extract/context outputs enumerate exactly393 mandatory claims: foundation170, V3153, metric70;202FR,95AC,96CHECK. Qualified identifiers and dependencies remain intact. Metric context matches current393/digest; old foundation170/V3323 context manifests are historical and differ from current digest. This is reported for root lifecycle handling, not silently rewritten. KB is a projection and was never treated as implementation evidence.

All393 identifiers/source lines and explicit audit/execution status are retained in `/var/tmp/observatory-spec-evidence/393-claim-audit.json`; original canonical extracted model is claims-model.json. This ledger deliberately does not mark393 behavioral claims PASS: full official executions and manual gates were coordinated to primary review/fresh QA after final bundle, and the present candidate already fails necessary gates. Source families and existing relevant assertions were inspected; declarations/annotations alone are not counted as executed assertions.

## Actual execution and limits

| Scope | Exit / result | Durable evidence |
|---|---|---|
| Clean npmci |0|npm-ci.log|
| Typecheck |0|check.log|
| Full units before build |1;352PASS/1FAIL|unit.log|
| Production build |0|build.log|
| Standalone discovery after build |0|discovery.json|
| Selected actual served-dist9 scenarios ×2 engines |0;18PASS/0skip/0flaky|browser.json|
| Private missing-phase diagnostic final |0;2PASS inverse defect assertions|phase-diagnostic03.json,phase-chromium.json,phase-firefox.json|
| Private diagnostic attempts1/2 |1;diagnostic selector faults|phase-diagnostic.json,phase-diagnostic02.json|
| Claims tool usage query |64;usage, no gate claim|documented in commands.json|
| Claims check with external output dir |2;tool rejects external projection path|claims-check.log|
| Claims check using actual default |0;fresh|claims-check-default.log|
| Context/extract |0;393|current-context.json,claims-model.json|

All paths in the table are under the private evidence directory. Commands.json records actual scope/revision/exits. Initial combined root brief read used incorrect review filenames and returned cat errors; actual canonical reviewer briefs were subsequently read at their existing names, including root-only metric reviewer brief. No read error is acceptance evidence.

The selected product command was `rtk proxy npx playwright test tests/e2e/dashboard.spec.ts tests/e2e/blockIntervals.spec.ts tests/e2e/v3Contract.spec.ts --grep "applied tuple votes|real hash-pinned metadata|dropdown and promoted|independently complete|ordinary bounded endpoints|unqualified raw applied replacement|accepted same-level applied replacement|inspection exports" --workers=1 --reporter=json`, with the explicit Node22/TMPDIR/port environment above. It executed every selected title in both real engines against built dist.

SKIPPED: complete ordinary e2e; foundation38 official commands; V337 official commands; metric20 official commands;70×36 final matrix; native zoom/tooltips; independent full manualCHECK38; public-provider origin smoke. Reason: coordinated full primary reviewer/fresh QA/final-author evidence roles own those scopes after a complete source-bound bundle; author native port5188 was reserved; this specialist used5856 only. No unperformed visual/source-coverage scope is labelled PASS, and no missing evidence is waived. Known historical failures/watchpoints remain open for final verification.

Bounded decision: **NO-GO for dc89 source/spec acceptance**. Fix both blocking findings, freeze the actual replacement and renew affected source, clean-order and independent behavioral/visual evidence. This is not an overall publication verdict.
