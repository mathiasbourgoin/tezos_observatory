# Foundations slice 9 — conditional opportunity facts

Status: INTERIM implementation verified; frozen for independent slice review. This is an INTERIM slice checkpoint, not completion of the parent implementation, whole review, QA or permission to deploy. S10 parity, numerical audit, bounded live-origin evidence and fresh whole gates remain required.

## Behavior and authority

The two opportunities belong to the selected observed identity: N/R+1, conditional on continued same-level production, and N+1/R0, an earliest protocol boundary conditional on hypothetical production. A separate, explicitly estimated clock context never replaces those branches or expires coherent received votes. Applied level, round, timestamp and observed hash remain actual observations; future hashes remain unknown. Expected proposers require each branch’s own validated RPC baking rights. Missing or contradictory rights and missing timing are independent unavailable facts.

`opportunityFacts.ts` validates exact target, round, original source/context, concrete observer and anchor facts, producing/executing protocol facts and requested-anchor receipts. A genuinely RPC-proven ahead or competing current candidate can provide a separate branch observer only when its exact original header, configured observer, chain, parent and protocol are bound to the retained admission. An operation or proposal identity alone cannot manufacture that observer. Helper fallback receipts retain their actual responding configured source after existing compatibility proof. Typed capture freezes nested numerical facts, headers, fitness and original receipt/source graphs.

The store captures two compact opportunity facts per retained record without refreshing first receipt, history order, identity, phase facts, committee, maximum or newer count. Active eviction permits enrichment while the historical instance remains retained; full historical eviction freezes the pinned copy. Historical rendering uses its fixed deadline, remaining duration, capture time and original context, never current cache replacement. Selection actions and lifecycle/head updates synchronously fence old baking/timing bodies before rendering; obsolete bodies cannot publish or capture.

Default selection follows the actual coherent store identity and its receipt/lexical tie rules. Explicit selection can inspect a successor R0 even when the independent clock estimates R6 or R37. Genuine parent/context replacement withdraws live authority; elapsed time alone does not.

## Protocol basis and applicability

Official source is pinned to Octez mirror commit `5c73fc9ae945fa222307de01c22403526ce197ee`.

- [round_repr.ml lines 373–415](https://github.com/tezos/tezos-mirror/blob/5c73fc9ae945fa222307de01c22403526ce197ee/src/proto_025_PsUshuai/lib_protocol/round_repr.ml#L373): S(r)=r*m+d*r*(r−1)/2; T_level(r)=T_pred+[m+r_pred*d]+S(r). Same-level R+1 uses D(R); successor timing uses successor execution durations including its predecessor-round term. Safe arithmetic and calendar bounds make unsupported values unavailable.
- [block_header_repr.ml lines 349–360](https://github.com/tezos/tezos-mirror/blob/5c73fc9ae945fa222307de01c22403526ce197ee/src/proto_025_PsUshuai/lib_protocol/block_header_repr.ml#L349) and [raw_context.ml lines 912–913](https://github.com/tezos/tezos-mirror/blob/5c73fc9ae945fa222307de01c22403526ce197ee/src/proto_025_PsUshuai/lib_protocol/raw_context.ml#L912): protocol timestamp and durations belong to the executing context.
- [main.ml lines 300–315](https://github.com/tezos/tezos-mirror/blob/5c73fc9ae945fa222307de01c22403526ce197ee/src/proto_025_PsUshuai/lib_protocol/main.ml#L300), [fitness_repr.ml lines 242–254](https://github.com/tezos/tezos-mirror/blob/5c73fc9ae945fa222307de01c22403526ce197ee/src/proto_025_PsUshuai/lib_protocol/fitness_repr.ml#L242) and [validate.ml lines 3642–3660](https://github.com/tezos/tezos-mirror/blob/5c73fc9ae945fa222307de01c22403526ce197ee/src/proto_025_PsUshuai/lib_protocol/validate.ml#L3642): no universal predecessor-round reset can be inferred from unequal protocol hashes. Construction reads actual predecessor fitness; incoming validation uses the incoming target fitness predecessor round. Migration comments/init do not prove a reset of the RPC predecessor’s own round.

A proven observed selected timestamp permits same-level timing with that target’s exact execution constants. A same-protocol proven parent can support a clearly hypothetical selected-round calculation without inventing a selected block/header. Unsupported migration basis leaves the affected timer unavailable independently of a known RPC proposer. No protocol-name registry, synthetic next protocol, extra identity endpoint, polling or comparison read was added.

## Meaningful RED → GREEN evidence

- Child’s initial actual store/RPC suite: 88 PASS / 7 assertion RED, no runtime or fixture error (`/tmp/observatory-s9-store-rpc-red.json`). Constants and capture behavior subsequently passed 95/95.
- Domain counterexamples: ten same-key concrete anchor/protocol or observed-reference contradictions were accepted before guards, then rejected. Hypothetical parent timing, independently RPC-proven ahead/current candidates, cancelled cached timing and deep optional reference receipts each had actual assertion RED before correction. Missing import, fixture context and TypeScript failures were recorded as execution errors, never behavior RED.
- Production AC33 initially failed both engines because no conditional timer was rendered. AC15 initially failed both engines because coherent prediction expiry still showed Progress unknown. Both subsequently passed their complete consumer assertions.
- The same-height competing-candidate case was a real product rejection, not a fixture: retained admission observer BBlock100/level100, exact candidate OpportunitySameHeight100, target100 and contextInvalid=false were read from the actual monitor/store. It now passes with independently known timing even when rights are missing.
- Votes-only current capture incorrectly compared a raw receipt’s unknown chain field with a later proven RPC chain. The actual production RED was corrected by comparing supplied observation facts without fabricating the missing raw chain, retaining independent proven chain authority.
- Independent numerical audit reproduced asymmetric historical thresholds in both engines: pre600/threshold20000 and att600/threshold600. Each rendered phase now uses its own captured threshold: pre deficit19400, att quorum600. No historical phase or peak was repriced.

The first full immutable 130-browser run was **124 PASS / 6 FAIL**. The six failures were three legacy scenarios in both engines that asserted clock expiry alone erased coherent R9/R0 votes or current power. Under root’s explicit existing-contract disposition those assertions were replaced by stronger observed-round/power retention plus actual parent-replacement withdrawal. Other legacy clock-driven proposer expectations R7/R38 were corrected to observed-selection R1, retaining the separate clock estimate and actual applied values. Receipt/lexical default selection is asserted before explicitly selecting successor R0; successor selection is not forced as a default.

## Verification and remaining boundary

Final immutable Node **v22.23.3** gates passed: `npm run check`; `npm test` **248 tests / 19 files**; `npm run test:e2e` **130 scenarios / Chromium + Firefox, 1.4m**; `npm run build`. All **38 original CHECK commands**, with their exact original argument spelling, exited **0**. Native-spelled AC16/17/19/23 additionally require and completed both browser engines internally. AC15=2, AC33=2 and AC34=11 assertion groups; the full command/count/source-hash inventory is [slice-9-checks.json](../roster/observatory-foundations/slice-9-checks.json). Browser/runtime/missing/skip classifications remain guarded by the existing classifier regressions. Scope and whitespace checks passed.

The three updated clock-authority tests passed **6/6** with actual context-replacement negatives. A temporary broad aria-pressed selector also matched Follow and was corrected to the candidate-controls scope; this was a test execution/locator error, not a product RED. Temporary diagnostic logging was removed before the final gates. Existing S1/S4 screenshots were restored after test generation; only the following new S9 captures are delivered:

- `roster/observatory-foundations/slice-9-chromium.png` SHA256 `d7a1abb66473b8198c75aa74893509dd088aac68ce9e101786b79dfec189b851`
- `roster/observatory-foundations/slice-9-firefox.png` SHA256 `d9c08c337d6dc8bc8c3d5d9442d4d5e43f286345eef15c5ab534f6789a83bec9`

Implementation phase remains in progress for S10. No parent completion ledger, review/QA GO or deployment action is emitted here. Chromium/Firefox fixtures exercise the real production page with controlled RPC bodies; they do not establish public-provider completeness, global stall, finality or a promised future block timestamp. Optional coverage tooling is unavailable and no coverage percentage is claimed.

Existing canonical library index and native project primitive checks were reused. No new dependency, generic parser, protocol stack or test harness was introduced. Header/logo/CSS and later Astra geometry/motion remain outside this slice.
