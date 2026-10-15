# PR86 architect — exact260 completed specialist evidence

Exact candidate: `2608681b9062b0d9d8929755a1c0b59282dffecf`, expected tree `496016e268fe54d7a50c28e65032d254ee98ce5f`. Own detached checkout `/tmp/roster-pr86-architect-2608681`, created from `/tmp/roster-pr86-help`. No source fix, commit, fetch, remote write, QA verdict or central trace event.

## Concrete finding

HIGH / important warning: the new module-scope manifest entry transfers a byte-identical preexisting consumer `scripts/package.json` into removable bundle custody. On removal, an unrelated preserved CommonJS script becomes ESM and fails. This is a newly encountered defect of the module-scope addition, separate from the corrected install-time inherited/syntax-detected ESM issue.

Exact260 locations: `scripts/review-bundle-manifest.js:95` adds the config as a non-shared entry; `scripts/review-bundle-install.sh:218` accepts matching preexisting content; `scripts/review-bundle-install.sh:175` deletes the matching scope. Existing positive fixture `scripts/review-bundle-install.test.js:79` permits unrelated scripts under the explicit compatible scope, but does not remove afterward.

Completed independent reproduction under Node22.23.3, consumer `/tmp/pr86-architect-custody-De1Md2`:

1. Root package `{"type":"module"}`, preexisting `scripts/package.json` copied byte-for-byte from exact260, unrelated `scripts/user.js` containing `module.exports=42; console.log(module.exports);`.
2. `node scripts/user.js`: exit0, stdout `42`.
3. Exact260 external installer `install --from-checkout /tmp/roster-pr86-architect-2608681 --target <consumer>`: exit0, 28 files installed.
4. `node scripts/user.js`: exit0, stdout `42`.
5. Exact260 external installer `remove --target <consumer>`: exit0; shared wrapper kept; scope is deleted.
6. `node scripts/user.js`: exit1, `ReferenceError: module is not defined in ES module scope`, Node v22.23.3; unrelated script unchanged.

Root and canonical coordinator informed immediately. Preserve compatible consumer package scope during removal and add lifecycle coverage. Overall architecture risk at least medium pending adjudication; no whole-pipeline GO is asserted.

## Actual own gates

All execute in the own detached checkout through `rtk proxy env PATH=/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin:/home/mathias/.cargo/bin:/usr/local/bin:/usr/bin:/bin`.

- `npm ci`: exit0. `/tmp/pr86-architect260-ci.log`. esbuild@0.25.6 optional postinstall blocked by allowScripts; qualified warning, build subsequently passes.
- `npm run build:ts`: exit0. `/tmp/pr86-architect260-build.log`.
- `npm test`: exit0. `/tmp/pr86-architect260-full.log`. Actual 42 anchored `# tests` runner groups sum to 638 tests, all 42 `# fail` and `# skipped` counts zero. Included deterministic catalog/schema/manifest/projection gates pass; 8 schema unused-value warnings remain qualified, cost capture advisory absent.
- `node --test scripts/review-bundle-install.test.js scripts/review-bundle.test.js scripts/sync-harness-guard.test.js scripts/chamallaw-shadow-report.test.js scripts/chamallaw-shadow-gate.test.js dist/scripts/extension-cli-arity.test.js dist/scripts/extension-wrapper-rebuild.test.js`: exit0, **82/82 tests**, zero fail/cancelled/skipped; `/tmp/pr86-architect260-focused.log`. Includes all28 installer cases, installed QA success/cap/malformed schema/dependency closure, explicit/higher-ancestor/syntax-detected ESM cases with and without force, harness claims execution/conflicting scopes, six shadow report/gate cases, compiled successful --help/-h and absent/malformed failure streams, wrapper static checks.
- `bash scripts/test-chamallaw-roster-install.sh`: exit0; real install/idempotency/dry-run smoke; `/tmp/pr86-architect260-installer.log`.
- Direct actual-module calibration assertions: exit0;14 extreme/ordinary/invalid parameter cases plus original independent consumer fixture/config. `/tmp/pr86-architect260-calibration.log`: Brier0.25, ineligible, promotion not-automated. Beta correction independently closed.
- Actual custody reproduction repeated and captured completely at `/tmp/pr86-architect260-custody.log`; second retained consumer `/tmp/pr86-architect-custody-WcfbMA`; before/install/during/remove/after exits **0/0/0/0/1**, confirming the first fixture above.
- `git diff --check 254e36b HEAD`: exit0. Exact own HEAD/tree independently confirmed; final status clean after deleting only test-generated untracked Python bytecode.

## Read coverage / limits

Completed mandatory independent full45-file read and appended full254..260 diff read. Dispatch SHA256 independently verified `6d14610ca23efa21f9cd5846636c363ab590ce6d92949eb8e10c5f01f1ed94af`. Its complete1-3495 read was repaired by bounded followups:1-240, then241-390 through3391-3495 in150-line chunks. Initial truncated combined output was not counted. No prior specialist read/execution is counted as mine. Read own AGENTS.md, all six installed rules, TypeScript patterns, both harness manifests559 lines in four chunks each, canonical architect role supplied in dispatch, implementation brief, all requested historical correction/reviewer/QA reports with their revision-limited attribution. No kb/architecture.md or specs/roster-pr86.md exists; existing KB projections contain no architecture constraints. Existing distribution spec identifies shared files as the mechanism for retaining dual-owned resources; I do not infer a new framework requirement.

All45 source files were inspected independently in this invocation; long files use150-line chunks (short terminal chunks below). Some early reads exceeded150 lines but returned completely; bounded followups repaired those. A later combined repeated read was truncated; affected installer1-297 and sync guard1-150 chunks were reread without truncation, rather than counted from that output. Explicit inventory follows. Generated runtime files were read as synchronization projections, with authority retained in canonical source. Full suite independently confirms catalog, manifest, hook runtime and projection synchronization.

Critical findings: none established. Important warnings: one HIGH custody defect above, requiring correction/adjudication. Optional improvements: none asserted. Overall architecture risk: **medium** because accepted consumer scripts break after a successful bundle removal. Remaining changed code uses established installer, package scopes, source/projection generators and existing test infrastructure. No new architectural framework/dependency is needed. Existing large files (sync1032, extension tests813, installer tests648) remain above the500-line threshold, but the underlying large responsibilities predate this diff; no separate speculative size/style finding is asserted. The41-line test CLI adapter duplicates presentation but does not establish a further reproduced behavioral defect.

Known install-time ESM and Beta findings are independently closed by actual focused cases; successful help closure is verified through four compiled executable scenarios. This finding concerns a separate successful removal lifecycle, and does not reopen those corrections. No source changes, central trace, ledger, normalization, convergence, QA or pipeline GO. Historical OpenCode attempt remains degraded/API unavailable, not a new successful runtime review. Fast mode Full-scope-manifest gate was not run. This return covers exact260 only; any correction requires appropriate new-candidate verification.

Process qualification: the initial RTK instructions/dispatch reads used plain cat before reading the RTK rule; subsequent shell calls used rtk. No claim of perfect command-prefix compliance is made for those initial two reads.

## Shared mechanism adjudication before correction authorship

Read complete existing `specs/review-tool-distribution.md`1-199. Clarification C-7 at26 and FR123..137 at63 define skip-shared removal; F-5 at122-124 explicitly states shared affects removal only while verification still checks all presence/digests. Exact260 installer170 skips shared before deletion175; upgrade249 skips shared orphans. Therefore marking the module scope shared in the generator would preserve both a preexisting compatible scope and one originally created by the bundle, without a second ownership system. It intentionally leaves a CommonJS package boundary after bundle removal, as the existing shared wrapper also remains. That residual scope must be documented explicitly; collisions and SHA verification remain unchanged. This is a source-grounded correction direction, not a new-candidate execution or self-review.

Root assigned me implementation of this finding only after this independent260 review unit completed. Any forthcoming correction makes me its author and needs separate independent review; no correction is covered by this260 evidence.

## Independent complete read inventory

| Path | Lines | Inspected coverage | Exact260 SHA256 |
|---|---:|---|---|
| `.agents/skills/chamallaw-feedback/.roster-managed` | 0 | empty; verify0 bytes independently inspected | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `.agents/skills/chamallaw-feedback/SKILL.md` | 153 | 1-150, 151-153 independently inspected | `7c25ac7efbb706c78da6e4867b3162e8b8c4c88189c5eecec3b8429cf10533bf` |
| `.agents/skills/chamallaw-shadow/.roster-managed` | 0 | empty; verify0 bytes independently inspected | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `.agents/skills/chamallaw-shadow/SKILL.md` | 213 | 1-150, 151-213 independently inspected | `11724e26006cc6dc82e6940b9acdced477b10e2efaf249894c0496fd6bd18357` |
| `.claude/commands/chamallaw-feedback.md` | 153 | 1-150, 151-153 independently inspected | `7c25ac7efbb706c78da6e4867b3162e8b8c4c88189c5eecec3b8429cf10533bf` |
| `.claude/commands/chamallaw-shadow.md` | 213 | 1-150, 151-213 independently inspected | `11724e26006cc6dc82e6940b9acdced477b10e2efaf249894c0496fd6bd18357` |
| `.claude/harness.json` | 559 | 1-150, 151-300, 301-450, 451-559 independently inspected | `e8844e381ed8551e2cd52327252c64f668865079e480304d722f95ffe4d20d25` |
| `.harness/bin/package.json` | 3 | 1-3 independently inspected | `8005a3491db7d92f36ac66369861589f9c47123d3a7c71e643fc2c06168cd45a` |
| `.harness/harness.json` | 559 | 1-150, 151-300, 301-450, 451-559 independently inspected | `e8844e381ed8551e2cd52327252c64f668865079e480304d722f95ffe4d20d25` |
| `.opencode/skills/chamallaw-feedback/.roster-managed` | 0 | empty; verify0 bytes independently inspected | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `.opencode/skills/chamallaw-feedback/SKILL.md` | 153 | 1-150, 151-153 independently inspected | `7c25ac7efbb706c78da6e4867b3162e8b8c4c88189c5eecec3b8429cf10533bf` |
| `.opencode/skills/chamallaw-shadow/.roster-managed` | 0 | empty; verify0 bytes independently inspected | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `.opencode/skills/chamallaw-shadow/SKILL.md` | 213 | 1-150, 151-213 independently inspected | `11724e26006cc6dc82e6940b9acdced477b10e2efaf249894c0496fd6bd18357` |
| `AGENTS.md` | 241 | 1-150, 151-241 independently inspected | `ad38b52220ec75e6a37a3a6011f74812d1d6653e15f92300136571717b8105be` |
| `docs/agents.md` | 237 | 1-150, 151-237 independently inspected | `b4d04c0816a1188f849f7e63f6aec883ef4ee61653fd461eb5a654bdf6217ffe` |
| `docs/chamallaw-roster.md` | 73 | 1-73 independently inspected | `4674802e262e1fc79cf4fd82c760113cb73eb70560ca0f20266aa212cd9ea764` |
| `examples/chamallaw-shadow-evaluation.json` | 14 | 1-14 independently inspected | `3f9f880457c4a51dc617206df2b5f268aa03216f814a1b7c21adce996ec30c73` |
| `package.json` | 52 | 1-52 independently inspected | `51069e495687d2ca2d4930d416824df7643bac30e84e7cef06f344625f3e5c49` |
| `scripts/REVIEW-BUNDLE.md` | 55 | 1-55 independently inspected | `c7b19c66c5fc3c7c099ee51f52834ebda42113b3f2fc1532dd4bd49c79877035` |
| `scripts/chamallaw-shadow-gate.js` | 90 | 1-90 independently inspected | `d72582040b2a88dca21a74bb9eb097541888e2e5ebc19df294a90b05c7538575` |
| `scripts/chamallaw-shadow-gate.test.js` | 81 | 1-81 independently inspected | `a743fcc32b992dfb604c23ce0887ebd793414afbebfde8199a158a463a6f1344` |
| `scripts/chamallaw-shadow-report.js` | 110 | 1-110 independently inspected | `dec46a544e3db27d0ccd5a964f588cc99b1c7304b56b914729642ea14638908c` |
| `scripts/chamallaw-shadow-report.test.js` | 92 | 1-92 independently inspected | `43377abe42aebb514b216e47ef708cd41fe2a306ea2daa3bef1fcc123af94c48` |
| `scripts/check-hook-structure.test.ts` | 112 | 1-112 independently inspected | `117548d43d67eb225c12bb5d22f1305059f853f0ce2604aec05e311f0c0e877a` |
| `scripts/check-hook-structure.ts` | 481 | 1-150, 151-300, 301-450, 451-481 independently inspected | `57f56baa7067f7cb95e5f3b25e346793ea0bb8acddce491f8ede100a01d32cc3` |
| `scripts/extension-cli-arity.test.ts` | 97 | 1-97 independently inspected | `9396f7e60177d683ce808a393d037a81bfc6122ac64364d47a47f45e55824c0e` |
| `scripts/extension-wrapper-rebuild.test.ts` | 35 | 1-35 independently inspected | `b33004e8d93d6c6650f08c7a6e1bf4c6761f1a3273982216b94c49ffcd49d02b` |
| `scripts/extension/cli.ts` | 418 | 1-150, 151-300, 301-418 independently inspected | `ecdda067f1861163147fa888e659610c39c6e1dd8ab2c89d6e3d03fb1981caf1` |
| `scripts/install-chamallaw-roster.sh` | 103 | 1-103 independently inspected | `ef096f445bbbac90fe9b36a5950d5b6e5105338a31a671f3cc2d937a2b95f226` |
| `scripts/lib/bundle/review-bundle-check.js` | 132 | 1-132 independently inspected | `5fc184a06e1b0aded514b3feccd17a44e1283593bf50f4597c50af14bb0cda7a` |
| `scripts/package.json` | 3 | 1-3 independently inspected | `8005a3491db7d92f36ac66369861589f9c47123d3a7c71e643fc2c06168cd45a` |
| `scripts/review-bundle-install.sh` | 297 | 1-150, 151-297 independently inspected | `2f26b9b4b3b45f38b79b6814299dda3e4aa866cc7581e5ba6f77642aaf1a17a8` |
| `scripts/review-bundle-install.test.js` | 648 | 1-150, 151-300, 301-450, 451-600, 601-648 independently inspected | `341cf10bc519141a4ec4acaca19f85b71be440992defafab2d554543767a9828` |
| `scripts/review-bundle-manifest.js` | 156 | 1-150, 151-156 independently inspected | `8039fe0ee6b77500a7b9fbad210e945308fa17c83f1b75a6bdec18d54ebbead7` |
| `scripts/review-bundle.manifest.json` | 128 | 1-128 independently inspected | `9f387ea58fad7f14a3f1e57ae3bdfc80377b55fb952c9d8b79202bb99cbe8382` |
| `scripts/review-bundle.test.js` | 216 | 1-150, 151-216 independently inspected | `26a388fe338f9555dec76410d8617e75c1e053e2c7077fafc200f6d161c3a132` |
| `scripts/roster-extension.test.ts` | 813 | 1-150, 151-300, 301-450, 451-600, 601-750, 751-813 independently inspected | `2baee29c70cf7570006282c76acdea72f8b214bb8f0eeb0edb223fd1386d60fd` |
| `scripts/roster-extension.ts` | 18 | 1-18 independently inspected | `17a8a852d350b4a8f9f6c6bffdf72950faf7a2708e6c79e5b66b548c1d48e552` |
| `scripts/sync-harness-guard.test.js` | 267 | 1-150, 151-267 independently inspected | `8f169898ca9de11efd18751fed59f6c498124ce9f9aeb9e2cb60108fade50832` |
| `scripts/sync-harness.sh` | 1032 | 1-150, 151-300, 301-450, 451-600, 601-750, 751-900, 901-1032 independently inspected | `8874c59fe56ae59d848f80097b452e7016e886e03ebf77d950bb9b109645176c` |
| `scripts/test-chamallaw-roster-install.sh` | 35 | 1-35 independently inspected | `1a0cc9003a43bb676178fc35ea262605758be3fc1255a51080ff4d10568f517a` |
| `skills/workflow/chamallaw-feedback.md` | 100 | 1-100 independently inspected | `0142356b6afc32fb3f27610e226a3e0219495f175754add1c9813f8733aaf8b4` |
| `skills/workflow/chamallaw-shadow.md` | 160 | 1-150, 151-160 independently inspected | `143902ca997903cc082600901faa11991c774197bf3918b2f1dd18c990d9de9a` |
| `templates/chamallaw-roster/roster-intake-post.md` | 22 | 1-22 independently inspected | `acc0003866d0aa318e82f3cfb25e4d061046f9c2509fc8aee4fa040012ac5172` |
| `templates/chamallaw-roster/roster-ship-post.md` | 21 | 1-21 independently inspected | `cc9e0ba4972c93eb2fdab02e26dd1cc977aa598618fc3b9da3dd5dc52ee77a1b` |
