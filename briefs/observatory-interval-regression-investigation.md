# Investigation of two frozen 4cf browser regressions

Both failures expose missing test prerequisites. No production repair is warranted by this evidence. Preserve the original frozen regression result (202 PASS / 16 FAIL), integrate the known capture prerequisite and an accepted-gap prerequisite through the owners, then run fresh combined QA. These bounded diagnostics do not approve 4cf, the later UI, the full matrix or V3.

Independent investigation used detached `/var/tmp/observatory-interval-investigation-4cf`, revision `4cf199c58be940eed2a5de8fbd9ff3b7fce92714`, Node22 through `/tmp/context-review-node22-bin`, existing QA node_modules symlink. Production source, configuration and dependency manifests were unchanged. Root report is the only root write; no commits, publication or deployment occurred. RTK, project-authority, TypeScript patterns and technical-document-writing guidance applied. Existing Playwright/native browser mechanisms suffice; no infrastructure/library was built or selected.

## Counterexample: raw gap108 was not accepted before fork108

Original `/var/tmp/interval-qa-4cf-configured-dev.json` and `/var/tmp/interval-qa-4cf-dev-failures.json` retain Firefox failure. The original received DOM already records accepted transition `IndependentGap105 → IndependentNoCommitteeFork108`, despite raw108/r1 display. Raw delivery updates snapshot and emits immediately (`src/monitor/networkMonitor.ts:317–340`); observer progression only commits after complete, current-generation derivation (`:342–370`). `src/rpc/networkData.ts:390–398` inserts context before committee/constants work, but returns the complete derived result only after the work settles. Committee failure alone does not prevent context proof; cancellation before current-generation commit does.

A single targeted DEV run with logging reproduced the same Firefox failure and Chromium pass. Durable decoded Firefox artifact `/var/tmp/interval-investigation-firefox-failed-1165.json` SHA256 `df09cf0337cc726ea6d9290f0388adba8d30bcec186688359ed0f50ee135d80b` records:

- Gap108 observer header/protocol responses arrived at monotonic121746ms and JSON completed121756ms.
- Mainnet helper work began121757ms, tried503 responders, and archive requests at121781/121782ms were aborted before receipt when the fork advanced generation.
- No `recordProvenProgress(IndependentGap108)` occurs. Fork proof commits with `skipped-levels`, with105 as previous proven head.
- Chromium completes the corresponding Gap108 proof before fork; its logs contain Gap108 skipped-levels then fork same-level-round. Both use the same production code and test.

This establishes a missing accepted-proof synchronization prerequisite, rather than a listener defect or a missing committee prerequisite. Proposal/vote/raw display cannot establish accepted applied context. Minimum proposed correction: retain all original positive assertions but await actual accepted transition `IndependentGap105 → IndependentGap108` before sending fork. This is observable progression from complete current proof, and does not wait for the future fork being tested. Canonical copied reviewer probe remains untouched in QA/owner checkouts.

A separate diagnostic negative deliberately holds Gap108 header JSON until its signal aborts, sends fork, and expects accepted `IndependentGap105 → IndependentNoCommitteeFork108`, skipped delivered levels, no false stale fence, and normal retained interval completion after held E release. Both DEV engines passed. Source is `tests/e2e/unprovenGap.investigation.spec.ts` in the isolated investigation checkout. This preserves coverage of the original race rather than deleting it.

## S9: inspecting before opportunity capture freezes unavailable evidence

Original Chromium failure at `tests/e2e/dashboard.spec.ts:883–888` required a known historical deadline immediately after clicking Inspect, without establishing the candidate had a captured live deadline. The original JSON has no context/body log, so its exact microsecond ordering cannot be reconstructed. A normal instrumented bounded DEV execution passed both engines; that pass alone does not close the original.

A discriminating variation held the decoded same-level101/round3 baking-right JSON, waited until it was pending, clicked Inspect, then released it. Both engines reproduced the same historical `Baking rights unavailable` / `Timer unavailable` and failed the unchanged deadline assertion. Thus the observed original failure is explained by an exposed valid ordering; exact original microtiming remains inferred. `/var/tmp/interval-investigation-s9-held-dev.json` retains both failures and fetch/body/abort logs, SHA256 `f3c36f0e4dbc702605588d592040d67ed5a768ab949295bcfcd79715b7ff6851`.

`src/main.ts:45–53` selects and pins on Inspect; `:120–122` fences changed selection, `:215–216` renders pin, `:513` prohibits fresh opportunity acquisition in pin mode, and `:538` rejects aborted/stale completion. This is consistent with `kb/spec.md:22–23` (V3 FR027/028): preserve captured deadlines and keep uncaptured historical timing independently unavailable. The test assumed capture before pin without proving it.

Compared exact historical commit `2f29631` against4cf: the activation hunk already adds the correct candidate reference, deadline and successor migration-unavailable assertions before Inspect, preserving every post-pin assertion. It is absent from4cf; `git merge-base --is-ancestor 2f29631 4cf199c58be940eed2a5de8fbd9ff3b7fce92714` exited1. Durable exact extracted hunk diff `/var/tmp/interval-investigation-2f-vs-4cf-activation.diff` SHA256 `8ed0d795eb19249435ed64a9b994dd5c02ffa1d29b8d373ceb24a37205d177eb`. Root should carry the already reviewed2f correction, including its independent early-pin obligation, through the author integration. No new production behavior is proposed.

## Executed evidence and limits

All browser commands used `rtk proxy env PATH=/tmp/context-review-node22-bin:$PATH`, `npm run test:e2e`, configured Chromium/Firefox, at most2 workers, zero retries and unchanged timeouts. The first targeted run instrumented private monitor methods in DEV without changing their arguments/results; final prerequisite variants and the no-proof negative use fetch/DOM evidence and no private-module invocation. Final production command used `OBSERVATORY_TEST_PRODUCTION=1`, causing configured build plus preview; DEV results are not relabelled production.

| Durable JSON under /var/tmp | Port / mode | Exit / result |
|---|---|---|
| interval-investigation-dev.json |5441 DEV|1:3 PASS / Firefox counter FAIL; S9 both PASS|
| interval-investigation-s9-held-dev.json |5442 DEV|1:2 expected diagnostic deadline failures with early pin|
| interval-investigation-prerequisites-dev.json |5443 DEV|0:4 PASS, exact2f activation hunk + accepted-gap prerequisite|
| interval-investigation-prerequisites-production.json |5444 production build/preview|0:4 PASS, same prerequisite variants|
| interval-investigation-unproven-gap-dev.json |5445 DEV|0:2 PASS, explicit unproven-gap negative|

Source/artifact SHA256 inventory is `/var/tmp/interval-investigation-manifest.json`. Final isolated diagnostics remain reviewable in the checkout; the dashboard file contains only the exact2f activation replacement plus diagnostic import. Earlier instrumentation and held-body variation are disclosed above and their executed logs are embedded as Playwright attachments. No typecheck/unit/full regression was rerun for these isolated diagnostics; they are not implementation candidates. Initial exploratory read commands for nonexistent `src/monitor.ts`, `src/rpc/data.ts` and an assumed report filename exited nonzero; actual located source was then read. No browser infrastructure failure was hidden.

Production `src/main.ts` SHA256 is `e5776adf41fce20bb50b98246d6135382266825d1293a6d00c3b333271b06f18`, matching frozen QA. Scope is only these two failures. Fourteen metric-font failures remain in original evidence and their separate author fix is unverified here. Historical AC34 unknown-context cause, goto/lost-frame watchpoints, full production regression, complete viewport/theme/engine/composed-contrast matrix, manual interfaces, all393 mandatory claims and final review/QA remain open. Fresh source-bound combined verification must follow integration; these passing targeted prerequisite checks do not make the original failed gate green.

## Root disposition

Root read this entire report, the exact2f activation diff and the separate unproven-gap negative. Root independently verified all17 hashes in the investigation manifest and inspected the three passing final JSON statistics (4 DEV,4 production,2 negative DEV; zero skipped/flaky/unexpected). Adopt the diagnosed prerequisites for integration, preserving the original failed regression. The exact2f fixture correction is already present in Astra's branch; the independent reviewer owns the counterexample probe correction and its additional no-proof coverage. No production repair is justified by these observations. Fresh combined review and QA remain mandatory; the S9 original ordering inference stays explicitly qualified above.
