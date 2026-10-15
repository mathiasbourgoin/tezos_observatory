# Slice 4 domain review — INTERIM, changes required

Reviewed frozen commit `be46aeb3fdb08e6d740c5aac4a75d5b9347ea518` against `33599973788d016098a28b8d8ba04dbbf4855d25` in independent detached worktree `/tmp/observatory-s4-domain-review-be46aeb`. Review date: 2026-10-15. This is a domain checkpoint, not full slice-4 acceptance, integration approval, parent review GO, or whole-contract completion. All 10 slices and 38 checks remain binding.

## Findings

1. **High — reconciliation accepts a substituted expected execution protocol.** `src/rpc/networkData.ts:333–349` validates candidate level/round/payload but never compares supplied `ReconciliationTarget.protocolHash` to the proven target execution protocol. The scheduler treats that field as material key identity, so a caller can request a distinct purported protocol while receiving the same actual proof. A genuine consumer regression with B head122, target123 and proven `PFixture` passes `protocolHash: "WrongExecutionProtocol"`; reconciliation resolves instead of rejecting. A second regression first proves a coherent candidate123 under `PFixture`, then changes only `protocolHash` to `WrongProtocol`: the same cached proof resolves again. This violates exact target/protocol binding and weakens failed-context identity. Compare an explicitly supplied expected execution protocol with `context.protocolHash`; do not confuse the shell `proto` counter, producing protocol of applied head H, and execution protocol of target H+1 from anchor.nextProtocolHash. At activation these may legitimately differ. The tests deliberately use a wrong string that matches none of the fixture protocols.

2. **Medium — optional admission generations leave a lifecycle escape hatch.** `src/monitor/observationStore.ts:9–17,95–100` permits generation fields to be omitted. A coherent proof with those optional fields removed can be accepted after `stop(); start()` and restore accepted authority from a prior collection epoch. The head fallback checks only head equality; no head change occurs in this scenario. Current `ObservationStore` target construction and `NetworkData.reconcile` normally propagate the tokens, so this is an accepted API invariant gap, not evidence that current production wiring drops them. Make collection/observer ownership mandatory for asynchronous admission, or provide an explicit separately constrained synchronous cached-inspection path that cannot grant fresh live authority.

3. **Medium — constants context equality trusts the supplied key alone.** `src/monitor/observationStore.ts:101–102` verifies rights mutual coherence, but only compares rights/constants context keys with admission context. Constants `{...proof.constants, context:{...proof.context, protocolHash:"WrongProtocol"}}` preserve the key and are accepted. A divergent committee may likewise preserve a key while carrying consistently different context facts. The facade currently constructs coherent frozen contexts; the accepting store should still enforce its own exact-context contract. Compare necessary observer/anchor/network/chain/head/parent/execution-protocol/target facts with admission context, in addition to key equality. This matters because constants supply committee total and threshold. Reject inconsistent numerical authority while retaining raw evidence.

No other reproducible high/critical domain issue was established in this checkpoint. Recommendation: **changes required before integration of the domain code**. Architecture risk: medium while the above API gaps remain; source-local stores, bounded products and separate proof sidecars otherwise fit the existing architecture. No new dependency or generic infrastructure was introduced.

## Independent evidence

All runtime commands used Node `22.23.3` through PATH prefix `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin:/home/mathias/.cargo/bin:/usr/local/bin:/usr/bin:/bin`. Shell commands used RTK. In the detached worktree:

| Command | Exit / observed result |
|---|---|
| `rtk npm ci` | 0; 48 packages installed; npm reported esbuild install script blocked, but subsequent actual build ran successfully |
| `rtk npm run check` | 0 |
| `rtk npm test` | 0; 98 tests, 17 files |
| `rtk npm run build` | 0; production Vite build |
| `rtk npm run test:e2e` | 0; 38 tests across Chromium and Firefox |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-1` | 0; 12 assertion groups |
| same command with `AC-9` | 0; 12 assertion groups |
| same command with `AC-10` | 0; 7 assertion groups |
| same command with `AC-11` | 0; 9 assertion groups |
| same command with `AC-12` | 0; 29 assertion groups |
| same command with original `AC-17` | 2; unsupported/incomplete invocation, not a behavioral pass |
| same command with `AC-4 --browsers chromium,firefox` | 0; 7 assertion groups including production `/` in both engines |
| same command with `AC-20 --browsers chromium,firefox` | 0; 2 assertion groups including production `/` in both engines |

Temporary assertions were appended only in the detached worktree's existing `tests/unit/observationStore.test.ts`, using its `head`, `installRpc`, `b`, `operation` helpers and actual `NetworkData`, `ObservationStore`, and accounting consumers. Relevant final reproductions:

```ts
// Wrong expected target execution protocol; real RPC fixture proves PFixture.
installRpc();
await expect(new NetworkData("mainnet").reconcile({
  source:b, level:123, round:0, payload:"P",
  protocolHash:"WrongExecutionProtocol"
}, new AbortController().signal)).rejects.toThrow();

// Cached coherent candidate proof cannot satisfy a substituted target protocol.
const header={...head(123),payload_hash:"P"}; installRpc(header);
const candidate={identity:"candidate",header,evidence:evidence(b)};
const data=new NetworkData("mainnet");
const target={source:b,level:123,round:0,payload:"P",candidate};
const proof=await data.reconcile(target,new AbortController().signal);
expect(proof.context.protocolHash).toBe("PFixture");
let rejected=false;
try {await data.reconcile({...target,protocolHash:"WrongProtocol"},
  new AbortController().signal);} catch {rejected=true;}
expect(rejected).toBe(true);

// Valid public API shape with optional epoch fields omitted.
const {observerGeneration,collectionGeneration,...untagged}=proof;
store.stop(); store.start();
expect(()=>store.accept(untagged)).toThrow();

// Matching key with contradictory context facts.
const constants={...proof.constants,
  context:{...proof.context,protocolHash:"WrongProtocol"}};
expect(()=>store.accept({...proof,constants})).toThrow();
```

`rtk npm test -- --testNamePattern REVIEW` first ran 3 assertions: 2 assertion failures and 1 pass (exit1). The initial candidate-protocol version rejected because its mock did not expose the candidate header; that pass was not used as correctness evidence. After changing to a noncandidate protocol request, the three assertions all failed by genuine assertions (exit1). A separate candidate reproduction first demonstrated a correct normal proof; an intermediate malformed fitness mock caused execution failure and was discarded. After restoring valid Tenderbake fitness, `rtk npm test -- --testNamePattern "REVIEW (rejects candidate execution|independently)"` ran 2 assertions: candidate protocol substitution failed by `expected false to be true`, and the independent resource regression passed (exit1 overall). These are raw Vitest consumer assertion findings, not semantic-check exit classifications.

The resource regression submitted 10,001 distinct valid-source raw packets with distinct enormous claimed targets, verified 10,000 raw operations and 100 unresolved targets independently, checked oldest first receipt retention (oldest remaining unresolved receipt9901), and replayed the latest packet without growth. Existing tests independently verified B123 promotion under B122 while A120 remains independent; wrong-chain raw membership rejection; same-hash contradictory-parent withdrawal; late-generation admission rejection; contextless/mixed committee unknown power; evicted-quarantine membership cleanup; candidate level/round/payload substitution rejection; fresh H2 receipt authority while H1 remains retained and invalid; pause fencing with factory-issued tokens; and failed K1 suppression after K2 failure.

## Scope and remaining evidence

Read reviewer/architect skills, project authority, TypeScript patterns, accepted spec/plan/addendum/whole implementation role, project architecture and actual root slice-4 review checklist. Audited all changed domain and monitor/facade/check files, including provenance, separate raw/unresolved/accepted products, original receipts, context withdrawal, lifecycle cancellation, scheduler coalescing/cooldown/failure state, source-only facade reads and dependency/API coupling. Scheduler retained-key ownership callback still requires real monitor wiring and flood/lifecycle consumer evidence; this checkpoint does not certify that wiring or complete failed-state retirement semantics.

Production browser passes establish compatibility of the existing page. They do not prove the new production B123 unresolved-to-B-proof workflow, manual retry, request ledger or admitted/unresolved inspector behavior. AC3/18 remain incomplete by the frozen checkpoint's own declaration. Historical AC16/17, full150-history/pin behavior, complete source snapshot zero, events, comparison and opportunities remain later owning-slice evidence; no full historical AC17 certification is made.

No bounded live-origin checks were run in this domain-only review; no provider coverage claim follows. No root app edits, owner worktree edits, commits, pushes, integration or deployment occurred. Temporary assertions and tracked browser screenshot outputs were restored with `rtk git restore -- tests/unit/observationStore.test.ts roster/observatory-foundations/slice-1-chromium.png roster/observatory-foundations/slice-1-firefox.png`; final detached `rtk git status --short` was clean. Read/navigation commands (`rtk read`, `rtk rg`, `rtk proxy sed`, `rtk git diff`, `rtk git status`) succeeded except exploratory reads of absent root `AGENTS.md` (exit1) and nonexistent `src/lib/domain` (exit2); policies were read from applicable supplied instructions and actual project files. Detached `rtk git worktree add --detach … be46aeb…` exited0. This report is the only root-workspace write.
