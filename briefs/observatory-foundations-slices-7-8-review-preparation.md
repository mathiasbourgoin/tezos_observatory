# Committee and comparison review preparation

Independent read-only contract preparation; no WIP, code or test was inspected, modified or executed. No acceptance verdict. Scope follows `briefs/observatory-foundations-plan.md:33–35` and the accepted specifications/intakes.

| Area | Actual-reader adversary and evidence | Contract reference |
| --- | --- | --- |
| Search | Trimmed case-insensitive alias/address substring; empty query shows all validated committee delegates. Preserve exact phase power and context. | Foundations 258–260, 315 |
| Ordering | Explicit address/alias/power sort with address ties. Votes and aliases do not reorder existing matches; new matches append. Preserve focus, disclosure, query and scroll. | Foundations 261–262, 335 |
| Corrected alias | Nonmatching unfocused row disappears; focused row remains visibly pending exclusion until focus leaves. New matches append. | V3 intake 100, 117 |
| Unknown rights | Raw signer evidence remains separately inspectable, without an invented committee row, opposite-phase zero, complete missing set or global inactivity. | Foundations 259–263, 336; V3 intake 117 |
| Explicit comparison | No comparison reads before action; select a different configured source, or unavailable if none exists. Freeze selected context; distinguish fetched current B head from selected history. Never pool power. | Foundations 267–272, 316 |
| Request budget | Actual ledger proves identity→head→pending default order, at most three reads including rights, eight seconds per read including redirects/body, at most 24 seconds total. Second click adds no reads; no retry, cascade or polling. | Foundations 273–275, 338, 347 |
| Alternative read | A different third read requires pending already proved unavailable in this workflow. Initially unknown pending cannot justify rights-first; failed third pending cannot justify fourth rights. | Foundations 304, 347 |
| Cached rights | Independently vary chain/head/protocol/target compatibility. Only exact compatible cache authorizes power and keeps original provenance; otherwise raw unknown-power/partial remains without additional reads. | Foundations 272, 281, 347 |
| Agreement | Equal heads with unknown votes means head agreement only. Different observed hashes sharing payload still diverge; missing facts remain partial/unavailable. Never imply finality. | Foundations 268–271, 337 |
| Cancellation and age | Delay responses across pause/hidden/pagehide/context changes and A→B→A; cancelled bodies never commit after resume. Check 59,999/60,000ms monotonic boundary, wall-clock jumps and sticky invalidation. Preserve original receipt; no automatic refresh. | Foundations 276–278, 330, 339; V3 intake 118–119 |
| Fallback attribution | Primary fallback success retains actual B attribution. Failed comparison/reconciliation does not cascade to another provider. | Foundations 279, 344 |

S7 owns complete AC6/26/27 evidence; S8 owns AC7/28/29/38. Shared AC21/30/35/36/37 also include aliases/rights/lifecycle, eligibility, primary fallback/reconciliation, source qualifications and reset/history respectively; subset evidence cannot close the full criterion (foundations 330, 339, 344–347).

Require actual production `/` in Chromium and Firefox. Earlier bounds, pin, provenance and lifecycle remain binding. S9 owns opportunities; V3 owns composition/motion/rendered matrix. All 38 criteria and whole-epic independent review/QA remain required.

## S8 authority and resource boundaries

FR-090/094 and C-20 permit comparison-local use of compatible cached rights originally obtained through A. The reviewer must challenge the proof against B's actual identity/header and the original rights/constants chain, head or proven parent, execution protocol and target context. Missing successor-protocol or activation proof remains unknown; a shell protocol counter is not a hash. Do not fabricate a complete B context or rewrite an operation's source to pass the LIVE accountant's source checks. Shared arithmetic is appropriate; comparison authorization must not leak into live gauges, accepted history, reconciliation or events. Preserve B raw/body receipts and A's original helper provenance separately.

FR-037/C-11/093 bound all retained raw operations at 10,000 per network, including comparison. Test live and comparison owners together, not two independently passing 10,000-entry pools. Exercise a result arriving with partial or zero remaining capacity and later live growth consuming that capacity. Retention loss must be visibly partial or unavailable, never manufactured zero/completeness, and cannot start an extra read or retry. Compact captured numerical facts retain their original basis, receipt and explicit as-of scope; head comparison remains independently reportable when raw inspection is unavailable. Check that result, pin and request ledger do not hide another raw-body copy.

The three-read ledger must include real browser network behavior around redirects and delayed bodies, with the original read's eight-second deadline and overall 24-second bound intact. Unsupported redirect handling can report unavailable transparently; this preparation adds no hop-count allowance or new fallback policy. A wrapped-fetch call count alone cannot prove that hidden additional RPC work stayed inside the accepted budget.

These are review scenarios and previously authorized interpretations of the existing contract, not new acceptance claims or a replacement for the exact original criteria. S7 was independently reviewed and integrated before any S8 integration.
