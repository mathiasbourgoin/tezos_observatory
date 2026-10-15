# Slice 4 domain interim checkpoint

Status: INTERIM; parent implementation remains in progress. This checkpoint does not certify full AC3 or AC18 and is not an integration or whole-phase acceptance verdict.

Bounded source-local observation records retain immutable original receipts and attach separate exact-context admission proofs. Per-observer reconciliation coalesces one in-flight request and one newest queued target with monotonic 15-second start spacing. Failed retained targets require a fresh manual retry; collection restart and raw replay do not erase their failure state. The failed-key index accepts a retained-target ownership callback and must be wired by the monitor.

Eight genuine behavioral assertion failures preceded the corrections: wrong-chain membership, obsolete same-height context, contradictory same-hash parent, late generation admission, contextless or mixed committee power, evicted quarantine membership, candidate target substitution, and forgotten K1 failure after K2. Regression assertions now pass at the actual observation store, phase accounting, RPC reconciliation and scheduler consumers. A genuine new H2 receipt admits H2 power while the original H1 record and proof remain readable and context-invalid. Unknown or unsupported authority never supplies numerical power.

Actual validation: check PASS; 98 unit tests across 17 files PASS; build PASS; 38 Chromium/Firefox browser tests PASS. Native semantic commands AC1, AC9, AC10, AC11 and AC12 pass 12, 12, 7, 9 and 29 assertion groups respectively. Original AC17 still exits 2 because retained application history evidence is not implemented. Existing browser passes establish compatibility of the current page, not the new B-source promotion workflow.

Remaining slice 4 work: wire the unified observation store and per-source scheduler into NetworkMonitor, expose admitted and unresolved source-local targets to the production page, and verify actual B123 unresolved-to-same-B-proof promotion while A120 remains independent in both browsers. Preserve exact source provenance, request ledger and cancellation fencing. AC3 and AC18 remain incomplete until that consumer evidence closes. Historical snapshot retrieval, complete snapshot zero and comparison remain later slices.

Reuse: existing OperationStore, phaseEvidence, native maps, AbortController, Vitest, Playwright and Vite are used. The canonical library index was checked; no generic storage framework, parser, harness or dependency was introduced.
