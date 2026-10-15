# Slice 3 independent context review — INTERIM

Reviewed exact detached commit `ae1040d10eef23897c07d66a6ce90c3f06405dd7` against `f0e695d9c6a24bb04630d16aa4784652f04aeeea` in `/tmp/observatory-context-review-ae1040d`. The mutable implementation worktree was neither read nor tested. This is a scoped interim review, not parent completion or a QA ledger.

## Critical findings

None identified in the changed context/cache/admission implementation. Immediate withdrawal occurs synchronously in `HeadGeneration.transition` before `NetworkMonitor.acceptHead` emits or starts asynchronous derivation. Same-height replacement and same-hash endpoint changes advance generation; stale commitments are rejected. Collection-generation checks also precede body/source/cache commitments after cancellation.

## Warnings

- **W1 — AC-17 historical-retention evidence remains narrower than the full criterion.** `scripts/check-observatory-foundations.mjs:127–140` creates a separate `historicalData` instance and keeps the returned `historical` and `oldEvidence` in test-owned variables. Its historical assertions prove immutable returned provenance, not retained historical facts reached through the application's session/history store after its actual reorg. `HeadGeneration.transition` discards the live derived pointer; the bounded NetworkData caches retain original objects, but this check does not retrieve those after replacement or inspect a retained application snapshot. Keep the 15 passing assertions as context-fencing evidence and add an actual retained-store consumer assertion when the later history slice lands; do not represent this alone as complete historical AC-17 certification. This is an evidence limitation for the ongoing parent work, not a newly demonstrated unsafe authorization.

## Optional improvements

- `networkData.ts` now contains dense context and eligibility methods. A small named context-key builder and expanded formatting would make identity fields and proof checks easier to maintain. No structural split or new infrastructure is necessary for this slice.

## Source and protocol assessment

Read the full slice-3 artifact, accepted FR-013/014/025/029/030/031/032, AC-17 and Entities, project authority, TypeScript conventions, reviewer/architect principles and architecture KB. Inspected all changed source, tests and checker code. The changed boundary keeps external input `unknown`; production rights/constants/baking records and nested context/header/source evidence are frozen, preserving original responder and receipt facts.

`targetContext` obtains pinned header plus exact `/protocols` identity. Current-level execution uses the fetched exact predecessor and requires predecessor `next_protocol` equal to H producing `protocol`; successor execution uses H `next_protocol`. Predecessor hash is fetched directly, and level checks only validate that proven relationship. Same-protocol predecessor-round contradiction withdraws current authority. Separate constants profiles prevent activation-crossing reuse. Baking H+2 is explicitly admitted only by the conditional helper path, separate from the H/H+1 counting window.

`targetRequest` proves the actual helper responder's pinned H and anchor against observer A, including chain/header/producing and successor protocol compatibility. Responder B's original receipt remains B; the proof is pinned context, not evidence of B's current HEAD. Parsed context headers have no borrowed stream evidence, so helper receipts do not fabricate B CURRENTHEAD. Cached rights retain original receipt/context instead of relabelling them as a new source. Cache authority keys include observer endpoint, chain, head, predecessor, execution protocol and target; baking adds round. Missing protocol, incompatible chain/header and contradictory committees remain unavailable. Raw incompatible signer slots remain inspectable but uncounted through the actual `groupsFor` boundary, and the production page additionally gates numerical coverage on compatible selected observation.

Eligibility age uses monotonic elapsed time; >=60000ms expiry is sticky. Observer change invalidation is sticky even if the old hash returns, and late old-context receipts are retained explicitly invalid without authority. Three actual workers are enforced; Mainnet starts zero eligibility requests. No periodic refresh was added.

The official research fact pack was read and primary directory source independently fetched: [Octez block directory](https://github.com/tezos/tezos-mirror/blob/master/src/lib_shell/block_directory.ml#L790). Its raw header registration uses producing Proto while protocol services are selected from Next_proto; this supports the helper execution distinction. It also supplies current/next hashes through `/protocols`, separate from shell protocol-level counters. This establishes source semantics, not public provider availability.

## Actual independent execution

All final reproducibility commands used actual Node **22.23.3**, with a temporary local PATH wrapper for the installed npm CLI. No application edits or temporary test additions were made.

| Command | Exit | Evidence |
|---|---:|---|
| `rtk npm ci` | 0 | Clean install, 48 packages, zero audit vulnerabilities |
| `rtk npm run check` | 0 | TypeScript |
| `rtk npm test` | 0 | 15 files / 79 tests |
| `rtk npm run build` | 0 | Production Vite build |
| `rtk npm run test:e2e` | 0 | 38 Chromium/Firefox cases |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-1` | 0 | 12 assertion groups |
| same checker AC-9 / AC-10 / AC-11 / AC-12 | 0 each | 12 / 6 / 9 / 29 groups |
| same checker AC-17 | 0 | 15 groups, with W1 limit |
| same checker AC-4 `--browsers chromium,firefox` | 0 | 7 groups including production browsers and actual eligibility cancellation |
| same checker AC-20 `--browsers chromium,firefox` | 0 | 2 production browser groups |
| same checker AC-21 | 2 | Explicit incomplete invocation; comparison cancellation is absent |

Initial diagnostic gates also passed under default Node 26, but are not the reproducibility evidence. An initial Node22 PATH attempt found the binary but npm wrapper resolution failed (exit1); corrected using the actual npm CLI and reran all gates above. Initial AC-4/20 invocations without the required browser argument returned exit2; corrected invocations above passed. Read/search commands returned exit0 except the optional `.claude` search returned exit2 because that directory is absent; canonical project TypeScript patterns were read instead. Generated tracked screenshots were restored in the detached worktree after browser gates.

No public-provider coverage, percentage coverage, full historical/pin semantics, reconciliation, comparison, immutable events or selected-relative opportunity delivery is certified here. AC-19/30/35 are not certified from eligibility/fallback subsets. Scoped context architecture risk is low; W1 must remain visible in parent acceptance accounting. No parent GO verdict is issued.
