# INTERIM independent numerical round review

Reviewed exact commit `f0e695d9c6a24bb04630d16aa4784652f04aeeea` against `9e783f66b9f07201f187081f456aa694aae82c76` in independent detached worktree `/tmp/observatory-round-review-f0e695d`. The implementation owner's mutable worktree was not read or tested. This is an interim numeric correction review, not foundations completion, context-cache certification, or a parent GO/QA ledger.

## Findings and recommendation

**Critical:** none found in the reviewed numerical correction. **Warning:** none found requiring correction within this bounded checkpoint. **Optional:** `src/main.ts:187,254` still call `proposalRound` without the shell-level argument, unlike the new primary consumer calls. Current real monitor admission already enforces this binding, and selectable entries independently check it, so this is not a reproduced admission defect. Supplying the level consistently would reduce reliance on upstream admission when future typed consumers are added.

Recommendation: approve this interim numeric correction; architecture risk low within this scope. Full parent delivery remains pending.

## Contract and source evidence

Read the accepted foundations FR-010, AC-12 and Entities, project authority and TypeScript patterns, reviewer and architect principles, implementation checkpoint and context-authority research. Reviewed the full diff, including fixture and semantic-runner changes. No infrastructure or library was introduced or selected.

The actual Ushuaia implementation corroborates five-field fitness, 4-byte integer fields, optional empty lock, nonnegative signed rounds and strict lock < round: [official fitness source](https://raw.githubusercontent.com/tezos/tezos-mirror/master/src/proto_025_PsUshuai/lib_protocol/fitness_repr.ml) lines 148–224 and [official round source](https://raw.githubusercontent.com/tezos/tezos-mirror/master/src/proto_025_PsUshuai/lib_protocol/round_repr.ml) lines 74–90. The predecessor encoding reverses `-r-1`; the implementation's negative half of uint32 and `0xffffffff - encoded` recover exactly 0 through signed int32 maximum. Its parser rejects legacy/missing data instead of using the protocol's separate genesis/legacy round-only convenience fallback; that conservative observatory policy is appropriate when authentic current applied evidence is required.

`src/consensus/roundSchedule.ts:43–54` validates complete version02 fitness, widths/hex, signed nonnegative level/round, negative predecessor, optional lock and supplied shell-level equality. Raw `asBlockHeader` rejects invalid fitness. Real round0 remains accepted. `src/monitor/networkMonitor.ts:350–379` keeps unsupported typed candidate fitness attributable in bounded unresolved candidates and excludes it from latest/accepted proposal authority; an unknown typed applied round also blocks candidate acceptance. `src/main.ts:101–105` emits unavailable applied-round/consensus authority and returns before deriving opportunity requests. Unknown proposal/base rounds cannot establish observed proposal or schedule authority. Dashboard replacement of the model clears gauges, proposal title, candidate controls and baker rows instead of merging old numerical values.

Structural predecessor-round parsing does **not** prove consistency with an actual parent. Official fitness source lines 264–277 checks level and predecessor round against supplied context separately. This checkpoint neither compares decoded predecessor round with a proven parent nor infers parent identity from level; it must not be represented as parent/context validation. Actual flattened supplied chain identity is retained; exact protocol/context compatibility belongs to the unfinished cache slice.

Exact source blobs at reviewed HEAD:

| File | Git blob |
| --- | --- |
| src/consensus/roundSchedule.ts | 90f4679b3b1ac7ac4e107fc14262e39b590eec26 |
| src/rpc/guards.ts | d9a7a56077073662f6b611db4ffe1e18e15997b8 |
| src/monitor/networkMonitor.ts | 9fd94453893e5072025a0390a8273f307b625411 |
| src/main.ts | 278ed7ae93aab6f92413f0fa398c362fe18ad217 |
| scripts/check-observatory-foundations.mjs | 667b83630bffdb63e1ba669cc5b6ed8ce8a58cbb |

## Independent execution

All gates used Node22 runtime first in PATH: `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin`, followed by RTK/system paths. Actual invocation prefix was `rtk proxy env PATH=<that runtime>:/home/mathias/.cargo/bin:/usr/local/bin:/usr/bin:/bin rtk`, in the detached worktree.

| Actual command after prefix | Exit | Evidence |
| --- | --- | --- |
| npm ci | 0 | 48 packages installed; no vulnerabilities; npm reported esbuild install script blocked, subsequent actual build worked |
| npm run check | 0 | TypeScript check |
| npm run test | 0 | 67 tests, 15 files |
| npm run build | 0 | Production Vite build |
| npm run test:e2e | 0 | 38 tests in Chromium and Firefox |
| proxy node scripts/check-observatory-foundations.mjs AC-12 | 0 | 29 real assertion groups |
| npm test -- tests/unit/networkMonitor.test.ts | 0 | 14 tests, including two temporary independent actual-monitor tests |
| npm test -- tests/unit/roundReview.test.ts | 0 | Temporary actual parser edge test |

The extra monitor tests delivered typed empty, unsupported-version and level-mismatched fitness through the actual transport callback and verified no latest proposal, no accepted candidates, three attributable unresolved candidates, and valid explicit zero subsequently accepted. A separate test delivered unknown typed applied fitness and verified a valid zero candidate remained unresolved. Extra real-parser assertions exercised uppercase hex, signed int32 maximum level/round/lock/predecessor, actual zero, extra/missing fields, oversized version, signed textual level, negative lock, positive predecessor encoding and invalid hex. These exercise real exported helpers/consumers rather than a mirrored parser.

Temporary test changes were restored/removed after execution. Only this worktree's generated tracked Chromium/Firefox screenshots were restored. Final detached worktree `rtk git status --short` was clean. No application writes, commits, pushes, deployment, or owner-worktree mutation occurred. Read/discovery commands used RTK; initial attempts to read `.harness/rules/typescript.md`, `src/ui/dashboard.ts` and `src/dashboard.ts` returned missing-file errors and were corrected to the actual files.

## Remaining limits

These fixtures establish deterministic synthetic behavior, not public-provider coverage or a live active-network protocol claim. Raw malformed headers are rejected, not retained as typed candidate evidence; typed unsupported candidates retain first receipt/provenance. Exact current/successor protocol anchors, proven parent compatibility, context-aware cache keys, delayed-result authority and the full parent acceptance matrix remain outside this interim review. No full foundations verdict is issued.
