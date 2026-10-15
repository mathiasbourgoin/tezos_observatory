# Slice 4 domain corrections — independent INTERIM verification

Exact frozen revision: `17abd2af5d548c9870a19d45be4afb3233526988`, compared with `be46aeb3fdb08e6d740c5aac4a75d5b9347ea518`. Independent detached worktree: `/tmp/observatory-s4-domain-fix-review-17abd2a`. Date: 2026-10-15. Read the exact committed `briefs/observatory-foundations-slice-4-domain-review-fixes.md` via the revision diff; mutable owner implementation was not inspected or used.

**All three findings from the domain review are resolved for the tested accepted API invariants.** This accepts the narrow corrections as INTERIM evidence. It is not full slice-4 GO, integration authorization, parent review GO, AC3/18 acceptance or historical AC17 certification. Production monitor/page promotion wiring remains independent work in progress, outside this frozen change.

| Original finding | Independent disposition |
|---|---|
| High: expected target execution protocol substituted | Resolved. Repeated the ordinary target123 wrong-protocol request and the cached coherent candidate123 wrong-protocol request against actual `NetworkData.reconcile`; both reject. The normal candidate proof still succeeds before the substituted cached request is tried. |
| Medium: omitted generation tokens restore pre-pause authority | Resolved. Repeated actual factory proof with optional generation tokens removed, then store stop/start; `ObservationStore.accept` rejects it. Separate positive assertion confirms omitted fields remain valid in an untouched initial epoch, as allowed by the API; no new universal mandatory-token requirement was invented. |
| Medium: equal opaque key hides contradictory constants context | Resolved. Repeated equal-key constants with altered execution protocol against actual store admission; it rejects. The store now compares reused `contextFacts` for each right and constants against the admission context. |

An additional independent activation check proved that head122's producing protocol `PProducing` and successor execution protocol `PSuccessor` can differ: target123 with expected `PSuccessor` succeeds and a cached request expecting `PProducing` rejects. The correction compares `target.protocolHash` with target `context.protocolHash`, not shell protocol counter or head's producing protocol. No activation regression was established.

Temporary independent assertions reused the exact test helpers/consumer path from the prior report. Tests named `REVIEW independently rejects requested execution protocol substitution`, `REVIEW independently rejects omitted epoch pre-pause proof`, `REVIEW independently rejects equal-key contradictory constants context`, `REVIEW independently rejects cached coherent candidate execution protocol substitution`, `REVIEW preserves valid omitted-generation admission in untouched initial epoch`, and `REVIEW permits successor execution protocol across genuine activation` all passed. The first five passed initially, then all six passed after adding activation coverage.

## Actual commands and evidence

Runtime PATH prefix: `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin:/home/mathias/.cargo/bin:/usr/local/bin:/usr/bin:/bin` (Node22.23.3). All shell commands used RTK.

| Command | Exit / result |
|---|---|
| `rtk git worktree add --detach /tmp/observatory-s4-domain-fix-review-17abd2a 17abd2af5d548c9870a19d45be4afb3233526988` | 0 |
| `rtk git diff be46aeb3fdb08e6d740c5aac4a75d5b9347ea518 17abd2af5d548c9870a19d45be4afb3233526988` | 0; five changed files, 27 insertions / 4 deletions |
| `rtk npm ci` | 0; npm reports blocked esbuild install script, subsequent actual build succeeds |
| `rtk npm test -- --testNamePattern REVIEW` before activation addition | 0; five independent assertions passed |
| same command after activation addition | 0; six independent assertions passed |
| `rtk git restore -- tests/unit/observationStore.test.ts` | 0; temporary assertions removed before frozen gate rerun |
| `rtk npm run check` on restored exact revision | 0 |
| `rtk npm test` on restored exact revision | 0; **101 tests / 17 files**, not the owner's mutable-WIP103 |
| `rtk npm run build` on restored exact revision | 0 |
| `rtk npm run test:e2e` | 0; **38 Chromium/Firefox baseline tests** |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-1` | 0; 12 assertion groups |
| same command with `AC-9` | 0; 12 assertion groups |
| same command with `AC-10` | 0; 7 assertion groups |
| same command with `AC-11` | 0; 9 assertion groups |
| same command with `AC-12` | 0; 29 assertion groups |
| `rtk git restore -- roster/observatory-foundations/slice-1-chromium.png roster/observatory-foundations/slice-1-firefox.png` | 0; generated tracked outputs restored |
| `rtk git status --short` | 0; clean |
| `rtk git rev-parse HEAD` | 0; exact17abd2af5d548c9870a19d45be4afb3233526988 |

The first chained check/unit/build run overlapped temporary-test insertion and reported106 passing tests (101 frozen + five temporary). That augmented run is additional verification only; the subsequent restored run above supplies the exact frozen101 count. Browser baseline was rerun because the corrections affect exported production accounting and facade authority; its passes establish compatibility, not the unfinished B-source production promotion workflow. Original AC17 was not rerun in this correction-only verification; its earlier exact-be46aeb exit2/incomplete status is unchanged by this evidence.

No new unresolved finding arose in the narrow correction diff. The pending complete-slice review still must verify actual source-local scheduler ownership, resource/failure retirement, lifecycle/request ledger and B123 production unresolved-to-proof promotion independently in both engines. All10 slices and38 checks remain active. No root app or owner edits, commits, pushes, integration or deployment occurred. This report is the only root-workspace write from this correction verification.
