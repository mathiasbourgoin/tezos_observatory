## Edge Cases

- EC-1 [US-1, C-1]: Same payload P in H1/H2, one payload-only vote → Separate candidates share explicitly payload-level evidence; no invented candidate signature/producer or duplicated combined power.
- EC-2 [US-1, C-3]: Duplicate aggregate signer and later individual replay → Valid operations count unique delegate power; any malformed relevant aggregate member invalidates the operation, not valid raw evidence elsewhere.
- EC-3 [US-2, C-6]: Full empty snapshot one millisecond before establishment → Cannot certify zero; coherent complete relevant post-establishment snapshot may certify only source-snapshot zero.
- EC-4 [US-2, C-7]: Connected source without new head and another observer advances → Keep observer transport and observed chain progress independent; no global stall claim from source failure.
- EC-5 [US-3, C-9]: H1 to H2 same-height reorg with one-second-old H1 eligibility → Live authority immediately stale, immutable old-context history retained; cannot populate H2.
- EC-6 [US-3, C-9]: A120, B122 with level123 evidence → B coherent current+1 context/rights admits; A head or clock cannot alone reject.
- EC-7 [US-4, C-12]: Initially hidden, manual pause, then visible/BFCache restore → No requests initially; manual pause remains until explicit resume; permitted resume starts fresh generation.
- EC-8 [US-4, C-13]: Aborted response arrives after resume even same head → No obsolete-generation commit including aliases/comparison.
- EC-9 [US-5, C-16]: Categories overflow at equal receipt times including pin → Independent bounds, oldest first receipt plus identity lexical tie; one static frozen pin/network.
- EC-10 [US-5, C-17]: Follow-live while newest observations unresolved or old-context late → Select only coherent live-eligible context or explicit unavailable live state; never latest stale historic receipt.
- EC-11 [US-6, C-18]: Arriving alias makes row newly match → Append new match without reordering existing rows; query/focus/scroll stay stable, explicit user resort allowed.
- EC-12 [US-6, C-19]: Missing rights but observed signer and empty other phase → Unknown-rights signer evidence separately searchable/inspectable; phase unavailable/partial, no complete missing set.
- EC-13 [US-7, C-20]: Wrong-network B committee syntactically valid → No counted power; unknown/unavailable independently attributed result.
- EC-14 [US-7, C-22]: Comparison exactly60 seconds old or wall clock jumps → Age>=60 stale using monotonic elapsed clock; no auto refresh, honest receipt timestamp retained.
- EC-15 [US-8, C-23]: First observation already at threshold → Observed quorum state allowed, crossing requires actual prior below state; no invented crossing.
- EC-16 [US-8, C-26]: Later same-level round without next-level block → Distinct observed same-level progression; future blockhash unknown, no fabricated next-level advance.
- EC-17 [US-8, C-25/C-26]: Missing rights/timing or prediction expired → Proposer/timer unavailable when unproven; expired prediction awaits observation; bothbranches conditional, nextleveltime earliest boundary not actual promise.
