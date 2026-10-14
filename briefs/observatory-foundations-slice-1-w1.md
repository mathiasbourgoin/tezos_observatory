# Interim W1 correction — conflict indexing

**Status:** INTERIM correction; parent implementation remains in progress. Root required fixing W1 from the independent [slice review](observatory-foundations-slice-1-architecture.md).

The production `groupsFor` consumer now indexes unique `(context, round, phase, delegate)` payload membership while grouping operations. It marks conflicts by visiting each membership once. It no longer compares every pair of groups. Unknown-rights slots also use a set rather than repeated array scans. Independent payload power, phase separation, context separation and replay semantics are unchanged.

A real 10000-group unit and AC-10 assertion exercises the permitted operation flood, requires all groups, and checks every group retains exactly one D1 signer, no opposite-phase signer and one D1 conflict. Separate-phase P/Q observations must not report a conflict. These semantic assertions passed before and after the performance-only refactor; no false behavioral-red claim is made for an unchanged correctness contract.

Measured helper times under the same supplied Node 22/Vite module consumer, one run per size:

| Groups | Before (ms) | After (ms) |
|---|---:|---:|
| 1000 | 25.425 | 2.084 |
| 5000 | 525.337 | 12.275 |
| 10000 | 3196.127 | 18.742 |

These are observed local timings, not pass thresholds or browser latency claims. Deterministic assertions depend on actual semantic output, not the machine's elapsed time.

TypeScript check, all 51 unit tests and production build passed. AC-1/9/10/11/12 were rerun on real consumers; AC-10 now includes the flood and phase-isolation assertions. Browser behavior is unchanged and existing 32-case two-engine evidence remains applicable; no unrelated browser rerun was added for this algorithm-preserving correction. The full ten slices and 38 semantic checks remain mandatory.
