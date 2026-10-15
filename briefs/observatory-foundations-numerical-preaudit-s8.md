# Targeted numerical pre-audit — integrated S8

Source: f803300 (integrated exact S8 cc00a78), detached /tmp/observatory-numeric-review-f803300. Root/owner application code unchanged; no S9 WIP inspected. This is a targeted pre-audit, not whole review/QA, acceptance or public/live numerical certification.

| Finding | Evidence | Status |
| --- | --- | --- |
| High: pinned phases borrow the final phase quorum | main.ts:132 writes one model.quorum in pre→att loop; dashboardView.ts:315 uses it for both gauges. Retained pre600/30000 threshold20000 plus newer att600 threshold600 produces false pre `Quorum reached · 600 power required`, where original pre deficit is19400. | OPEN, sent root and owner; no fix reviewed. |

Actual production-page repro: tests/e2e/dashboard.spec.ts:883, `REVIEW pinned phases keep their own quorum after asymmetric retained evidence`. Normal fixture seed pre600, inspect, open Sources disclosure, Pin. A test-only wrapper captures the real monitor through its real Pin action. Use its actual store to evict pre raw with10000 unrelated raw entries; accept same proven context with corrected quorum600 and current generations; add att600; emit actual monitor. Store independently verifies pre.threshold20000/att.threshold600. Unmodified main/view then show the wrong pre quorum. This is an admitted numerical-correction API / retained historical consumer case, not a claim the real chain changes a context-pinned constant normally. Fix direction: retain per-phase threshold/basis through the reader; do not reprice historical facts/maxima.

Checks actually executed under Node22.23.3, RTK, no port5173:

- Clean npm ci exit0,48packages,0vulnerabilities; blocked esbuild install-script warning recorded.
- npm test -- --run tests/unit/observationStore.test.ts -t REVIEW: first1PASS, then2PASS (54 existing tests intentionally filtered, not counted as passes). Confirms asymmetric thresholds and independent current/max committee bases.
- npm run test:e2e -- --grep 'REVIEW pinned phases': first2timeouts due unopened disclosure (execution/fixture failure, not behavioral red); after opening existing disclosure,2 completed matcher failures in Chromium+Firefox on expected19400deficit versus actual reached600. Actual att600 positive and store-threshold assertions passed first. Port5205.
- npm test -- --run tests/unit/phaseEvidence.test.ts tests/unit/guards.test.ts tests/unit/operationStore.test.ts tests/unit/observationStore.test.ts: exit0,77 tests/4files PASS, including3 temporary reviewer additions.

Additional integer oracle exercises sums/dedup per phase at powers1/2/3/600/10000 and MAX_SAFE_INTEGER−1 plus1, compares signerPower with BigInt expected sum; rejects NaN/Infinity/negative/fractional/unsafe power, unsafe cumulative sum and quorum>total. Existing malformed aggregate, duplicate individual/aggregate, source/context and raw-bound assertions are included in the focused files. Production NetworkData validates RPC integer constants and exact committee total; it uses the explicit protocol threshold (not an invented universal two-thirds rule). Deficit and shares use validated authority; display rounding does not define quorum.

No additional maxbasis/currentbasis defect proved: actual-store correction3/2,total5,q4→1/9,total10,q7 retains old pre3/q4/committee5 beside new att9/q7/committee10; a new pre then becomes current1/q7/currentCommittee10 while maximum3/total5/maximumCommittee5 remains. capturedRecent already supplies separate preTotal/attTotal. The adjacent shared model.committeePower for missing lists is a read-path watchpoint only: differing retained phase bases in the reproduced case have incomplete coverage, so missing lists are unavailable; complete snapshot admission refreshes both phase bases. No separate missing-share finding established.

Repro patch: /tmp/observatory-numeric-review-f803300.patch. Owner/context_research received exact file/title/commands and copied/adapted only in their independently owned test scope. No root write or implementation fix by this reviewer. Remaining limits: targeted deterministic synthetic data/correction, no live provider inference, no whole programme GO. Fresh whole S10 review/QA still required. Ready for frozen S9/correction review.
