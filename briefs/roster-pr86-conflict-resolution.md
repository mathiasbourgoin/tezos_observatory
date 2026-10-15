# Roster PR 86 local conflict resolution

PR: https://github.com/mathiasbourgoin/roster/pull/86

## Exact refs and isolation

- Published PR head: `7f78adff66417f64156ba06bf403993d34a42833`.
- Fetched upstream main: `254e36b2ef2c0ca5ed65a9606e8689189a26b329`.
- Local nonrewriting merge: `8fadb20c99e8358e96a4626117bf3ae7ea453e3d` (parents are those two refs).
- Catalog fix: `0dced565ff84b005c0b09a89778b0413deee4339`.
- Friction fix: `8030c1642c9469d070b015aae62beefeecba0c59`.
- Final candidate / manifest fix: `d3d449fc5900c71b34eb8443fefa3b4fab076f0f`.
- Branch/worktree: `fix/pr86-conflict`, `/tmp/roster-pr86-resolution`.
- Exact main baseline: `/tmp/roster-pr86-main-baseline`, detached at fetched main.
- Existing `/tmp/roster-esm-consumer-runtime` remained clean and unchanged. No push, publication, remote merge, reset or history rewrite occurred.

## Resolution and scope

Only `package.json` conflicted. Its test command now retains upstream `phase-guard-hooks.test.js` and both PR Chamallaw test commands. All other upstream changes merged mechanically. Upstream does not contain the installed-consumer CommonJS package scopes or QA bundle closure changes; these remain necessary.

The PR contains earlier Chamallaw commits as well as CJS/ESM and QA closure commits. Current upstream main passes its full suite, so three PR-owned gate failures were corrected with root authorization:

- `docs/agents.md`: count 39 and two missing existing Chamallaw workflow rows. The catalog checker documents this catalog as hand-maintained.
- `skills/workflow/chamallaw-shadow.md`: reference the existing canonical `skills/shared/preamble-friction.md` template. `bash scripts/sync-harness.sh` mechanically regenerated `.agents/skills/chamallaw-shadow/SKILL.md`, `.claude/commands/chamallaw-shadow.md`, and `.opencode/skills/chamallaw-shadow/SKILL.md`.

- `.harness/harness.json`: generator `node scripts/populate-manifest-skills.js --update` registered the two existing Chamallaw skills. `bash scripts/sync-harness.sh` mechanically regenerated `.claude/harness.json`; all other manifest fields stayed unchanged.

The original CJS/ESM fix remains in `.harness/bin/package.json`, `scripts/package.json`, the review bundle installer/manifest/checker/tests and harness sync/tests. No generic infrastructure, Observatory application or KB change was made.

## Verification

Node 22.23.3 binary: `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin/node`; its directory was first on PATH for verification.

- Clean `npm ci` in both isolated worktrees: exit 0. Dependency policy blocked esbuild postinstall; repository checks nevertheless executed.
- Exact-main `npm test` on Node 26.11.1 and Node 22.23.3: exit 0. Logs `/tmp/roster-pr86-main-test.log` and `/tmp/roster-pr86-main-node22-test.log`.
- Earlier merged full suite: exit 1 at catalog drift, then friction-shape after the catalog fix. These are PR ancestor failures, not failures on current upstream main.
- Combined focused suite: 100/100 passed on Node 26 and Node 22 before documentation corrections; final `d3d449fc` rerun passed 100/100 (exit 0), log `/tmp/roster-pr86-d3d449-focused-node22.log`.
- `node dist/scripts/check-catalog-sync.js`: exit 0, 27 agents / 39 skills / 7 rules.
- `node dist/scripts/check-friction-shape.js`: exit 0, 41 source skill files.
- `bash scripts/sync-harness.sh --check`: exit 0.
- `git diff --check`: exit 0.
- Final `d3d449fc` Node22 full `npm test`: exit 0; log `/tmp/roster-pr86-approved-final-node22-test.log`. Earlier stale layers.skills failure was corrected in a separate manifest commit.
- Final manifest check: exit 0 (42 entries including preambles). Final worktree is clean after removing test-generated Python bytecode; the original worktree remains clean.

Focused command: `node --test scripts/review-bundle.test.js scripts/review-bundle-install.test.js scripts/sync-harness-guard.test.js scripts/check-qa-convergence.test.js scripts/phase-guard-hooks.test.js scripts/chamallaw-shadow-report.test.js scripts/chamallaw-shadow-gate.test.js`.

## Remaining limits

Fresh independent review is owned by the root coordinator. Publication is not authorized. Repository PR merging is rebase-only; a separate linear candidate below preserves the reviewed tree and complies with that policy. Advisory unused enum warnings remain in the upstream full suite.

## Final changed paths versus upstream main

```text
.agents/skills/chamallaw-feedback/.roster-managed
.agents/skills/chamallaw-feedback/SKILL.md
.agents/skills/chamallaw-shadow/.roster-managed
.agents/skills/chamallaw-shadow/SKILL.md
.claude/commands/chamallaw-feedback.md
.claude/commands/chamallaw-shadow.md
.claude/harness.json
.harness/bin/package.json
.harness/harness.json
.opencode/skills/chamallaw-feedback/.roster-managed
.opencode/skills/chamallaw-feedback/SKILL.md
.opencode/skills/chamallaw-shadow/.roster-managed
.opencode/skills/chamallaw-shadow/SKILL.md
AGENTS.md
docs/agents.md
docs/chamallaw-roster.md
examples/chamallaw-shadow-evaluation.json
package.json
scripts/REVIEW-BUNDLE.md
scripts/chamallaw-shadow-gate.js
scripts/chamallaw-shadow-gate.test.js
scripts/chamallaw-shadow-report.js
scripts/chamallaw-shadow-report.test.js
scripts/check-hook-structure.test.ts
scripts/check-hook-structure.ts
scripts/extension-cli-arity.test.ts
scripts/extension-wrapper-rebuild.test.ts
scripts/extension/cli.ts
scripts/install-chamallaw-roster.sh
scripts/lib/bundle/review-bundle-check.js
scripts/package.json
scripts/review-bundle-install.sh
scripts/review-bundle-install.test.js
scripts/review-bundle-manifest.js
scripts/review-bundle.manifest.json
scripts/review-bundle.test.js
scripts/roster-extension.test.ts
scripts/roster-extension.ts
scripts/sync-harness-guard.test.js
scripts/sync-harness.sh
scripts/test-chamallaw-roster-install.sh
skills/workflow/chamallaw-feedback.md
skills/workflow/chamallaw-shadow.md
templates/chamallaw-roster/roster-intake-post.md
templates/chamallaw-roster/roster-ship-post.md
```

## Policy-compatible linear candidate

Read-only `gh api repos/mathiasbourgoin/roster` returned `allow_merge_commit=false`, `allow_squash_merge=false`, `allow_rebase_merge=true`. A fresh fetch confirmed upstream main remained `254e36b2ef2c0ca5ed65a9606e8689189a26b329`.

- Worktree `/tmp/roster-pr86-linear`, branch `fix/pr86-linear`.
- Candidate `64f5e278b2e04e6d10d3a77e2ac98dbf0ffeb0e8`, single parent `254e36b2ef2c0ca5ed65a9606e8689189a26b329`.
- Exactly one commit and zero merge commits above current main.
- Both candidate and independently approved integration `d3d449fc5900c71b34eb8443fefa3b4fab076f0f` have identical Git tree `d301ad376cb8c002c7b7bdb13bd620bddc409dec`. `git diff --exit-code d3d449fc HEAD` exited 0.
- Created by applying the complete approved binary-safe diff versus main into a new isolated worktree and committing once; existing commits and worktrees were preserved. Commit body records both traceability refs.
- Clean `npm ci` exited 0. Actual Node22.23.3 full `npm test` on this exact candidate exited 0; log `/tmp/roster-pr86-linear-node22-test.log`.

Final linear-candidate focused suite on Node22 also passed 100/100, exit 0; log `/tmp/roster-pr86-linear-focused-node22.log`. The linear worktree is clean after removal of test-generated Python bytecode. The prior reviewed integration and original PR worktrees remain clean.

Eventual publication should use the separate linear branch and repository rebase merge, subject to root governance and maintainer publication approval. No push, force push, PR creation or remote merge was performed.
