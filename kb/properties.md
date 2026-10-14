# Required properties

These are intended invariants; [risks](risks.md) records baseline gaps rather than weakening this contract.

1. Network, level, round, payload, phase, candidate and source/context remain attributable. Competing payloads never contribute to another payload's quorum; a payload alone does not establish its producer.
2. Count committee power once per delegate, phase and instance, including individual/aggregate replay. Use the protocol's exact integer threshold; signer count is neither operation count nor balance.
3. Unavailable rights, missing identity and insufficient coverage remain unavailable. A transport connection does not prove a measured zero or complete coverage. Missing delegates means not observed under stated source/context coverage, not network-wide inactivity.
4. Applied head, validated proposal, observed votes, calculated opportunities and finality are different claims. Schedules never manufacture received evidence. Finality needs verified ancestry.
5. Chain progress and RPC/observer health are independent. Rights and eligibility carry coherent context and freshness across head changes, including reorganisations; obsolete asynchronous results cannot update another context.
6. Pinning freezes inspection selection, not collection. Follow-live and collection pause are explicit independent modes. Incoming updates preserve focus, scroll, expanded controls and chosen ordering.
7. Retention, concurrent requests, caches and fallback reads are bounded. Hidden or paused collection cancels external work including auxiliary aliases. Additional source comparison is bounded and explicit; decorative effects cause no RPC work.
8. Historical observations retain provenance and are session observations, not archival completeness. Browser receipt timestamps include RPC/network/browser delays and never imply global propagation latency.
9. Both themes and every viewport preserve legible values, keyboard/touch access and non-colour state cues. Reduced motion retains functionality; no animation or update may steal reading position.
10. Independent reviewer and QA validate the changed system. Passing mocks/builds never certifies live providers. Root may validate intermediate artifacts under delegated authority; maintainer alone approves publication/deployment.
