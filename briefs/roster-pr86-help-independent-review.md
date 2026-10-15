# PR86 reviewer supplement — successful help streams

Exact `2608681b9062b0d9d8929755a1c0b59282dffecf`, tree `496016e268fe54d7a50c28e65032d254ee98ce5f`, parent `38634df6ed5b4bc46531051bb4ef72cbb1c3a364`. Own detached `/tmp/roster-pr86-reviewer-2608681`; root and earlier reviewer checkouts preserved.

This is the explicitly requested bounded supplement to my386 reviewer unit, using its role/contracts and45-file inventory. No new PR specialist, full pipeline verdict, QA, GO, phase event, normalization or convergence. S9 remains higher priority. No code changes, subagents, remote actions or dependency selection.

## Finding closure

The LOW successful-help stream regression is independently **closed**. `scripts/roster-extension.ts:12-16` now selects stdout for exitCode0 and stderr for failures. I read both changed files completely: entrypoint1-18 and `scripts/extension-cli-arity.test.ts`1-97. Tests include the two actual compiled-CLI regressions covering success and usage failures; prior parser seams remain.

Actual independent Node22.23.3 compiled CLI probe (`/tmp/pr86-reviewer260-probe.cjs`, complete result `/tmp/pr86-reviewer260-probe.log`) returned:

| Arguments | Exit | stdout bytes | stderr bytes |
|---|---:|---:|---:|
| `--help` | 0 | 284 | 0 |
| `-h` | 0 | 284 | 0 |
| none | 1 | 0 | 284 |
| `list --dryrun` | 1 | 0 | 332 |

Every successful help output and every failure stderr matched `Usage: roster-extension`; opposite streams were asserted empty. The historical actual baseline254 stdout284/stderr0/exit0 behavior and failing386 stdout0/stderr284/exit0 evidence remain preserved in `/tmp/roster-pr86-scope/briefs/roster-pr86-reviewer-evidence.md`; those are not mislabeled as new260 execution.

No new actionable finding in this two-file correction; raw normalizer input `briefs/roster-pr86-reviewer-findings.json` contains `[]`. Specialist recommendation: **approve this bounded correction**. Open questions: none. This does not assert full canonical review completion or authorize publication.

## Actual own execution

All shell calls started with `rtk`. PATH began supplied `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin`, then `/home/mathias/.cargo/bin:/usr/local/bin:/usr/bin:/bin`, selecting Node22.23.3. Gates ran sequentially in my new own checkout.

| Command | Result |
|---|---|
| `rtk npm ci` | exit0, `/tmp/pr86-reviewer260-ci.log`;8 packages, audit9, zero vulnerabilities |
| `rtk npm run build:ts` | exit0, `/tmp/pr86-reviewer260-build.log` |
| `rtk proxy node --test dist/scripts/extension-cli-arity.test.js dist/scripts/roster-extension.test.js dist/scripts/extension-wrapper-rebuild.test.js` | exit0, **62/62 tests**,0 fail/cancelled/skipped; complete `/tmp/pr86-reviewer260-focused.log`; includes both new executable regressions |
| `rtk proxy node /tmp/pr86-reviewer260-probe.cjs` | exit0; independently asserted four executable stream/exit cases above |
| `git diff --check 38634df HEAD` | exit0 |
| `git status --short` | exit0, empty output; own checkout clean |

Optional esbuild postinstall remains blocked by local npm allowScripts policy; real own build and targeted tests nevertheless pass. Root's separate implementation report `/home/mathias/dev/tezos_observatory/briefs/roster-pr86-help-stream-correction.md` attributes its actual RED→59 targeted and638 full passing tests on260. I read that report; **638 is root execution, not mine**. My full636 and focused172 were executed on386, not260. Per root's explicit bounded-supplement instruction, I did not repeat the full suite on260; do not relabel this supplement as a new complete specialist/full-suite invocation. Prior unused-schema/advisory-cost warnings remain historical passing qualifications; no full260 warnings independently regenerated here.

## Exact read inventory carry-forward

Machine comparison of all45 paths changed against254e36b confirmed **43 byte-identical to my reviewed386 checkout**. The only differing paths are exactly `scripts/extension-cli-arity.test.ts` and `scripts/roster-extension.ts`; both were reread completely without truncation, along with exact two-file diff/stat and HEAD/tree/parent identity. The386 evidence's45-file SHA/range inventory remains applicable to the43 identical blobs; it is not replaced with an unverified current-tree assumption. The new entrypoint/test full reads cover the remaining two paths.

Prior Beta and inherited/syntax-detected ESM closures are preserved by exact byte identity of their implementation and tests; they were not rerun in this narrow supplement. Prior OpenCode API failure remains degraded, never PASS; no new runtime result was fabricated.

Unit complete; slot released promptly for S9 priority. Separate remaining canonical specialists/convergence and exact-candidate QA stay outside this return.
