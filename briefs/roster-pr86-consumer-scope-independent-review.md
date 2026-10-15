# PR86 reviewer — exact corrected386

Exact source `38634df6ed5b4bc46531051bb4ef72cbb1c3a364`, tree `a86af58593597aa392e71ed68312730b970e1e6d`, parent `0269b2796b127df03a38748e1e208473490dfabc`; comparison baseline `254e36b2ef2c0ca5ed65a9606e8689189a26b329`. Own detached checkout `/tmp/roster-pr86-reviewer-38634df`. Reviewer specialist only; no pipeline GO/NO-GO, QA, ship, normalization/convergence, central trace or ledger event.

## Findings

One **LOW / confidence5 correctness finding** at `scripts/roster-extension.ts:12`: successful `--help` now prints on stderr. Actual Node22.23.3 current built CLI exits0 with stdout **0 bytes**, stderr **284 bytes**; baseline existing built CLI at independently verified `/tmp/roster-pr86-review-main` HEAD254e36b exits0 with stdout **284 bytes**, stderr **0 bytes**. The baseline checkout was read/executed, not rebuilt or changed in this invocation. Baseline source `scripts/extension/cli.ts:46` explicitly selected console.log for exitCode0; new entry catch always console.error. This is a PR-wide refactor regression already present64/0269, not introduced by386. Help piped/captured through stdout becomes empty. Fix direction: select stdout for successful usage and add a real subprocess stream assertion. Evidence `/tmp/pr86-reviewer386-help.stdout`, `.stderr`, `/tmp/pr86-reviewer386-baseline-help.stdout`, `.stderr`.

Raw normalizer input is `briefs/roster-pr86-reviewer-findings.json` in `/tmp/roster-pr86-scope`; it contains only this raw finding array. No additional evidence-backed security or correctness finding was identified. Recommendation: **approve with this LOW compatibility fix recommended** at specialist level; no pipeline GO is asserted, and root owns disposition. Open questions: none for the reviewed corrections; root paused further PR specialists for S9 priority.

## Actual own gates on386

Every shell began with `rtk`. Runtime PATH started `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin`, followed by `/home/mathias/.cargo/bin:/usr/local/bin:/usr/bin:/bin`, using supplied Node22.23.3. Clean install, build and full suite ran sequentially in this own checkout. Focused tests started only after full suite completion; no overlapping build/full tests in one source tree. Standalone probes install only into their own external fixtures.

| Command | Actual result |
|---|---|
| `rtk npm ci` | exit0, `/tmp/pr86-reviewer386-ci.log` |
| `rtk npm run build:ts` | exit0, `/tmp/pr86-reviewer386-build.log` |
| `rtk npm test` | exit0, complete `/tmp/pr86-reviewer386-test.log`; **636 tests /636 pass /0 fail,cancelled,skipped**, 42 Node runner summaries |
| `rtk proxy node --test scripts/chamallaw-shadow-report.test.js scripts/chamallaw-shadow-gate.test.js scripts/review-bundle-install.test.js scripts/review-bundle.test.js scripts/sync-harness-guard.test.js scripts/phase-guard-hooks.test.js scripts/check-qa-convergence.test.js dist/scripts/check-hook-structure.test.js dist/scripts/roster-extension.test.js dist/scripts/extension-cli-arity.test.js dist/scripts/extension-wrapper-rebuild.test.js` | exit0, `/tmp/pr86-reviewer386-focused.log`; **172 tests /172 pass /0 fail,cancelled,skipped**; includes all six shadow report/gate tests and all28 installer tests |
| `rtk proxy bash scripts/test-chamallaw-roster-install.sh` | exit0, `/tmp/pr86-reviewer386-installer.log`; real install/idempotency/dry-run consumer smoke |
| `rtk proxy node /tmp/pr86-reviewer386-scope.cjs` | exit0, `/tmp/pr86-reviewer386-scope.log`; independent actual before/install/after subprocess probes below |
| `rtk proxy node /tmp/pr86-reviewer386-calibration.cjs` | exit0, `/tmp/pr86-reviewer386-calibration.log`; actual-module extremes plus original independent gate fixture |
| Current built extension `--help` with stdout/stderr captures | exit0, stdout0/stderr284; LOW finding above |
| Existing baseline built extension `--help` with stdout/stderr captures | exit0, stdout284/stderr0; exact baseline HEAD independently checked |

Local npm policy blocks optional esbuild postinstall; real build/full/focused gates still execute and pass. Eight passing unused-schema-value warnings and absent advisory cost log remain qualified. Full final catalog/manifest/friction/projection checks pass. No nonexistent npm build/check/e2e scripts were substituted. Earlier review/QA reports are historical evidence only and are not counted as this execution.

## Independent closures

The prior MEDIUM ESM scope finding is **closed on386**, not OPEN. The real installer now protects undeclared scope regardless of target root package (`scripts/review-bundle-install.sh:202-213`), matching existing harness protection. Both original fixture patterns were recreated independently with unchanged user scripts:

| Fixture pattern | Before | Ordinary installation / after | `--force` installation / after |
|---|---:|---:|---:|
| Target package absent, nearest ancestor explicitly type:module; `/tmp/pr86-reviewer386-scope-nrdLFx/consumer` | 0 | 1 refusal /0 | 1 refusal /0 |
| No package in fixture ancestors; Node22 syntax-detected ESM; `/tmp/pr86-reviewer386-scope-Ak002P/consumer` | 0 | 1 refusal /0 | 1 refusal /0 |
| Root ESM with explicit matching scripts/package.json CommonJS; `/tmp/pr86-reviewer386-scope-XvPqx7/consumer` | 0 | 0 install /0 | 0 install /0 |

All probe assertions require unchanged script bytes; refused cases require no scripts/package.json created; every after-execution prints42. Inheritance and Node22 syntax detection remain distinct cases. Explicit scopes retain ordinary collision rules. Existing installed QA gate tests execute success/cap/malformed states with dependency/schema closure; bundle verifier/review modules/claims reconciler and conflicting scope tests run as real subprocesses. No new module resolver or dependency was introduced.

The Beta overflow finding remains **closed**. Direct actual-module assertions cover symmetric MIN_VALUE,1e-308,1,1e308,MAX_VALUE (all0.5), ordinary/asymmetric/extreme finite pairs and complements, invalid zero/negative/NaN/Infinity/malformed values. Original fixture `/tmp/roster-pr86-linear/briefs/roster-pr86-beta-fixture` with original config returns Brier0.25, ineligible for human review, promotion not-automated. All six source report/gate regressions pass. No parameter ceiling invented.

## Source coverage and scope

The explicit45-file inventory below combines fully observed reads in this same reviewer session with bounded follow-up reads that complete all formerly truncated/missing regions.41 files are byte-identical between own0269 and own386; only four changed files required new content review. Where prior complete reads are reused, byte equality is checked, not assumed. The prior0269 report's incomplete full-file claim is superseded only by the completed missing reads and inventory here; prior truncated output alone is never treated as coverage. Source authority remains canonical files, not projections.

Own canonical manifest was read; Claude manifest repeated combined read truncated, so a standalone full559-line Claude manifest read repaired that gap. Generated feedback/shadow projections were each read in full for Codex, Claude and OpenCode. Long extension tests were reread in1-300,301-570,571-813 chunks. Sync first1-200,201-350 were completed; unchanged prior351-680 and681-1032 chunks had been fully visible. Current installer is fully read1-297. Current installer tests1-200 fully read; current201-648 equals byte-for-byte prior159-606, which had been fully read in two bounded previous calls. Bundle generator, manifest and unit tests were reread in full. Hook linter had prior complete1-240 and241-481 chunks. All remaining unchanged short files had complete visible reads earlier in this same session; inventory identifies them explicitly.

Read installed role and dispatch contract, applicable AGENTS/rules/TypeScript patterns, implementation brief and correction evidence. Historical conflict review/QA and Beta evidence remain attributed to their own revisions. Existing prior OpenCode runtime failure remains **degraded**, never PASS; no rerun, no fabricated386 second-runtime success. Fast mode excludes the Full-mode scope-manifest gate; assessed scope against implementation brief and complete changed-file set. No source edits, subagents, remote mutation, dependency selection, index update or central state changes occurred.

S9 priority instruction arrived after own gates: finish this bounded386 unit and hand off promptly; no additional broad research or PR specialist launch. Removed only test-generated untracked Python bytecode. Final own status is empty; exact HEAD/tree as above. Required separate canonical specialists/convergence and fresh QA remain outside this invocation.

## Explicit changed-file read inventory

| File | Lines | Full read coverage | SHA256 |
|---|---:|---|---|
| `.agents/skills/chamallaw-feedback/.roster-managed` | 0 | empty file verified (0 bytes) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `.agents/skills/chamallaw-feedback/SKILL.md` | 153 | 1-153 current complete generated-file read | `7c25ac7efbb706c78da6e4867b3162e8b8c4c88189c5eecec3b8429cf10533bf` |
| `.agents/skills/chamallaw-shadow/.roster-managed` | 0 | empty file verified (0 bytes) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `.agents/skills/chamallaw-shadow/SKILL.md` | 213 | 1-213 current complete generated-file read | `11724e26006cc6dc82e6940b9acdced477b10e2efaf249894c0496fd6bd18357` |
| `.claude/commands/chamallaw-feedback.md` | 153 | 1-153 current complete generated-file read | `7c25ac7efbb706c78da6e4867b3162e8b8c4c88189c5eecec3b8429cf10533bf` |
| `.claude/commands/chamallaw-shadow.md` | 213 | 1-213 current complete generated-file read | `11724e26006cc6dc82e6940b9acdced477b10e2efaf249894c0496fd6bd18357` |
| `.claude/harness.json` | 559 | 1-559 standalone (repairs combined truncation) | `e8844e381ed8551e2cd52327252c64f668865079e480304d722f95ffe4d20d25` |
| `.harness/bin/package.json` | 3 | 1-3 fully visible earlier in same session; exact bytes revalidated unchanged | `8005a3491db7d92f36ac66369861589f9c47123d3a7c71e643fc2c06168cd45a` |
| `.harness/harness.json` | 559 | 1-559 complete canonical manifest | `e8844e381ed8551e2cd52327252c64f668865079e480304d722f95ffe4d20d25` |
| `.opencode/skills/chamallaw-feedback/.roster-managed` | 0 | empty file verified (0 bytes) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `.opencode/skills/chamallaw-feedback/SKILL.md` | 153 | 1-153 current complete generated-file read | `7c25ac7efbb706c78da6e4867b3162e8b8c4c88189c5eecec3b8429cf10533bf` |
| `.opencode/skills/chamallaw-shadow/.roster-managed` | 0 | empty file verified (0 bytes) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `.opencode/skills/chamallaw-shadow/SKILL.md` | 213 | 1-213 current complete generated-file read | `11724e26006cc6dc82e6940b9acdced477b10e2efaf249894c0496fd6bd18357` |
| `AGENTS.md` | 241 | 1-241 fully visible earlier in same session; exact bytes revalidated unchanged | `ad38b52220ec75e6a37a3a6011f74812d1d6653e15f92300136571717b8105be` |
| `docs/agents.md` | 237 | 1-237 fully visible earlier in same session; exact bytes revalidated unchanged | `b4d04c0816a1188f849f7e63f6aec883ef4ee61653fd461eb5a654bdf6217ffe` |
| `docs/chamallaw-roster.md` | 73 | 1-73 fully visible earlier in same session; exact bytes revalidated unchanged | `4674802e262e1fc79cf4fd82c760113cb73eb70560ca0f20266aa212cd9ea764` |
| `examples/chamallaw-shadow-evaluation.json` | 14 | 1-14 fully visible earlier in same session; exact bytes revalidated unchanged | `3f9f880457c4a51dc617206df2b5f268aa03216f814a1b7c21adce996ec30c73` |
| `package.json` | 52 | 1-52 fully visible earlier in same session; exact bytes revalidated unchanged | `51069e495687d2ca2d4930d416824df7643bac30e84e7cef06f344625f3e5c49` |
| `scripts/REVIEW-BUNDLE.md` | 55 | 1-55 now | `c7b19c66c5fc3c7c099ee51f52834ebda42113b3f2fc1532dd4bd49c79877035` |
| `scripts/chamallaw-shadow-gate.js` | 90 | 1-90 fully visible earlier in same session; exact bytes revalidated unchanged | `d72582040b2a88dca21a74bb9eb097541888e2e5ebc19df294a90b05c7538575` |
| `scripts/chamallaw-shadow-gate.test.js` | 81 | 1-81 fully visible earlier in same session; exact bytes revalidated unchanged | `a743fcc32b992dfb604c23ce0887ebd793414afbebfde8199a158a463a6f1344` |
| `scripts/chamallaw-shadow-report.js` | 110 | 1-110 fully visible earlier in same session; exact bytes revalidated unchanged | `dec46a544e3db27d0ccd5a964f588cc99b1c7304b56b914729642ea14638908c` |
| `scripts/chamallaw-shadow-report.test.js` | 92 | 1-92 fully visible earlier in same session; exact bytes revalidated unchanged | `43377abe42aebb514b216e47ef708cd41fe2a306ea2daa3bef1fcc123af94c48` |
| `scripts/check-hook-structure.test.ts` | 112 | 1-112 fully visible earlier in same session; exact bytes revalidated unchanged | `117548d43d67eb225c12bb5d22f1305059f853f0ce2604aec05e311f0c0e877a` |
| `scripts/check-hook-structure.ts` | 481 | identical prior1-240,241-481 complete bounded reads | `57f56baa7067f7cb95e5f3b25e346793ea0bb8acddce491f8ede100a01d32cc3` |
| `scripts/extension-cli-arity.test.ts` | 75 | 1-75 fully visible earlier in same session; exact bytes revalidated unchanged | `8ebe6d9f4cd1fa867112ee29f22746c3c001b4da6eaa744109328f0c87cdc753` |
| `scripts/extension-wrapper-rebuild.test.ts` | 35 | 1-35 fully visible earlier in same session; exact bytes revalidated unchanged | `b33004e8d93d6c6650f08c7a6e1bf4c6761f1a3273982216b94c49ffcd49d02b` |
| `scripts/extension/cli.ts` | 418 | 1-418 fully visible earlier in same session; exact bytes revalidated unchanged | `ecdda067f1861163147fa888e659610c39c6e1dd8ab2c89d6e3d03fb1981caf1` |
| `scripts/install-chamallaw-roster.sh` | 103 | 1-103 fully visible earlier in same session; exact bytes revalidated unchanged | `ef096f445bbbac90fe9b36a5950d5b6e5105338a31a671f3cc2d937a2b95f226` |
| `scripts/lib/bundle/review-bundle-check.js` | 132 | 1-132 fully visible earlier in same session; exact bytes revalidated unchanged | `5fc184a06e1b0aded514b3feccd17a44e1283593bf50f4597c50af14bb0cda7a` |
| `scripts/package.json` | 3 | 1-3 fully visible earlier in same session; exact bytes revalidated unchanged | `8005a3491db7d92f36ac66369861589f9c47123d3a7c71e643fc2c06168cd45a` |
| `scripts/review-bundle-install.sh` | 297 | 1-297 now | `2f26b9b4b3b45f38b79b6814299dda3e4aa866cc7581e5ba6f77642aaf1a17a8` |
| `scripts/review-bundle-install.test.js` | 648 | 1-200 now;201-648 verified equal to fully read prior159-606 | `341cf10bc519141a4ec4acaca19f85b71be440992defafab2d554543767a9828` |
| `scripts/review-bundle-manifest.js` | 156 | 1-156 now | `8039fe0ee6b77500a7b9fbad210e945308fa17c83f1b75a6bdec18d54ebbead7` |
| `scripts/review-bundle.manifest.json` | 128 | 1-128 now | `9f387ea58fad7f14a3f1e57ae3bdfc80377b55fb952c9d8b79202bb99cbe8382` |
| `scripts/review-bundle.test.js` | 216 | 1-216 now | `26a388fe338f9555dec76410d8617e75c1e053e2c7077fafc200f6d161c3a132` |
| `scripts/roster-extension.test.ts` | 813 | 1-300,301-570,571-813 now | `2baee29c70cf7570006282c76acdea72f8b214bb8f0eeb0edb223fd1386d60fd` |
| `scripts/roster-extension.ts` | 15 | 1-15 now numbered | `dd9df664cd8b02d2e357073cab719828dacf5827223a8b003825f60134d2f5f6` |
| `scripts/sync-harness-guard.test.js` | 267 | identical prior1-260,261-267 complete bounded reads | `8f169898ca9de11efd18751fed59f6c498124ce9f9aeb9e2cb60108fade50832` |
| `scripts/sync-harness.sh` | 1032 | 1-200,201-350 now; identical prior351-680,681-1032 fully visible | `8874c59fe56ae59d848f80097b452e7016e886e03ebf77d950bb9b109645176c` |
| `scripts/test-chamallaw-roster-install.sh` | 35 | 1-35 fully visible earlier in same session; exact bytes revalidated unchanged | `1a0cc9003a43bb676178fc35ea262605758be3fc1255a51080ff4d10568f517a` |
| `skills/workflow/chamallaw-feedback.md` | 100 | 1-100 fully visible earlier in same session; exact bytes revalidated unchanged | `0142356b6afc32fb3f27610e226a3e0219495f175754add1c9813f8733aaf8b4` |
| `skills/workflow/chamallaw-shadow.md` | 160 | 1-160 fully visible earlier in same session; exact bytes revalidated unchanged | `143902ca997903cc082600901faa11991c774197bf3918b2f1dd18c990d9de9a` |
| `templates/chamallaw-roster/roster-intake-post.md` | 22 | 1-22 fully visible earlier in same session; exact bytes revalidated unchanged | `acc0003866d0aa318e82f3cfb25e4d061046f9c2509fc8aee4fa040012ac5172` |
| `templates/chamallaw-roster/roster-ship-post.md` | 21 | 1-21 fully visible earlier in same session; exact bytes revalidated unchanged | `cc9e0ba4972c93eb2fdab02e26dd1cc977aa598618fc3b9da3dd5dc52ee77a1b` |

Final `git diff --check 254e36b HEAD` and `git status --short` exited0; status output empty. Numbered successful-help parser branch verified at `scripts/extension/cli.ts:90`. An extra numbered CLI dump was truncated but was not counted as source coverage; the prior complete same-blob CLI read remains the inventory basis.
