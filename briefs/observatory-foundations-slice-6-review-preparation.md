# Slice 6 retention review preparation

Contract-only independent preparation. No mutable implementation was inspected, no tests were run and no acceptance verdict is issued. The validated plan is `briefs/observatory-foundations-plan.md`; `roster/observatory-foundations/plan.md` is absent.

Derived scenarios for the actual application reader:

| Contract | Required scenario |
| --- | --- |
| Foundations spec lines 242–246 | Overflow 150 historical instances, 100 active accepted candidates and 100 unresolved targets independently per network. Unresolved floods cannot evict accepted evidence. Promotion removes quarantine duplication without changing first receipt. |
| Lines 242–246, 332–333 | Same coordinates/payload with distinct hashes and observers remain distinct. Equal first receipts use lexical ties. Replay and enormous claimed levels do not gain retention priority. |
| Lines 301, 331 | Active candidate eviction leaves a retained historical instance selectable with its original evidence. This does not freeze the pin. |
| Lines 247, 301, 303, 333 | Overflow 100 candidate facts within an instance while protecting the pinned candidate. Retention is visibly partial; raw facts and supporting metadata remain bounded. No invented completeness or zero. |
| Lines 248–250, 331 | Same-identity accepted evidence may enrich a retained pin. Only eviction of its historical instance produces the one frozen copy per network. Later evidence cannot alter that copy; a new pin replaces it. No time-based pin expiration is prescribed. |
| Lines 251–253, 334, 360 | New distinct instances/candidates count once; replay and same-identity enrichment do not. Return to live selects the newest coherent eligible instance by original receipt, or explicitly reports unavailable. Unresolved evidence and late old context cannot win. |
| Lines 248, 253, 330 | Inspection preserves selection, controls, focus and scroll during collection. Paused local inspection performs no external reads; pin/follow do not resume collection. |
| Line 254 | Reload/reset honestly indicates loss of browser-session history; it is not an archive. |

AC16 requires reading retained source/context/original wall receipts through the actual application store after provider changes and wall-clock jumps; monotonic age may change, original provenance and eviction order may not (lines 201–202, 325).

AC17 requires an H1→same-height H2 change followed by a delayed H1 response: H1 cannot authorize H2, live H1 authority is withdrawn, and the historical reader still exposes the original H1 provenance with unknown fields explicit (lines 216, 326).

These scenarios require the production reader in Chromium and Firefox. Later committee, comparison, opportunities and whole-epic evidence remain necessary. The foundations contract alone does not define a separate named Latest action; the accepted V3 contract additionally distinguishes one-shot Latest from continuous Follow (`specs/observatory-v3.md:206–209`, FR-030–033; AC-04 at line 273). Latest centers and pins once; Follow enables ongoing eligible selection. Both report unavailable when no coherent LIVE item exists, without substituting history or changing collection. Preserve that distinction in the UI handoff rather than treating this preparation as a product change.

Newer-count review must include replay after an identity loses all bounded owners. The contract excludes replay from first accepted arrivals; uncertainty cannot turn that replay into a definitely new item. Preserve the pin baseline and proven counts while any owner retains identity, including history after active-index eviction. Once exact deduplication is no longer provable, qualify the count explicitly as partial or uncertain rather than claiming an exact cumulative session total. This is an evidence limitation to test and review, not a waiver of FR-054/AC-25 or permission to silently redefine the count.
