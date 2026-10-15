# Independent phase coverage QA

**GO for the bounded pending-snapshot phase correction at `49c74935ae82f5ff0f48dc50b9ace6c76caf4dd0`. NO-GO for entire V3 delivery:** the full configured browser suite has an unresolved Firefox AC-13 failure. This report does not authorize publication/deployment.

Fresh QA used detached `/var/tmp/phase-coverage-qa`, independent of implementer/reviewer checkouts. Read RTK, full QA skill, project authority, TypeScript rules, correction brief, full final review, foundations FR-015–021/093 and V3 AC-10. Node v22.23.3 via `/tmp/context-review-node22-bin`. No dependencies or application/source changes; `git diff --exit-code -- src tests/e2e/dashboard.spec.ts` passes. Browser tests regenerated tracked foundation screenshots only inside the isolated checkout. Reviewer probes informed known cases; the two QA tests and eight QA browser scenarios are independently authored.

## Executed evidence

| Check | Result | Log |
|---|---|---|
| Clean `npm ci` | exit0,48 packages,0 vulnerabilities | `/var/tmp/phase-qa-ci.log` |
| `npm run check` | exit0 | `/var/tmp/phase-qa-check.log` |
| Original `npm test` | exit0,288 tests/20 files | `/var/tmp/phase-qa-unit.log` |
| `npm run build` | exit0 | `/var/tmp/phase-qa-build.log` |
| Full `OBSERVATORY_TEST_PORT=5194 npm run test:e2e` | exit1,185 passed/1 failed | `/var/tmp/phase-qa-e2e.log` |
| QA immutable receipt probes | exit0,2 passed | `/var/tmp/phase-qa-own-unit-corrected.log` |
| Full units including QA | exit0,290 passed/21 files | `/var/tmp/phase-qa-unit-with-own.log` |
| Strict check including QA | exit0 | `/var/tmp/phase-qa-own-check.log` |
| QA actual production browser probes | exit0,8 passed,Chromium+Firefox | `/var/tmp/phase-qa-production-contract.log` |
| Original production AC-10,manual retry,late body,retention | exit0,10 passed,Chromium+Firefox | `/var/tmp/phase-qa-prod-original.log` |

All commands were invoked through `rtk proxy` with Node22 PATH. There is no separate lint command. Browser execution against production uses actual built dist served by Vite preview on isolated5195 with `playwright.qa.config.ts`, not dev-module imports. Full configured suite uses the intended development server5194 because older tests dynamically import `/monitor/*.ts`; this full result is not described as an all-production gate. First production original selection on5188 also passed6 original cases, alongside subsequently corrected QA assertions; production5188 was later occupied by independent work, so an attempted rerun exited1 before any tests and was rerun on5195. No empty run is counted as PASS.

## Phase behavior established

Actual NetworkMonitor/page consumers in both engines show reciprocal independently justified `0 / 30,000` versus `Unavailable`, with committee rows showing selected-source absence only for the complete phase. The original positive partial case retains3/5 pre power, opposite-phase0/5 and qualified missing-delegate evidence. Early explicit retry is rejected, elapsed16–20 seconds does not trigger a pending reread, and a fresh click causes exactly one new read.

Own adversarial production cases independently combine each malformed phase with source-stream interruption or a fresh pending response containing unknown consensus content. Interruption preserves captured historical zero and its exact source receipt; Follow live withdraws both phase numbers and complete absence authority. A newly shared-invalid pending response withdraws both phases, including when the same identity is selected. The retained pin remains selected; a fresh explicit retry may enrich that retained session with the newer attributed snapshot. The independent unit probes retain an earlier actual history object, refresh the same identity with a newer shared-invalid snapshot, then interrupt/replay: the old object's entire serialized facts and receipt11 remain unchanged, the new coverage receipt is12, and replay cannot clear stale authority. Both reciprocal unit cases pass.

Original full unit/browser gates additionally exercise unknown/missing/structurally invalid/capped/context-mismatched pending bodies, unrelated valid nonconsensus entries, raw supporting-fact eviction, asymmetric quorum retention, receipt ordering, pause/resume late bodies and generation fences. Production targeted retention and late-body criteria pass in both engines. Negative outcomes are asserted as unavailable/incomplete rather than omitted.

## Failures and classification

- **Wider V3 defect, unresolved:** Firefox AC-13 adjacent burst at dashboard.spec.ts1119 expects final102/r0 but receives selected observation/live unavailable. Full suite:185 passes/1 failure. Error evidence remains `/var/tmp/phase-coverage-qa/test-results/dashboard-V3-AC-13-adjacen-1a4aa-d-motion-or-reader-movement-firefox/error-context.md`. This independently reproduces the review's wider RIGHT-state problem; no full V3 acceptance is claimed.
- **QA assertion corrections, not product defects:** initial probes read the notice immediately after clicking pin, before its asynchronous historical state rendered (8 failures); the next iteration overasserted retained-pin whole-gauge immutability across a deliberately fresh retry and whole-notice immutability despite legitimate current-status change (5 failures). The accepted FR-037/FR-052 retained-pin enrichment contract permits newer attributed same-identity facts; completely static frozen history applies after history eviction. Corrected tests await historical state, assert exact old receipt on interruption, and test actual old snapshot object immutability separately. Logs preserved at `/var/tmp/phase-qa-production.log` and `/var/tmp/phase-qa-production-own-final.log`. Unit fixture initially omitted candidate payload from the mocked hash-pinned header, causing2+2 context-verification failures; adding that actual required header field yields2 passes without production changes.
- **Exploratory stream-only hypothesis:** injecting an unknown-kind operation into an otherwise connected operation stream, without obtaining a new pending snapshot, does not by itself withdraw a prior receipt-qualified pending zero (4 expected-withdrawal assertions failed;4 interruption cases passed). Log `/var/tmp/phase-qa-production-stream-final.log`. This is distinct from the accepted fresh pending-body shared invalidity case, which passes. The stream is not a complete-category snapshot; this observation does not establish malformed pending admission or retroactive corruption. It is explicitly surfaced for coordinator scope judgment rather than hidden as a successful case.

QA-owned sources: `/var/tmp/phase-coverage-qa/tests/e2e/qaPhaseCoverage.spec.ts`, `/var/tmp/phase-coverage-qa/tests/unit/qaPhaseCoverage.test.ts`, `/var/tmp/phase-coverage-qa/playwright.qa.config.ts`. Final production attachments/error artifacts: `/var/tmp/phase-qa-contract-results`, `/var/tmp/phase-qa-prod-original-results`. Earlier exploratory artifacts remain `/var/tmp/phase-qa-own-results` and `/var/tmp/phase-qa-stream-results`.

The bounded independent pending-phase correction is verified. Wider V3/native/all38 acceptance, public provider coverage and publication remain unestablished.
