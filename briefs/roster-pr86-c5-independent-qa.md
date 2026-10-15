# QA Brief — roster-pr86

**Date:** 2026-10-15T05:19:31Z
**Status:** GO ✅
**Round:** 1 (qualifying 0/5)

## Source and independence

Exact candidate c5eaf9836b45ee215bf70dd21d66853a3838f623, tree d3bb4b47bf2bb4a82a8b3d42b8bb4eedaa3a3b09; base254e36b2ef2c0ca5ed65a9606e8689189a26b329, parent4cd0f7800683aa957eaceb50bc84657bb1e2a2aa. Fresh independent QA agent, no prior authorship/review. Detached worktree `/home/mathias/.cache/observatory-review/roster-pr86-qa-c5eaf98`. All executions below are this QA's own; historical results are not counted. Read complete installed roster-qa1.10.0, AGENTS/rules/RTK, harness manifest, canonical review/impl/root-validated qa-scope. Fast mode, current review GO exact source. Source code unchanged; no commits, remote writes or child agents.

All commands used RTK. Node v22.23.3 was prepended to the preserved host PATH. TMPDIR `/home/mathias/.cache/observatory-review/roster-pr86-qa-logs/tmp`. Raw logs and supplemental probe source: `/home/mathias/.cache/observatory-review/roster-pr86-qa-logs/`.

## Round state

Actual lifecycle helper `node scripts/lib/review/review-lifecycle.js --prior briefs/roster-pr86-qa-state.json` returned `{"round":1,"cycle":1,"fresh_cycle":true}` from legitimately absent prior state. GO causes[], qa_no_go_round0, qualifying false. Actual `node scripts/check-qa-convergence.js briefs/roster-pr86-qa-state.json.draft --max-rounds 5` exit0, cause null, warnings[], violations[]. Gated state persisted before this report. Logs11-lifecycle.json/12-convergence.json. No prior QA certification is reused.

## Input/preflight

Both wrapper/helper are files (no executable-bit assumption). Native claims check exit0 fresh, digest f8b28ee754c4e720fd5e4c55696a0162a3a921b36e52454fbd308200ec8de2e9. No roster/roster-pr86/context.manifest.json exists. Actual `TASK=roster-pr86 node .harness/bin/run-hook.js pre roster-qa` exit0/pass, eight steps, no pending LLM steps/warnings. This hook ran after dependency installation/build; native claims and current review were verified before installation. Canonical ignored inputs and historical runtime journal copied byte-identically before hook execution.

## Quality Gates

Sequential gates below all exited0. Durations are measured integer wall seconds using Bash SECONDS.

| Gate | Exact command | Result | Duration | Raw log |
|---|---|---|---|---|
| Clean install | `rtk proxy npm ci` | PASS;8 packages,0 vulnerabilities |1s|01-ci.log|
| Build | `rtk proxy npm run build:ts` | PASS |2s|02-build.log|
| Full tests/validators | `rtk proxy npm test` |640 pass,0 fail,0 skip,42 runner summaries |49s|03-test.log|
| Whitespace | `rtk proxy git diff --check 254e36b2ef2c0ca5ed65a9606e8689189a26b329 HEAD` | PASS |0s|04-diff.log|
| Consumer tests | `rtk proxy node --test scripts/review-bundle-install.test.js scripts/review-bundle.test.js scripts/sync-harness-guard.test.js scripts/chamallaw-shadow-report.test.js scripts/chamallaw-shadow-gate.test.js dist/scripts/extension-cli-arity.test.js` |83 pass,0 fail,0 skip,4 suites |28s|05-focused.log|
| Initialized consumer smoke | `rtk proxy bash scripts/test-chamallaw-roster-install.sh` | PASS |3s|06-smoke.log|
| Generated closure | `rtk proxy node scripts/review-bundle-manifest.js --check` | manifest current |0s|07-manifest.log|

No separate lint npm command is documented. Full npmtest executed the actual structural/catalog/schema/friction/manifest/harness validators. This is not a claim that an absent linter ran. Tests added by QA:0; no regression detected. Focused83 overlap full-suite coverage and are not added to640 as a distinct test count.

## Behaviors independently checked

| Scope item | Actual evidence/outcome |
|---|---|
| ESM installed tools and QA closure | Focused tests actually install CommonJS tools under an ESM consumer; root package bytes unchanged; normalizer/convergence/breaker load; installed QA gate accepts valid state and rejects cap and malformed state; schema/state docs present. PASS. |
| Unrelated ESM semantics | Focused inherited/syntax-detected ESM tests execute Node42 before/after refusal, including force; explicit CommonJS scope positive passes. Harness equivalent refusal/claims execution and phase guards also pass. |
| CommonJS scope custody | Focused preexisting and created-scope/reinstall/upgrade/remove tests pass. Supplemental independent probes export actual2608681 from Git, install its actual bundle then upgrade fromc5 and remove for both preexisting and later-created user-script scenarios. Exact root/scope/script bytes preserved, Node prints42 afterward; installed verify passes before removal. |
| Shared SHA/collision safety | Focused generator/verify tests retain scripts/package.json in generated closure, detect drift and missing files, preserve incompatible scope refusal and installer collision guard. No checker relaxation. |
| Initialized portable friction | Official smoke plus independent four local-core/local-fragment0/1 combinations from fresh developer init. Every combination checks all three runtime shadow projections, complete canonical fragment or selected local fragment exactly once, byte-idempotent reinstall and unchanged override bytes. Fragment-only combination explicitly passes. |
| Flags/required definitions | Every independent combination excludes Pipeline State for phase:null and friction from feedback. Focused isolated-source tests reject missing mandatory friction definition clearly for both core cases. Official smoke tests dry-run, collision refusal, override-byte preservation, force+dry-run and intentional force restoration. |
| Extreme Beta/calibration | Actual focused report/gate tests assert symmetric1e308 mean0.5, Brier0.25, asymmetric extremes, invalid Infinity/NaN/zero/negative rejection; overflow case ineligible for review and promotion not-automated. PASS. |
| Real CLI streams | Focused and independent compiled executable invocations --help/-h exit0 with stdout and empty stderr; absent/bogus usage exit1 with stderr and empty stdout. PASS. |

Supplemental command `rtk proxy node /home/mathias/.cache/observatory-review/roster-pr86-qa-logs/probes.cjs` exit0 in11s. Ten printed assertion groups; raw10-probes.log and probe source preserved. It invokes real installers/sync/compiled CLI and uses scratch consumers, not fabricated tool results.

## Conditional checks

Spec runnable checks: N/A; actual specs/roster-pr86.md absent, as scoped. Existing distribution contracts covered through executed consumer tests. TUI matrix: N/A; no TUI in scope. No task-named FR/spec claims invented.

## Code-intel gate

Actual `node scripts/code-intel-resolve.js gate --timeout 120` exit0: `SKIP: no code-intel block` / `RESULT: skip`. Explicit conditional skip, no gate packs executed. Raw08-code-intel.log.

## Cross-runtime QA

Actual host discovery found `/home/mathias/.opencode/bin/opencode` and `/home/mathias/.local/bin/codex`; host QA runtime is Codex. Actual provider-free command `node scripts/xruntime-review.js opencode --task roster-pr86 --phase qa --check-availability --write` exit0 returned:

```json
{"status":"skipped-degraded","reason":"runtime degraded during review with unchanged runtime version","config_digest":"opencode:3119e8c340bbb323","source":"review-go"}
```

Cross-runtime QA: skipped (review breaker, unchanged runtime version). No retry, prompt wrapper, or human-retry override invoked, per contract. Preserved journal's original source64 attempt has runtime_exit1/API connection error; this is historical degraded evidence and never a successful current-source pass. Journal remains byte-identical to canonical source. Helper emitted a generic briefs-directory-not-ignored warning; actual `git check-ignore` confirms individual canonical task artifacts are ignored. Raw09-runtime.log.

## Warnings and limits

Clean install reports esbuild postinstall blocked by existing allowScripts policy; installation/build/tests and actual hook-runtime verification pass. Full validator emits eight unused enum warnings; initialized developer fixture emits two hooks-target-not-installed warnings for intake/ship. These are actual nonfatal logs, not hidden skips. Timing tool /usr/bin/time was absent before the first npm invocation; replaced with SECONDS, then real clean install executed successfully. Claims and individual input preflight commands returned actual successful results; initial broad inspection output was truncated and needed focused follow-up reads. No source write or artifact modification was inferred from truncated output.

No live MCP mutation, contract call, verified outcome submission or promotion execution; tests use local fixtures. Cross-runtime current-candidate verification remains skipped as above. Source worktree is clean after removal of test-generated untracked Python bytecode; exact HEAD/tree unchanged.

## Verdict

**GO** — exact c5 candidate passes scoped deterministic QA; round1/cycle1, qualifying0/5. Ready for delegated root report validation and subsequent roster-ship human/publication gate. This report does not approve shipping or publication.
