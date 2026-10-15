# Locator findings

Source HEAD: 9cdd07f29c2268d015dbc56dcc041583ff663473.

Scope: answered manifest questions 1 and 6 using rg --files and path-only rg -l searches under src and tests. Search terms included tzkt, block.?time, predecessor, timestamp, protocol, applied, level, network.?data, header, metric, freshness, partial, unavailable, and mobile. Findings identify candidate locations only; no behavior or UI semantics are inferred.

## Question 1: network sources and transport interfaces

- RPC and network-facing modules are in /home/mathias/dev/tezos_observatory/src/rpc/: networkData.ts, streamTransport.ts, jsonStream.ts, sourceComparison.ts, and models.ts.
- Monitoring and observation modules are in /home/mathias/dev/tezos_observatory/src/monitor/: networkMonitor.ts, observationStore.ts, headGeneration.ts, and observerReconciliation.ts.
- Related unit-test entrypoints are /home/mathias/dev/tezos_observatory/tests/unit/networkData.test.ts, streamTransport.test.ts, sourceComparison.test.ts, networkMonitor.test.ts, observationStore.test.ts, headGeneration.test.ts, and observerReconciliation.test.ts.
- Browser/dashboard entrypoints are /home/mathias/dev/tezos_observatory/src/main.ts and /home/mathias/dev/tezos_observatory/src/dashboardView.ts.

## Question 6: UI and presentation test locations

- Dashboard presentation source is /home/mathias/dev/tezos_observatory/src/dashboardView.ts; styling is /home/mathias/dev/tezos_observatory/src/dashboard.css; application entrypoint is /home/mathias/dev/tezos_observatory/src/main.ts.
- Browser test entrypoints are /home/mathias/dev/tezos_observatory/tests/e2e/dashboard.spec.ts and /home/mathias/dev/tezos_observatory/tests/e2e/header.spec.ts.
- Other view modules under /home/mathias/dev/tezos_observatory/src/view/ are missingDelegates.ts, delegateBadge.ts, and nextOpportunities.ts; related unit tests reside under /home/mathias/dev/tezos_observatory/tests/unit/ with corresponding module names.

These are directory, filename, and entrypoint locations only. Content-level UI behavior, metric labels, attribution, responsive layout, freshness and failure handling were not inspected.
