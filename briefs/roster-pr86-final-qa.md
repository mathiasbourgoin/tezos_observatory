# Independent final PR86 QA

Result: **pass / scoped GO** for exact candidate `64f5e278b2e04e6d10d3a77e2ac98dbf0ffeb0e8`. Independent detached worktree: `/tmp/roster-pr86-final-qa`; no mutable owner files used as evidence.

## Identity and policy

`git rev-parse HEAD HEAD^{tree} d3d449fc5900c71b34eb8443fefa3b4fab076f0f^{tree}` returns the candidate and identical tree hashes `d301ad376cb8c002c7b7bdb13bd620bddc409dec`. `git diff --exit-code d3d449fc5900c71b34eb8443fefa3b4fab076f0f HEAD` exits 0. `git show -s --format=%P HEAD` returns sole parent `254e36b2ef2c0ca5ed65a9606e8689189a26b329`; `git rev-list --count 254e36b..HEAD` returns 1, and `git rev-list --merges 254e36b..HEAD` is empty. `git diff --check 254e36b HEAD` exits 0. This verifies exact source/tree equivalence and rebase-only compatible ancestry.

## Independently executed gates

All shell calls used `rtk`, with raw commands through `rtk proxy`. Runtime PATH begins `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin`; actual versions: Node v22.23.3, npm 12.0.2. Commands below each exited 0.

| Command | Evidence |
|---|---|
| `npm ci` | Clean install, 8 packages, audit 9 packages, zero vulnerabilities; `/tmp/pr86-finalqa-ci.log` |
| `npm run build:ts` | Actual upstream TypeScript build; `/tmp/pr86-finalqa-build.log` |
| `npm test` | Full actual upstream chain: 42 Node runner summaries, 634 tests, 634 pass, 0 fail/cancelled/skipped. Runtime pretest plus all subsequent structure, catalog, friction, manifest, registry and projection gates pass; `/tmp/pr86-finalqa-full.log` |
| `node --test scripts/claims-reconcile.test.js scripts/review-bundle-install.test.js scripts/check-qa-convergence.test.js scripts/sync-harness-guard.test.js scripts/phase-guard-hooks.test.js scripts/chamallaw-shadow-report.test.js scripts/chamallaw-shadow-gate.test.js` | 96/96 tests, 0 fail/cancelled/skipped; `/tmp/pr86-finalqa-focused.log` |
| `bash scripts/test-chamallaw-roster-install.sh` | Real temporary consumer install and idempotency smoke pass; `/tmp/pr86-finalqa-installer.log` |

Focused actual subprocess fixtures cover installed ESM claims execution, review bundle tools without root-package mutation, QA convergence dependency/schema closure and successful/capped/malformed states, rejection of conflicting consumer scopes and unrelated ESM scripts, phase guards and Chamallaw report/gate behavior. Full suite retains both phase-guard and Chamallaw tests. Catalog reports 27 agents/39 skills/7 rules; friction reports 41 files; skill manifest reports 42 current skills; final projections match canonical harness.

Read upstream AGENTS.md, upstream applicable human-validation/code-quality/RTK rules, RTK instructions and assigned QA skill. No nested scripts AGENTS.md exists. An initial rule read used nonexistent `rules/style/code-quality.md` (exit 1); corrected actual `rules/common/code-quality.md` read exits 0. No deterministic check failed.

## Limits and cleanup

Local npm policy blocks esbuild optional postinstall; existing checked-in hook runtime check and TypeScript/full test gates nevertheless pass. Eight schema unused-value warnings and absent advisory cost log are reported by upstream passing checks. No hypothetical build/check/e2e scripts were substituted: this upstream repository supplies `build:ts` and `npm test`.

Only test-created untracked `extensions/arch-index/__pycache__/` was removed. Final `git status --short` is empty; no code changes, generated changes, push, merge, deployment, dependency selection, index modification or subagents. This verdict covers PR86 candidate QA only, not Observatory-wide quality or publication authorization.
