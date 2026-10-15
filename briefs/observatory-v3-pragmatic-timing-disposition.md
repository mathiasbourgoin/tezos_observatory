# Accepted pragmatic timing limitation

Authority: maintainer instruction « sois pragmatique, le mieux est l’ennemi du bien » and delegated intermediate decisions in .harness/rules/project-authority.md. Root accepts the following UI timing limitation for this delivery, without claiming strict AC13 acceptance. Data authority, source qualification, numeric correctness and core reader/native usability remain required.

Original478 ordinary regression observed226.9ms and212.5ms against the200ms end-to-end limit. The targeted correction preserves default160ms WAAPI duration, captures UI emission before rendering and counts elapsed render latency. Author and independent focused runs passed, including an injected70ms delay. An independent initial corrected-source run nevertheless observed229.1ms and no sampled Firefox UP animation; a subsequent dashboard-only run passed10/10. All failures and passing reports remain retained. Observed scheduling gaps do not establish a causal explanation or a universal timing guarantee.

Decision: source correction accepted; occasional strict200ms settlement and animation-sampling reliability remain UNRESOLVED/WAIVED for this pragmatic delivery. They are not RESOLVED or full-contract PASS. Do not keep changing animation code or repeating unchanged tests until green. No test threshold is relaxed. Any actual remote CI failure must be handled transparently, not relabelled as success.

Scope references: author0b9d3d8eee7fd0f5da00b9aae60a5c5503d84875, integrated30ed19191bc8f98985d344748bdfe709435b4b7c, independent briefs/observatory-v3-timing-budget-review.{md,json}. Fresh practical QA and final lead must assess the accepted limitation alongside all other delivery evidence. Publication and deployment remain separate retained gates.
