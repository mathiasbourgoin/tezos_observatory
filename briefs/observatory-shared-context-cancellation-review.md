# Independent review — shared cancellation ownership

Recommendation: **approve the scoped source correction**; **browser/V3 validation remains NO-GO** until the reproduced failures are resolved. The bounded source correction is sound on inspection and its own deterministic checks; no source defect was found in this diff. Independent production Firefox execution nevertheless reproduced two unresolved failures. This is not a whole-V3 GO, nor an attribution of either failure to the new source patch.

Reviewed exact commit `97eca770e3b1bd7969e5334bef393a919c60063f` against `49c74935ae82f5ff0f48dc50b9ace6c76caf4dd0`, in my own detached worktree `/var/tmp/observatory-shared-context-independent-review`. Scope is exactly two files: `src/rpc/networkData.ts` and `tests/unit/v3SharedContextCancellation.test.ts`, 119 insertions / 10 deletions. Source SHA256 `560b54a2edcf23279309a3c4b732295dcc90057ad88d489441b29bc884a15992`; committed test SHA256 `42a8eda4e81a1f5f1521875cbe508f17ea0ce89500436383624b53c19a4da760`.

## Findings

1. **High, unresolved release evidence: Firefox reader displacement.** `tests/e2e/dashboard.spec.ts:1135` failed once in three production repetitions: document scroll changed by **627px**, permitted maximum 1px. Final `102 · r0` destination, motion coalescing and settlement assertions passed before that failure. The source correction therefore addresses the demonstrated destination/cancellation issue without establishing all reader-state requirements. Trace actual focus/scroll timing and correct either the product behavior or a demonstrably unsettled initial setup; retain the post-arrival 1px assertion. This is an existing wider-V3 watchpoint, not a proven new regression.
2. **Medium, unresolved fixture/ownership evidence: S9 gate never enters body wait.** `tests/e2e/dashboard.spec.ts:895` failed in two of three Firefox production repetitions: `opportunitySelectionGate.waiting` stayed false for 5000ms. The cancellation/late-poison assertions after that gate were not executed in those repetitions. Chromium passed all repetitions and Firefox passed one. Determine actual request owner/abort/body ordering before repairing setup; passing author-only 20/20 runs do not erase this independent reproduction. No fixture was changed in this review.

Both findings are present in `/var/tmp/shared-context-independent-browser.log`, including exact assertion stacks. Do not claim 42/42 or dismiss these as demonstrated baseline flakiness; I did not run the baseline browser stress independently.

## Source assessment

Context and committee in-flight tasks now coalesce only under identical AbortSignal ownership. Distinct signals retain independent cancellation. Completed immutable contexts still use source/hash keys, verify supplied observed headers, and preserve chain/protocol checks through target requests. Entry and post-await generation/signal assertions prevent paused or aborted readers from receiving cached/shared authority. Derive checks before context insertion and before committing rights/constants. Identity comparisons in `finally` prevent an older owner removing its replacement. Both pending maps and completed caches retain at most twelve entries. Eviction removes only the coalescing handle; it does not claim to cancel all outstanding transport work. Existing caller lifecycle/request budgets remain necessary. No new retry, polling, fallback policy, dependencies or UI edits occur.

I inspected the entire diff, surrounding lifecycle/request/target-context paths, TypeScript policy, scope, tests, authority/source isolation, immutable reuse, cancellation ordering and maintainability. Existing non-null cache-key assertions remain the established bounded-map idiom; no new boundary `any` or suppression was introduced. No security or abuse regression was identified. The nine added tests meaningfully cover both ownership orders, cancelled waiters, committee ownership, same-signal reuse, pause/resume ignored-abort completion, cached expected-header verification and replacement cleanup. Author RED logs are disclosed evidence, not independently rerun here.

## Executed verification

Runtime was existing Node **22.23.3**, selected locally with `PATH=/tmp/context-review-node22-bin:$PATH`; no global settings changed.

- Own `git worktree add --detach /var/tmp/observatory-shared-context-independent-review 97eca77`: exit0.
- Own clean `rtk npm ci`: exit0, 48 packages, zero audit vulnerabilities.
- Own `rtk npm run check`: exit0; `/var/tmp/shared-context-independent-check.log`.
- Own `rtk npm test`: exit0, **297/297**, 21 files; `/var/tmp/shared-context-independent-unit.log`.
- Own `rtk npm run build`: exit0; `/var/tmp/shared-context-independent-build.log`.
- Two additional reviewer-owned tests via `rtk npm test -- tests/unit/independentSharedCancellation.test.ts`: exit0, **2/2**. Fourteen independently owned pending contexts retain exactly twelve handles, settle to zero pending and twelve completed entries; paused completed-cache readers start no requests and obtain no contexts/rights. Test source remains in my worktree, log `/var/tmp/shared-context-independent-probes.log`.
- Own production-only config serves the built `dist` through `vite preview` on port5296, two workers, both actual Chromium and Firefox. `rtk npm run test:e2e -- --config playwright.review.config.ts tests/e2e/dashboard.spec.ts --grep "AC-21 paused|AC-13 adjacent|AC-13 reduced|selection synchronously aborts|late B response bodies|late pending snapshot body|source B ahead votes" --repeat-each 3`: **exit1, 39 passed / 3 failed of42**, no skips. Seven existing scenarios × two engines × three repetitions. Chromium21/21; Firefox18/21. Source-B proof, late B and pending bodies, AC21 pause and reduced motion passed all repetitions. Burst destination never failed; one burst scroll and two S9 setup failures are above.
- Read/inspection commands (`cat`, `sed`, `git diff/show/rev-parse/status`, `sha256sum`, filesystem/runtime discovery): exit0 except one `rg` invocation named absent `tests/unit/contextAuthority.test.ts` and returned2; relevant real `networkData.test.ts` source checks were subsequently inspected. No nonexistent test was counted as run.

The browser suite updates two tracked screenshot outputs in my isolated checkout; these are evidence-side effects, not candidate changes. Reviewer-only config/tests are untracked and were created after immutable candidate build. Production source hashes remained exact.

## Limits and open questions

The full browser suite, all formal V3/foundation CHECK commands, complete visual matrix, manual CHECK38 and final fresh QA/lead were not executed in this scoped review. The author earlier7/8 S9 failure and later8/8 plus baseline20/20/patch20/20 are retained as author evidence only. Current independent results demonstrate unresolved conditions, even with no source-level cancellation defect found.

Root may carry the sound bounded source patch into Astra for continuing development, while keeping both findings open. Review approval for complete scoped browser closure requires causally justified resolution and rerun on the resulting immutable production candidate; final publication remains separately gated.

## Comparison with Astra integration

I separately inspected `fdf58b119a44a69d4000ebf0b5f86255d61a2280`, the identical two-file correction cherry-picked into Astra, and read the current uncommitted browser-test diff in Astra's checkout without editing it. The new settled-reader burst test waits two animation frames after normal focus and again after explicit scroll before taking its initial baseline. A separate rapid-admission variant uses `focus({preventScroll:true})` and retains rapid delivery. Both retain the exact post-arrival focus, ≤1px document displacement, destination and ≤200ms settlement assertions. Frame tracing adds scroll, document height and focus. This is a defensible setup separation for testing an established reader state and an immediate admission state, but that source was mutable and was not the candidate independently built or executed above. S9 gate setup remains unchanged in the inspected diff. Author36/36 on the integrated work remains author evidence, not an independent rerun or closure of my39/42 result. Independent QA on an exact combined immutable candidate must adjudicate both findings.

After this comparison, Astra reported freezing the integration as `6b84225` (parent `fdf58b1`), with source receipt `/var/tmp/tezos-observatory-evidence-cg92wqle/cancellation-integrated-stress-02.sources.json` and results `cancellation-integrated-stress-02.json`. Astra identifies earlier trace `motion-stress-development-02.json` as showing scroll200→839/840 while identity remained101/r0. These were received author references, not independently executed or adjudicated evidence in this review. The immutable candidate is now available to fresh QA; S9 remains explicitly unresolved.
