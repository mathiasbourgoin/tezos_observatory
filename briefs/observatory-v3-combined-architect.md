# Combined V3 architect review — bounded frozen source

No new blocking architecture finding was identified on `f75cfe64c836a9e1efe620861184e75dc7bd2f2d` relative to foundation `bf0f2d5c395ecdcf155064ba56f1577bfb73cc4c`. Structured specialist findings: `observatory-v3-combined-architect.json` (empty array). This is a bounded architecture assessment, not whole-source release clearance, QA, visual acceptance or a claim that all393 contract claims passed.

## Actual verification

Independent detached worktree `/var/tmp/observatory-architect-f75`; Node22.23.3 through `/tmp/context-review-node22-bin`, TMPDIR `/var/tmp`. The checkout initially had no `dist`. Clean ordered `rtk npm ci`, `rtk npm run check`, `rtk npm test` (353/353), and `rtk npm run build` all exited0. The f75 lazy-binding repair therefore survives this independent clean order.

Actual served-production Playwright checks used ordinary port5857 and both Chromium and Firefox: reader/refresh lifecycle, initially-hidden/manual-pause/BFCache, accepted current applied advancement, unqualified raw replacement, and qualified same-height replacement fencing. All10 engine/scenario executions passed; zero skipped, failed or flaky; actual run09:45:52UTC,21.94s. These target network-acquisition ownership and accepted-context boundaries; they are not a substitute for the full product suite.

Raw logs and decoded report are in `/var/tmp/observatory-architect-evidence-f75/`; `command-results.json` records commands/exits and the preserved npm-preamble JSON decoding diagnostic. `source-bindings.json` records independently computed complete source/contract/build hashes. Source combined `51e7d205b19f0e11fa6b18687e0075fe72b962ae60062d73f532d305f7d5a083`; contracts `d7cbf8eb896bab0f8a7339ce65085ed6c33ad5a72222b995e0ec004aee9e7414`; production `260a4ae292844254ea2145299d7453c49dcf102b3381613aae49a05f7b01deff`. Worktree source remained clean.

## Architecture assessment

Read `kb/architecture.md`, relevant generated properties/check obligations, root glossary, project authority, TypeScript patterns, and the acceptance/entity sections of all three active contracts. Examined the changed production modules and their ownership boundaries rather than proposing a framework or broad refactor.

- `main.ts` continues to own lifecycle and coordinate per-network state; the new interval owner receives permitted collection/applied-head events and view projections. Rendering and monotonic ages do not acquire interval data. Source/chain/header proof remains necessary before an applied event reaches that owner.
- `BlockIntervals` keeps one committed three-window batch, one active owner and one boolean newest eligible queue. Its generation fence, abort checks, per-read/body budget, two-worker floors, fixed-end recheck and sticky stale state are localized. It does not share or redefine comparison freshness or consensus authority.
- `CandidateProducers` is admission-driven and bounded at100 attempt entries/100 cached facts with one flight/one newest queue. Configured source watermarks and immutable-hash metadata qualify its optional result; monitor/store capture uses the existing epoch/token authority and frozen snapshots remain separately owned. No navigation entrypoint is added to acquisition.
- `observationMeaning.ts` is a read-only projection; its dashboard/monitor imports are type-only. The monitor exposes a constant-size applied proof instead of an accumulating parallel history. Existing store products retain separate candidate, unresolved, raw and session bounds.
- Per-phase completeness is centralized in `pendingPhaseComplete` and shared-loss invalidation in `invalidatePendingCoverage`; current/retained paths use them rather than treating one phase's completeness as both. Remaining receipt presentation/authenticity is explicitly an open functional finding below.
- View code remains native DOM and the collector remains framework-independent. Existing large coordinator/view files grew within their documented orchestration/render responsibilities; file length alone does not establish an objective regression warranting a redesign during this fix.

## Open findings and limits

The coordinator's independently established HIGH findings remain open on f75: each phase lacks its own authentic receipt/age presentation; the shared loader does not require an exhaustive emitted-production inventory; and AC13 measures settlement from first rendered destination frame rather than actual final acceptance. They are not reissued as duplicate architect findings. F75's clean-discovery correction is verified only within the bounded gate above.

Full ordinary regression, official95 interfaces, full70×36 rendered matrix, native surfaces/physical browser zoom, independent visual judgments/manual CHECK38, source-corrected follow-up review, and QA are unexecuted by this architect and coordinated with other independent roles. Port5188 and the author's worktree were not used. No product/spec/managed-KB edits, publication, deployment or external-provider audit was performed.

Overall architecture risk: **medium**, reflecting the size of the joint integration and known unresolved functional/evidence findings. No additional critical finding, important warning or speculative optional refactor is proposed. The next immutable source delta needs independent reinspection and appropriate execution before any full verdict.
