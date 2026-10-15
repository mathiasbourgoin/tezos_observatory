# Producer domain checkpoint — implementation in progress

This checkpoint supports a focused independent producer review. It is not a whole-V3 review or QA verdict. The 37-criterion matrix and final visual evidence remain unfinished.

The root decision is `briefs/observatory-v3-producer-extension-decision.md` in the integration checkout. Its accepted window policy is implemented in `src/rpc/candidateProducer.ts`: configured source and proven chain, monotone observed-head watermark, current/successor eligibility, bounded 100 attempts and 100 cached facts, one flight and one latest queue. Old levels cannot reopen after rollback. Metadata requests are hash-pinned, body-inclusive 8 seconds, lifecycle-cancelled, and reject redirects. Admission hooks initiate work; rendering and navigation do not.

Only exact Ushuaia metadata is supported. `baker` is the block producer; `proposer` is separately required for schema validation and never substituted. Primary schema source: https://raw.githubusercontent.com/tezos/tezos-mirror/5c73fc9ae945fa222307de01c22403526ce197ee/src/proto_025_PsUshuai/lib_protocol/TEZOS_PROTOCOL . Unsupported schemas remain unknown.

Producer captures are immutable facts on retained observations with their own metadata receipt. Capture checks generation, context, source, chain, protocol, and requested hash. Exact-context readmission preserves them; changed contexts do not inherit them. Retained pins may enrich, frozen copies cannot. Candidate first receipts and navigation ordering are unchanged.

Foundation fix 12555656459965996797d0a81fb9245603e4e6c8 was applied as its exact code/test diff before adding producer capture. Its independent review/QA remains owned by root; V3 whole-source QA must rerun it.

Author checks: 279 unit tests passed; S9 same-height pin/readmission and V3 AC09 real metadata passed 12/12 (three repetitions, Chromium and Firefox). Unit scenarios include 130 sequential level advances, same-window saturation and resumed budget, successor-to-current deduplication, old replay/rollback, source/chain mismatch, active/history eviction, frozen capture, pause/reorg, 8-second timeout wiring, late bodies, and redirects. These checks do not replace independent review.
