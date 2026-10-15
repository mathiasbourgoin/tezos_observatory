# PR86 CommonJS scope removal correction — implementation evidence

Final candidate **`4cd0f7800683aa957eaceb50bc84657bb1e2a2aa`**, tree **`c2b2a7553953805134546b48706daae5cdb76e96`**, sole parent **`2608681b9062b0d9d8929755a1c0b59282dffecf`**. Commit `fix: preserve shared commonjs scope on bundle removal`. Final status empty; committed diff whitespace and official generator freshness checks exit0. Seven source files changed: generator+generated manifest, lifecycle unit/integration tests, installer explanatory comment, consumer runbook and npm changelog. No other tracked file changed. Artifact is intentionally ignored and outside the committed source tree.

Author worktree `/tmp/roster-pr86-custody-fix`, branch `fix/pr86-preserve-scope`, based on exact2608681b9062b0d9d8929755a1c0b59282dffecf. The independent260 architect review and its original reproduced consumers remain preserved in `/tmp/roster-pr86-help/briefs/roster-pr86-architect-{evidence.md,findings.json}` and `/tmp/pr86-architect-custody-{De1Md2,WcfbMA}`. This correction is implementation work by that finding's author/reviewer after a separate assignment; independent new-candidate review is required. No QA or review GO is claimed.

The bundle accepted an existing identical `scripts/package.json`, then removed that boundary with the bundle, leaving unrelated CommonJS scripts under an ESM root. A second supported case creates the scope during bundle install, then the consumer adds CommonJS scripts that similarly depend on it. Both need preservation on removal.

The correction reuses the existing `shared` manifest mechanism; no custody registry, resolver, dependency or generic infrastructure. The generator marks only `scripts/package.json` shared. Existing remove/upgrade skip-shared paths retain the boundary, whether preexisting or bundle-created; existing collision and SHA verification logic is unchanged. Documentation explicitly states the intentional residual configuration after removal. Existing distribution spec C-7/FR123..137 and F-5 (`specs/review-tool-distribution.md:26`,63,122-124) define skip-shared removal and verification of shared files.

Exact260 bundle version was1.8.0. I explicitly selected1.9.0 for this compatible distribution change, with root concurrence; the official generator continues to preserve supplied versions and does not invent bumps. FR128 requires a bump when distributed documentation changes digest. `node scripts/review-bundle-manifest.js` regenerated the28-file manifest and new documentation digest; no hand-maintained digest.

## Actual RED → GREEN

Under supplied Node22.23.3, before implementation, added two real install/reinstall/upgrade/remove consumer fixtures plus one generator assertion. `node --test --test-name-pattern="remove preserves|generator: closure includes" scripts/review-bundle-install.test.js scripts/review-bundle.test.js` completed exit1:0pass/3fail. Both lifecycle fixtures reached the final consumer execution and failed with `ReferenceError: module is not defined in ES module scope`; generator assertion found shared undefined. Complete log `/tmp/pr86-custody-red.log`.

After the shared generator change and official manifest regeneration, identical command exit0:3pass/0fail/cancelled/skipped. `/tmp/pr86-custody-green.log`. Fixtures also assert unchanged user script/scope bytes, removed sentinel and removed nonshared tool. They run actual external installer and consumer Node processes; no mocked implementation.

## Gates

All commands run through rtk in this own checkout with PATH beginning `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin`, followed by `/home/mathias/.cargo/bin:/usr/local/bin:/usr/bin:/bin`. Build/full processes sequential.

- Clean `npm ci`: exit0, `/tmp/pr86-custody-ci.log`. Optional esbuild postinstall blocked by local allowScripts policy; actual subsequent build passes.
- `npm run build:ts`: exit0, `/tmp/pr86-custody-build.log`.
- `npm test`: exit0, `/tmp/pr86-custody-full.log`.42 anchored Node runner summaries,638pass/0fail/cancelled/skipped. This repository deliberately keeps the heavier installer test standalone, so the two new lifecycle tests are counted in focused execution, not added to this638. Catalog, schema, friction, manifest and final harness projection gates pass. Eight existing schema unused-value warnings and absent advisory cost log remain qualified.
- `node --test scripts/review-bundle-install.test.js scripts/review-bundle.test.js scripts/sync-harness-guard.test.js scripts/chamallaw-shadow-report.test.js scripts/chamallaw-shadow-gate.test.js dist/scripts/extension-cli-arity.test.js`: exit0,81pass/0fail/cancelled/skipped, `/tmp/pr86-custody-focused.log`; includes30 installer tests (28 previous plus2 new), installed ESM/QA/sync, all6 shadow regressions and real compiled executable help/usage streams.
- `node scripts/review-bundle-manifest.js --check`: exit0.
- `git diff --check`: exit0 before final commit.
- Actual migration probe: install from frozen exact260 checkout, upgrade from this corrected checkout, then remove. Every installer mode exit0; the installed upgraded manifest marks scope shared; consumer user script after removal exit0/stdout42. `/tmp/pr86-custody-upgrade.log`, retained consumer `/tmp/pr86-custody-upgrade-SNh6oB`. This executes real old→new manifests, complementing regression tests for repeat install/upgrade.

The one Unreleased/Fixed changelog entry was added after full-suite completion; it follows CHANGELOG.md's all-notable-changes contract and contains no executable change. Final focused execution and whitespace check include this final source state.

## Scope and operational limits

Read applicable unchanged exact260 AGENTS/rules/patterns and implementer/git-conventions skills. Original user library-index paths were stale; root supplied `/home/mathias/dev/library-index/data/INDEX.md`, searched its Roster entry confirming upstream reuse. Root owns annotation/render/commit via canonical CLI; I did not modify index exports. No publication, fetch, push, root source edits, ledger or central review state changes. Existing legacy bundle versions still behave according to their installed manifest; upgrading to the new manifest is required to obtain shared scope retention.

Git-conventions phase friction (stored here to preserve the scoped source change and avoid unrelated shared log mutation):

```json
{"date":"2026-10-15","skill":"git-conventions","task":"roster-pr86","frictions":["User library-index paths were stale; root supplied current data/INDEX.md and retained index update ownership."],"classes":["missing-artifact"],"methods":["isolated worktree","real lifecycle RED/GREEN","existing shared manifest mechanism"],"suggestion_type":null,"suggestion":null,"effort_estimate":null,"skipped":["Source skills-meta/friction.jsonl append: phase entry preserved in this isolated ignored implementation artifact to avoid unrelated shared log mutation."]}
```
