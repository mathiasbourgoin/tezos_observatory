# Numerical round correction — root integration

Status: INTERIM. Owned checkpoint `f0e695d9c6a24bb04630d16aa4784652f04aeeea` was independently reviewed and integrated without conflict as root `a9f419e`. No deployment occurred.

The [independent review](observatory-foundations-round-truth-review.md) records clean Node22 install/check/build,67 unit tests,38 Chromium/Firefox scenarios,29 actual AC-12 assertions and additional real-monitor/parser edge checks. Root then independently ran `rtk npm run check` and `rtk proxy node scripts/check-observatory-foundations.mjs AC-12` under Node22 after integration; both exited0, with29 assertion groups in AC-12.

Malformed/unsupported/missing fitness no longer becomes an inferred round0; real0 remains valid. Typed unsupported candidates remain unresolved and attributable. Raw malformed headers are rejected. Structural predecessor-round decoding is not proof of actual parent compatibility. Exact context/cache authority and the complete foundations acceptance matrix remain unfinished.

The optional consistency recommendation to pass shell level at two remaining main.ts helper calls was assigned to the owner during context work; existing admission already validates that binding, so this is not a reproduced scoped defect. No parent implementation COMPLETED or independent whole review/QA GO is asserted.
