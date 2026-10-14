# Interim numerical correction — authentic applied rounds

**Status:** INTERIM; full foundations and context-cache slice remain in progress.

Applied block admission now validates complete Tenderbake fitness instead of allowing missing/arbitrary fields to fabricate round0. The actual consumer checks version02/five fields, signed nonnegative level/round bounds, shell-level equality, optional lock smaller than round, and signed negative predecessor-round encoding. Typed unsupported/malformed paths return unknown. Main presentation withdraws numerical consensus authority for an unknown applied round; monitor candidate admission keeps unsupported rounds unresolved.

Official active Ushuaia source corroborates these rules in the [research evidence](../roster/observatory-foundations/context-authority-research.md). Real round0 and valid locked rounds remain supported. Flattened header `chain_id` is retained as an actual supplied fact. Exact protocol hashes and compatible current/successor RPC anchors remain separate unfinished context-cache work; shell proto is still explicitly a counter.

TDD reproduced old guard acceptance of absent/malformed/negative encoded fitness and `proposalRound([])` returning0 before behavior changes. New raw fixtures use authentic level-bound fitness rather than the prior fixed/empty scaffolding. All 67 unit tests, TypeScript check, production build and 38 Chromium/Firefox production-page cases pass. AC-12 now executes29 real assertions, including malformed/legacy/negative/mismatched-level fitness, legitimate lock/round and actual chain identity. Existing same-source candidate/accounting consumers remain exercised. This checkpoint is for independent numerical review, not a parent completion event.
