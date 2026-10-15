# Interim W1 disposition — indexed signer conflicts

**W1 closed for the exact fix commit `2d4a06ff74865c46ca67f7c727faaf38ed650b91`.** Independent review verified the indexed algorithm preserves conflict and accounting behavior while removing the all-pairs payload scan. This is a focused warning disposition, not full-contract GO or certification of the evolving slice 2 worktree.

The helper now records each unique `(context, round, phase, delegate)` membership in a set of payload groups, then marks that delegate conflicting only when its membership spans multiple groups. Duplicate signer receipts do not add memberships. Preattestation and attestation membership stay separate; unknown slots use a set and return sorted unique values. Independent powers remain computed from each group's own unique signer set.

## Actual verification

All commands ran through RTK using Node 22 at `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin`. No app edits, commits, broad gate repeats or parent ledger updates occurred.

| Command | Exit | Result |
|---|---:|---|
| `rtk git show 2d4a06ff74865c46ca67f7c727faaf38ed650b91 -- src/consensus/phaseEvidence.ts tests/unit/phaseEvidence.test.ts scripts/check-observatory-foundations.mjs` | 0 | Exact fix diff reviewed. |
| `rtk npm test -- tests/unit/phaseEvidence.test.ts` | 0 | Four focused tests passed, including 10,000 distinct payload groups. |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-10` | 0 | Six behavioral assertions passed, including flood and phase separation. |
| `rtk proxy ... node --input-type=module -e ...` | 0 | Additional real-helper mixed context/round/phase/power/unknown-slot assertion and 1,000/5,000/10,000-group measurements passed. |
| `rtk git ls-tree <fix SHA> ...` and `rtk git hash-object ...` before/after execution | 0 | Tested files match exact commit blobs; no concurrent change detected. |

The extra experiment loaded the production helper using existing Vite `ssrLoadModule`, with middleware mode and `hmr:false,ws:false`. Rights were D1=3 at slot0 and D2=2 at slot1. P held D1, Q held D1+D2, R held D1 in the other phase, S held D1 under observer B, and T held D1 under round3. Results were independently asserted as P power3/conflictD1, Q power5/conflictD1, R attestation power3/no conflict, S power3/no conflict, T power3/no conflict. Repeated unknown slot99 and slot5 in P returned exactly `[5,99]` without counted power.

The same production helper measured 2 ms for 1,000 groups, 12 ms for 5,000 and 28 ms for 10,000, compared with the prior review's 28/525/3,154 ms. Every generated group retained one unique signer and one conflict. Measurements are machine-specific Node observations, not a browser latency guarantee; the reviewed algorithm itself removes the quadratic pair comparison.

Exact tested blobs:

- `src/consensus/phaseEvidence.ts`: `a2c08fa7b15adda6b184b88b70e95bb9c1b144fc`
- `tests/unit/phaseEvidence.test.ts`: `ec4c9db8a173ab7716c50f23688f3e5180c4085c`
- `scripts/check-observatory-foundations.mjs`: `f5a1df5173048d643e774e53418179cd550b48e3`

No new finding was established in this focused fix. The [original interim review](observatory-foundations-slice-1-architecture.md) remains the baseline evidence and full-closure limit; its W1 is superseded by this disposition. Root retains the intermediate decision.
